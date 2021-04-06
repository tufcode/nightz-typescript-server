import { Team } from './team';
import { Entity } from '../entity';
import { Box, Circle, Fixture, Vec2 } from 'planck-js';
import { Health } from './health';
import { Position } from './position';
import { clamp, randomRange } from '../utils';
import { AI } from './ai';
import { Movement } from './movement';
import { Rotation } from './rotation';
import { EntityCategory } from '../protocol';
import { Equipment } from './equipment';
import { Hand } from './items/hand';
import { Animation } from './animation';
import { EntityId } from '../data/entity-id';

export class ZombieAI extends AI {
  private _entitiesToDamage: Health[] = [];
  private _damageTick = 0;
  private targetPoint: Vec2;
  private patrolTick = 0;
  private hasTarget: boolean;
  private movementComponent: Movement;
  private attackFixture: Fixture;
  private attackSpeed = 2;
  private animationComponent: Animation;

  public constructor() {
    super();
    this.detectionShape = Circle(10);
  }

  public init() {
    super.init();
    const body = this.bodyComponent.getBody();
    body.createFixture({
      shape: this.detectionShape,
      filterCategoryBits: EntityCategory.SENSOR,
      filterMaskBits: EntityCategory.STRUCTURE | EntityCategory.PLAYER,
      isSensor: true,
    });

    this.movementComponent = <Movement>this.entity.getComponent(Movement);
    this.animationComponent = <Animation>this.entity.getComponent(Animation);

    this.attackFixture = body.createFixture({
      shape: Box(0.1, 0.4, Vec2(0.375 + 0.1, 0)),
      filterCategoryBits: EntityCategory.MELEE,
      filterMaskBits: EntityCategory.STRUCTURE | EntityCategory.RESOURCE | EntityCategory.PLAYER | EntityCategory.NPC,
      isSensor: true,
    });
    this.attackFixture.setUserData(true);
  }

  public onTriggerEnter(me: Fixture, other: Fixture): void {
    const isAttackFixture = me.getUserData() === true;
    const entity = <Entity>other.getBody().getUserData();
    // Check entity team
    const teamComponent = <Team>entity.getComponent(Team);
    if (teamComponent == null || !this.teamComponent.isHostileTowards(teamComponent)) return;
    // Get health component
    const entityHealthComponent = <Health>entity.getComponent(Health);

    if (isAttackFixture) {
      this._entitiesToDamage.push(entityHealthComponent);
    } else {
      // Add as a potential target
      if (entityHealthComponent != null) this.addTarget(<Entity>other.getBody().getUserData());
    }
  }

  public onTriggerExit(me: Fixture, other: Fixture): void {
    const isAttackFixture = me.getUserData() === true;
    const entity = <Entity>other.getBody().getUserData();

    // Check entity team
    const teamComponent = <Team>entity.getComponent(Team);
    if (teamComponent == null || !this.teamComponent.isHostileTowards(teamComponent)) return;

    // Get health component
    const entityHealthComponent = <Health>entity.getComponent(Health);

    // Don't waste CPU if health component is null
    if (entityHealthComponent == null) return;

    if (isAttackFixture) {
      this._entitiesToDamage.splice(this._entitiesToDamage.indexOf(entityHealthComponent), 1);
    } else {
      // Remove as a potential target
      this.removeTarget(<Entity>other.getBody().getUserData());
    }
  }

  public updateTargets(deltaTime: number): void {
    const body = this.bodyComponent.getBody();
    const myPosition = body.getPosition();

    this.hasTarget = this.targets.length != 0;
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

    if (this._entitiesToDamage.length > 0) {
      this._damageTick += deltaTime;
      if (this._damageTick >= 1 / this.attackSpeed) {
        this._damageTick = 0;
        for (let i = 0; i < this._entitiesToDamage.length; i++) {
          const h = this._entitiesToDamage[i];
          h.damage(randomRange(3, 6), this.entity);
        }
      }

      if (this.animationComponent.getAnimationId() == 0) {
        this.animationComponent.setAnimation(1, this.attackSpeed);
      }
    } else {
      if (this.animationComponent.getAnimationId() != 0) {
        this.animationComponent.setAnimation(0, 0);
      }
      this._damageTick = 0;
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
