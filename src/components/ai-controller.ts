import { Entity } from '../entity';
import { Circle, Fixture, Vec2 } from 'planck-js';
import { PositionAndRotation } from './position-and-rotation';
import { Health } from './health';
import { EntityCategory } from '../protocol';
import { Team } from './team';
import { Animation } from './animation';
import { clamp, randomRange } from '../utils';
import { Character } from './character';

export class AIController extends Character {
  private teamComponent: Team;
  private animationComponent: Animation;

  private targets: Entity[] = [];
  private activeTarget: Entity;

  private idleMode: boolean;
  private patrolTick = 0;
  private targetPoint: Vec2 = null;

  private _damageTick = 0;
  private _entitiesToDamage: Health[] = [];

  public init(): void {
    super.init();
    this.teamComponent = <Team>this.entity.getComponent(Team);
    this.animationComponent = <Animation>this.entity.getComponent(Animation);
    if (this.teamComponent == null) {
      console.error('AIController requires Team components.');
    }

    const body = this.bodyComponent.getBody();
    body.createFixture({
      shape: Circle(Vec2.zero(), 10),
      filterCategoryBits: EntityCategory.SENSOR,
      filterMaskBits: EntityCategory.STRUCTURE | EntityCategory.PLAYER,
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
    super.update(deltaTime);
    const body = this.bodyComponent.getBody();
    const myPosition = body.getPosition();
    const angle = body.getAngle();

    this.idleMode = this.targets.length == 0;

    if (!this.idleMode) {
      // Update active target
      let bestDistance = Number.MAX_VALUE;
      for (let i = 0; i < this.targets.length; i++) {
        const target = this.targets[i];
        const targetHealthComponent = <Health>target.getComponent(Health);
        if (targetHealthComponent.isDead) {
          this.removeTarget(target);
          continue;
        }

        const targetPositionComponent = <PositionAndRotation>target.getComponent(PositionAndRotation);
        const targetPos = targetPositionComponent.position;

        const distance = Vec2.distance(myPosition, targetPos);

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
    } else if (this.targetPoint == null) {
      this.patrolTick += deltaTime;
      if (this.patrolTick >= 5) {
        this.patrolTick = 0;
        // Patrol every 5 seconds
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

    if (this.activeTarget != null) {
      this.targetPoint = (<PositionAndRotation>this.activeTarget.getComponent(PositionAndRotation)).position;
    } else if (this.idleMode && this.targetPoint != null) {
      if (Vec2.distance(this.targetPoint, myPosition) < 0.1) this.targetPoint = null;
    }

    if (this.targetPoint != null) {
      const input = Vec2(this.targetPoint.x - myPosition.x, this.targetPoint.y - myPosition.y);
      this.move(body, input, deltaTime);

      const targetAngle = Math.atan2(this.targetPoint.y - myPosition.y, this.targetPoint.x - myPosition.x);
      if (targetAngle.toFixed(2) != angle.toFixed(2)) {
        body.setAngle(targetAngle);
      }
    }
  }

  public addTarget(entity: Entity): void {
    this.targets.push(entity);
  }

  public removeTarget(entity: Entity): void {
    if (this.activeTarget != null && entity.objectId == this.activeTarget.objectId) {
      this.activeTarget = null;
    }

    const i = this.targets.indexOf(entity);

    if (i != -1) this.targets.splice(i, 1);
  }
}
