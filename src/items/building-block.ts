import { Consumable } from './consumable';
import { AABB, Vec2 } from 'planck-js';
import { Entity } from '../entity';
import { PhysicsBody } from '../components/physics-body';
import { EntityCategory, getBytes, Protocol } from '../protocol';
import { ItemType } from '../components/inventory';
import { World } from '../systems/world';
import { Construction } from '../components/construction';
import { EntityId } from '../data/entity-id';
import { Position } from '../components/position';
import { Rotation } from '../components/rotation';
import { Observable } from '../components/observable';
import { Gold } from '../components/gold';
import { Wood } from '../components/wood';
import { Stone } from '../components/stone';
import { Item } from './item';
import { FoodBag } from '../components/food-bag';
import { Health } from '../components/health';

export class BuildingBlock extends Item {
  private createCallback: (world: World, position: Vec2, angle: number) => Entity;
  private radius: number;
  public constructor(
    entityId: EntityId,
    type: ItemType,
    radius: number,
    movementSpeedMultiplier: number,
    requiredWood: number,
    requiredStone: number,
    requiredFood: number,
    maximumUse: number,
    usageMeterId: string,
    createCallback: (world: World, position: Vec2, angle: number) => Entity,
  ) {
    super(entityId, type, movementSpeedMultiplier, requiredStone, requiredFood, requiredWood, usageMeterId);
    this.radius = radius;
    this.createCallback = createCallback;
    this.maximumUse = maximumUse;
  }

  public setPrimary(b: boolean): void {
    if (!this._primary && b) {
      this.onConsume();
    }
    super.setPrimary(b);
  }

  protected onConsume(): void {
    if (!this.inventory.itemUses.hasOwnProperty(this.usageMeterId)) this.inventory.itemUses[this.usageMeterId] = 0;
    if (this.inventory.itemUses[this.usageMeterId] >= this.maximumUse) return;

    const body = (<PhysicsBody>this.inventory.entity.getComponent(PhysicsBody)).getBody();
    const pos = body.getWorldPoint(Vec2(this.radius * 4, 0));

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

    const aabbLower = pos.clone().sub(Vec2(this.radius, this.radius));
    const aabbUpper = pos.clone().add(Vec2(this.radius, this.radius));
    const aabb = new AABB(aabbLower, aabbUpper);
    let canPlace = true;
    this.parent.world.getPhysicsWorld().queryAABB(aabb, (f) => {
      canPlace =
        (f.getFilterCategoryBits() & EntityCategory.PLAYER) == EntityCategory.PLAYER ||
        (f.getFilterCategoryBits() & EntityCategory.SHIELD) == EntityCategory.SHIELD ||
        (f.getFilterCategoryBits() & EntityCategory.MELEE) == EntityCategory.MELEE ||
        (f.getFilterCategoryBits() & EntityCategory.BULLET) == EntityCategory.BULLET ||
        (f.getFilterCategoryBits() & EntityCategory.SENSOR) == EntityCategory.SENSOR;
      return canPlace;
    });

    if (canPlace) {
      const createdHealth = <Health>this.createCallback(this.parent.world, pos, body.getAngle()).getComponent(Health);
      if (createdHealth != null) {
        createdHealth.on('damage', () => {
          if (createdHealth.isDead) {
            this.inventory.itemUses[this.usageMeterId]--;
            this.inventory.sendUpdate();
          }
        });
      }

      this.inventory.itemUses[this.usageMeterId]++;
      this.inventory.sendUpdate();
    } else {
      if (this.requiredStone > 0) {
        stoneComponent.amount += this.requiredStone;
      }
      if (this.requiredWood > 0) {
        woodComponent.amount += this.requiredWood;
      }
      if (this.requiredFood > 0) {
        foodComponent.amount += this.requiredFood;
      }
    }
  }
}
