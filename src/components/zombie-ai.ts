import { Team } from './team';
import { Entity } from '../entity';
import { Circle, Fixture, Vec2 } from 'planck-js';
import { Health } from './health';
import { Position } from './position';
import { clamp, randomRange } from '../utils';
import { AI } from './ai';
import { Movement } from './movement';
import { Rotation } from './rotation';

export class ZombieAI extends AI {
  private _entitiesToDamage: Health[] = [];
  private idleMode: boolean;
  private _damageTick = 0;
  private targetPoint: Vec2;
  private patrolTick = 0;
  private hasTarget: boolean;
  private movementComponent: Movement;

  public constructor() {
    super();
    this.detectionShape = Circle(10);
  }

  public init() {
    super.init();
    this.movementComponent = <Movement>this.entity.getComponent(Movement);
  }

  public onCollisionEnter(me: Fixture, other: Fixture): void {
    // Check entity team
    const teamComponent = <Team>(<Entity>other.getBody().getUserData()).getComponent(Team);
    if (teamComponent == null || teamComponent.id == this.teamComponent.id) return;
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

  public updateTargets(deltaTime: number): void {
    const body = this.bodyComponent.getBody();
    const myPosition = body.getPosition();

    this.hasTarget = this.targets.length == 0;
    if (!this.hasTarget) {
      // Patrol
      this.patrolTick += deltaTime;
      if (this.patrolTick >= 5) {
        this.patrolTick = 0;
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
    } else {
      // Update active target
      let bestDistance = Number.MAX_VALUE;
      for (let i = 0; i < this.targets.length; i++) {
        const target = this.targets[i];
        const targetHealthComponent = <Health>target.getComponent(Health);
        if (targetHealthComponent.isDead) {
          this.removeTarget(target);
          continue;
        }

        const targetPositionComponent = <Position>target.getComponent(Position);
        const targetPos = targetPositionComponent.position;

        const distance = Vec2.distance(myPosition, targetPos);

        if (distance < bestDistance) {
          bestDistance = distance;
          this.activeTarget = target;
        }
      }
    }
  }

  public executeActions(deltaTime: number): void {
    const body = this.bodyComponent.getBody();
    const myPosition = body.getPosition();
    // Damage colliding entities every 0.5 second
    this._damageTick += deltaTime;
    if (this._damageTick >= 0.5) {
      let didAttack = false;
      this._damageTick = 0;
      for (let i = 0; i < this.targets.length; i++) {
        const targetPos = (<Position>this.targets[i].getComponent(Position)).position;
        const distance = Vec2.distance(myPosition, targetPos);
        if (distance <= 1.1) {
          didAttack = true;
          (<Health>this.targets[i].getComponent(Health)).damage(8, this.entity);
        }
      }
    }

    // Move and rotate as needed
    if (this.activeTarget != null) {
      this.targetPoint = (<Position>this.activeTarget.getComponent(Position)).position;
    } else if (!this.hasTarget && this.targetPoint != null) {
      if (Vec2.distance(this.targetPoint, myPosition) < 0.1) this.targetPoint = null;
    }

    if (this.targetPoint != null) {
      this.movementComponent.move(Vec2(this.targetPoint.x - myPosition.x, this.targetPoint.y - myPosition.y));

      const targetAngle = Math.atan2(this.targetPoint.y - myPosition.y, this.targetPoint.x - myPosition.x);
      body.setAngle(targetAngle);
    }
  }
}
