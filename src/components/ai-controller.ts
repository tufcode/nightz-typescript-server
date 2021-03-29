import { Component } from './component';
import { Entity } from '../entity';
import { PhysicsBody } from './physics-body';
import { Circle, Fixture, Vec2 } from 'planck-js';
import { PositionAndRotation } from './position-and-rotation';
import { Health } from './health';
import { ComponentIds, EntityCategory } from '../protocol';
import { Client } from 'elsa';
import { Team } from './team';

export class AIController extends Component {
  public get isAttacking(): boolean {
    return this._isAttacking;
  }

  public set isAttacking(value: boolean) {
    this._isDirty = true;
    this.entity._isDirty = true;
    this._isAttacking = value;
  }

  public entity: Entity;

  private bodyComponent: PhysicsBody;
  private syncComponent: PositionAndRotation;
  private teamComponent: Team;

  private _isAttacking: boolean;
  private _isDirty: boolean;

  private speed = 40;
  private targets: Entity[] = [];
  private activeTarget: Entity;

  private _damageTick = 0;
  private _entitiesToDamage: Health[] = [];

  public init(): void {
    this.syncComponent = <PositionAndRotation>this.entity.getComponent(PositionAndRotation);
    this.bodyComponent = <PhysicsBody>this.entity.getComponent(PhysicsBody);
    this.teamComponent = <Team>this.entity.getComponent(Team);
    if (this.bodyComponent == null || this.syncComponent == null || this.teamComponent == null) {
      console.error('AIController requires Team, PhysicsBody and PositionAndRotation components.');
    }

    const body = this.bodyComponent.getBody();
    body.createFixture({
      shape: Circle(10),
      filterCategoryBits: body.getFixtureList().getFilterCategoryBits(),
      filterMaskBits: EntityCategory.PLAYER | EntityCategory.STRUCTURE,
      isSensor: true,
    });
  }

  public onTriggerEnter(me: Fixture, other: Fixture): void {
    // Check entity team
    const teamComponent = <Team>(<Entity>other.getBody().getUserData()).getComponent(Team);
    if (teamComponent == null || teamComponent.team == this.teamComponent.team) return;
    // Add as a potential target
    const entity = <Entity>other.getBody().getUserData();
    if (entity.getComponent(Health) != null) this.addTarget(<Entity>other.getBody().getUserData());
  }

  public onTriggerExit(me: Fixture, other: Fixture): void {
    // Remove as a potential target
    this.removeTarget(<Entity>other.getBody().getUserData());
  }

  public onCollisionEnter(me: Fixture, other: Fixture): void {
    // Check entity team
    const teamComponent = <Team>(<Entity>other.getBody().getUserData()).getComponent(Team);
    if (teamComponent == null || teamComponent.team == this.teamComponent.team) return;
    // Get entity health component
    const healthComponent = <Health>(<Entity>other.getBody().getUserData()).getComponent(Health);

    if (healthComponent != null) {
      // There is a health component, we can damage this entity.
      this._entitiesToDamage.push(healthComponent);
    }
  }

  public onCollisionExit(me: Fixture, other: Fixture): void {
    const healthComponent = <Health>(<Entity>other.getBody().getUserData()).getComponent(Health);

    if (healthComponent != null) {
      this._entitiesToDamage.splice(this._entitiesToDamage.indexOf(healthComponent), 1);
    }
  }

  public update(deltaTime: number): void {
    const body = this.bodyComponent.getBody();

    // Update active target
    const myPosition = body.getPosition();
    let bestDistance = Number.MAX_VALUE;
    for (let i = 0; i < this.targets.length; i++) {
      const target = this.targets[i];
      const targetHealthComponent = <Health>target.getComponent(Health);
      if (targetHealthComponent.isDead()) {
        this.removeTarget(target);
        continue;
      }

      const targetPositionComponent = <PositionAndRotation>target.getComponent(PositionAndRotation);
      const targetPos = targetPositionComponent.position;

      const distance = Vec2.distance(myPosition, targetPos);

      if (targetHealthComponent.isDead()) {
        this.removeTarget(this.activeTarget);
      }

      if (distance < bestDistance) {
        bestDistance = distance;
        this.activeTarget = target;
      }
    }

    // Damage colliding entities every 0.5 second
    this._damageTick += deltaTime;
    if (this._damageTick >= 0.5) {
      let didAttack = false;
      this._damageTick = 0;
      for (let i = 0; i < this.targets.length; i++) {
        const targetPos = (<PositionAndRotation>this.targets[i].getComponent(PositionAndRotation)).position;
        const distance = Vec2.distance(myPosition, targetPos);
        if (distance <= 1.1) {
          didAttack = true;
          (<Health>this.targets[i].getComponent(Health)).currentHealth -= 8;
        }
      }

      if (didAttack) this.isAttacking = true;
      else this.isAttacking = false;
    }

    const targetVelocity = Vec2.zero();

    const hasMoveInput = this.activeTarget != null;

    if (hasMoveInput) {
      const angle = body.getAngle();
      targetVelocity.x = Math.cos(angle);
      targetVelocity.y = Math.sin(angle);

      targetVelocity.normalize();
      targetVelocity.mul(this.speed);

      const currentVelocity = body.getLinearVelocity();
      const velocityChange = Vec2.sub(targetVelocity, currentVelocity);

      body.applyLinearImpulse(velocityChange, body.getWorldCenter(), true);

      // Set angle
      const targetPos = (<PositionAndRotation>this.activeTarget.getComponent(PositionAndRotation)).position;
      const targetAngle = Math.atan2(targetPos.y - myPosition.y, targetPos.x - myPosition.x);
      if (targetAngle.toFixed(2) != body.getAngle().toFixed(2)) {
        body.setAngle(targetAngle);
        this.syncComponent.angle = body.getAngle();
      }
    }

    if (body.isAwake()) {
      this.syncComponent.position = body.getPosition();
    }
  }

  public addTarget(entity: Entity): void {
    this.targets.push(entity);
  }

  public removeTarget(entity: Entity): void {
    if (this.activeTarget != null && entity.objectId == this.activeTarget.objectId) {
      this.activeTarget = null;
    }

    this.targets.splice(this.targets.indexOf(entity), 1);
  }

  public serialize(client: Client, initialization?: boolean): Buffer {
    if (!this._isDirty && !initialization) return null;
    this._isDirty = false;

    const buf = Buffer.allocUnsafe(2);
    // Packet Id
    buf.writeUInt8(ComponentIds.Character, 0);
    // Max
    buf.writeUInt8(Number(this.isAttacking), 1);

    return buf;
  }
}
