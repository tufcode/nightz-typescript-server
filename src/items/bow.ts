import { Health } from '../components/health';
import { Animation } from '../components/animation';
import { Item } from './item';
import { FoodBag } from '../components/food-bag';
import { Projectile } from '../components/projectile';
import { Body, Vec2 } from 'planck-js';
import { createProjectile } from '../prefabs/projectile';
import { EntityId } from '../data/entity-id';
import { PhysicsBody } from '../components/physics-body';
import { Team } from '../components/team';
import * as planck from 'planck-js';
import { Stone } from '../components/stone';
import { Wood } from '../components/wood';
import { ItemType } from '../components/inventory';

export class Bow extends Item {
  private _attackTick = 0;
  private attackSpeed = 100;
  private parentBody: Body;
  private parentTeam: Team;
  private damageToPlayers: number;
  private damageToStructures: number;
  private damageToZombies: number;
  private knockbackForce: number;
  private maxTravelDistance: number;

  public constructor(
    entityId: EntityId,
    type: ItemType,
    movementSpeedMultiplier: number,
    requiredStone = 0,
    requiredFood = 0,
    requiredWood = 0,
    attackSpeed: number,
    damageToPlayers: number,
    damageToStructures: number,
    damageToZombies: number,
    knockbackForce: number,
    maxTravelDistance: number,
  ) {
    super(entityId, type, movementSpeedMultiplier, requiredStone, requiredFood, requiredWood);
    this.attackSpeed = attackSpeed;
    this.damageToPlayers = damageToPlayers;
    this.damageToStructures = damageToStructures;
    this.damageToZombies = damageToZombies;
    this.knockbackForce = knockbackForce;
    this.maxTravelDistance = maxTravelDistance;
  }

  public onEquip() {
    super.onEquip();
    this.parentBody = (<PhysicsBody>this.parent.getComponent(PhysicsBody)).getBody();
    this.parentTeam = <Team>this.parent.getComponent(Team);
  }

  public update(deltaTime: number): void {
    this._attackTick += deltaTime;
    if (this._primary) {
      if (this._attackTick >= 1 / this.attackSpeed) {
        this._attackTick = 0;

        // TODO do not copy paste this, just make it an utility function
        const stoneComponent = <Stone>this.parent.getComponent(Stone);
        const woodComponent = <Wood>this.parent.getComponent(Wood);
        const foodComponent = <FoodBag>this.parent.getComponent(FoodBag);

        if (this.requiredStone > 0) {
          if (stoneComponent.amount < this.requiredStone) {
            return;
          }
          stoneComponent.amount -= this.requiredStone;
        }
        if (this.requiredWood > 0) {
          if (woodComponent.amount < this.requiredWood) {
            if (this.requiredStone > 0) {
              stoneComponent.amount += this.requiredStone;
            }
            return;
          }
          woodComponent.amount -= this.requiredWood;
        }
        if (this.requiredFood > 0) {
          if (foodComponent.amount < this.requiredFood) {
            if (this.requiredStone > 0) {
              stoneComponent.amount += this.requiredStone;
            }
            if (this.requiredWood > 0) {
              woodComponent.amount += this.requiredWood;
            }
            return;
          }
          foodComponent.amount -= this.requiredFood;
        }

        const projectile = new Projectile(
          20,
          this.maxTravelDistance,
          this.damageToPlayers,
          this.damageToZombies,
          this.damageToStructures,
          this.knockbackForce,
        );
        projectile.setDir(this.parentBody.getWorldVector(Vec2(1, 0)).clone());
        createProjectile(
          EntityId.ArrowBasic,
          projectile,
          this.parent.world,
          this.parentBody
            .getWorldCenter()
            .clone()
            .add(this.parentBody.getWorldVector(Vec2(1, 0))),
          this.parentBody.getAngle(),
          planck.Box(0.5, 0.15),
          this.parentTeam.id,
          this.parent.owner,
        );
      }
    }
  }
}
