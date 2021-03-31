import { Component } from './component';
import { Entity } from '../entity';
import { PhysicsBody } from './physics-body';
import { Body, Circle, Fixture, Vec2 } from 'planck-js';
import { PositionAndRotation } from './position-and-rotation';
import { Health } from './health';
import { ComponentIds, EntityCategory } from '../protocol';
import { Client } from 'elsa';
import { Team } from './team';
import { Animation } from './animation';
import { clamp, randomRange } from '../utils';

export class AIController extends Component {
  private bodyComponent: PhysicsBody;
  private syncComponent: PositionAndRotation;
  private teamComponent: Team;
  private animationComponent: Animation;

  private speed = 40;
  private targets: Entity[] = [];
  private activeTarget: Entity;

  private idleMode: boolean;
  private targetReached = true;
  private patrolTick = 0;
  private targetPoint: Vec2 = null;

  private _damageTick = 0;
  private _entitiesToDamage: Health[] = [];

  public init(): void {
    this.syncComponent = <PositionAndRotation>this.entity.getComponent(PositionAndRotation);
    this.bodyComponent = <PhysicsBody>this.entity.getComponent(PhysicsBody);
    this.teamComponent = <Team>this.entity.getComponent(Team);
    this.animationComponent = <Animation>this.entity.getComponent(Animation);
    if (this.bodyComponent == null || this.syncComponent == null || this.teamComponent == null) {
      console.error('AIController requires Team, PhysicsBody and PositionAndRotation components.');
    }

    const body = this.bodyComponent.getBody();
    body.createFixture({
      shape: Circle(10),
      filterCategoryBits: EntityCategory.SENSOR, // todo better categories
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
    const myPosition = body.getPosition();

    this.idleMode = this.targets.length == 0;

    if (!this.idleMode) {
      this.targetReached = true;
      // Update active target
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
            (<Health>this.targets[i].getComponent(Health)).damage(8, this.entity);
          }
        }

        if (didAttack) {
          if (this.animationComponent.getAnimationId() == 0) this.animationComponent.setAnimation(1, 2);
        } else if (this.animationComponent.getAnimationId() == 1) {
          this.animationComponent.setAnimation(0, 0);
        }
      }
    } else if (this.targetReached) {
      this.targetPoint = null;
      this.patrolTick += deltaTime;
      if (this.patrolTick >= 5) {
        this.patrolTick = 0;
        // Patrol every 5 minutes
        this.targetPoint = Vec2(
          clamp(
            randomRange(myPosition.x - 10, myPosition.x + 10),
            -(this.entity.world.bounds.x / 2),
            this.entity.world.bounds.x / 2,
          ),
          clamp(
            randomRange(myPosition.y - 10, myPosition.y + 10),
            -(this.entity.world.bounds.y / 2),
            this.entity.world.bounds.y / 2,
          ),
        );
      }
    }

    if (this.idleMode && this.targetPoint != null) {
      this.move(body, this.targetPoint);
      this.targetReached = Vec2.distance(this.targetPoint, myPosition) < 0.1;
    } else if (this.activeTarget != null) {
      this.move(body, (<PositionAndRotation>this.activeTarget.getComponent(PositionAndRotation)).position);
    }

    if (body.isAwake()) {
      this.syncComponent.position = body.getPosition();
    }
  }

  public move(body: Body, targetPos: Vec2): void {
    const myPosition = body.getPosition();
    const angle = body.getAngle();
    const targetVelocity = Vec2.zero();
    targetVelocity.x = Math.cos(angle);
    targetVelocity.y = Math.sin(angle);

    targetVelocity.normalize();
    targetVelocity.mul(this.speed);

    const currentVelocity = body.getLinearVelocity();
    const velocityChange = Vec2.sub(targetVelocity, currentVelocity);

    body.applyLinearImpulse(velocityChange, body.getWorldCenter(), true);

    // Set angle
    const targetAngle = Math.atan2(targetPos.y - myPosition.y, targetPos.x - myPosition.x);
    if (targetAngle.toFixed(2) != angle.toFixed(2)) {
      body.setAngle(targetAngle);
      this.syncComponent.angle = targetAngle;
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
}
