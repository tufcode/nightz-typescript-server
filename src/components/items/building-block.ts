import { Consumable } from './consumable';
import { AABB, Vec2 } from 'planck-js';
import { Entity } from '../../entity';
import { PhysicsBody } from '../physics-body';
import { EntityCategory, getBytes, Protocol } from '../../protocol';
import { ItemType } from '../inventory';
import { World } from '../../systems/world';
import { Construction } from '../construction';
import { EntityId } from '../../data/entity-id';
import { Position } from '../position';
import { Rotation } from '../rotation';
import { Observable } from '../observable';
import { Gold } from '../gold';
import { Wood } from '../wood';
import { Stone } from '../stone';
import { Item } from './item';
import { FoodBag } from '../food-bag';

export class BuildingBlock extends Item {
  private createCallback: (world: World, position: Vec2, angle: number) => Entity;
  private permissionCallback: (position: Vec2, angle: number) => boolean;
  private failureCallback: () => void;
  private radius: number;
  private requiredGold: number;
  public constructor(
    entityId: EntityId,
    type: ItemType,
    radius: number,
    requiredWood: number,
    requiredStone: number,
    requiredFood: number,
    createCallback: (world: World, position: Vec2, angle: number) => Entity,
  ) {
    super(entityId, type, requiredStone, requiredFood, requiredWood);
    this.radius = radius;
    this.createCallback = createCallback;
  }

  public setPrimary(b: boolean): void {
    if (!this._primary && b) {
      this.onConsume();
    }
    super.setPrimary(b);
  }

  protected onConsume(): void {
    const body = (<PhysicsBody>this.inventory.entity.getComponent(PhysicsBody)).getBody();
    const pos = body.getWorldPoint(Vec2(1, 0));

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
        (f.getFilterCategoryBits() & EntityCategory.SENSOR) == EntityCategory.SENSOR ||
        (f.getFilterCategoryBits() & EntityCategory.MELEE) == EntityCategory.MELEE ||
        (f.getFilterCategoryBits() & EntityCategory.BULLET) == EntityCategory.BULLET;
      return canPlace;
    });

    if (canPlace) this.createCallback(this.parent.world, pos, body.getAngle());
    else {
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
