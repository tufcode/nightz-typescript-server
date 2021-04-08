import { Consumable } from './consumable';
import { AABB, Vec2 } from 'planck-js';
import { Entity } from '../../entity';
import { PhysicsBody } from '../physics-body';
import { EntityCategory, getBytes, Protocol } from '../../protocol';
import { ItemSlot } from '../inventory';
import { World } from '../../systems/world';
import { Construction } from '../construction';
import { EntityId } from '../../data/entity-id';
import { Position } from '../position';
import { Rotation } from '../rotation';
import { Observable } from '../observable';
import { Gold } from '../gold';

export class BuildingBlock extends Consumable {
  private createCallback: (world: World, position: Vec2, angle: number) => Entity;
  private permissionCallback: (position: Vec2, angle: number) => boolean;
  private failureCallback: () => void;
  private radius: number;
  private requiredGold: number;
  public constructor(
    type: ItemSlot,
    radius: number,
    requiredGold: number,
    createCallback: (world: World, position: Vec2, angle: number) => Entity,
  ) {
    super(type);
    this.radius = radius;
    this.requiredGold = requiredGold;
    this.createCallback = createCallback;
  }

  protected onConsume(): void {
    const body = (<PhysicsBody>this.inventory.entity.getComponent(PhysicsBody)).getBody();
    const pos = body.getWorldPoint(Vec2(1, 0));

    const goldComponent = <Gold>this.parent.getComponent(Gold);
    if (goldComponent.amount < this.requiredGold) {
      this.parent.owner.send(getBytes[Protocol.TemporaryMessage]('NotEnoughGold', 2));
      return;
    }

    goldComponent.amount -= this.requiredGold;

    const aabbLower = pos.clone().sub(Vec2(this.radius, this.radius));
    const aabbUpper = pos.clone().add(Vec2(this.radius, this.radius));
    const aabb = new AABB(aabbLower, aabbUpper);
    let canPlace = true;
    this.entity.world.getPhysicsWorld().queryAABB(aabb, (f) => {
      canPlace =
        (f.getFilterCategoryBits() & EntityCategory.PLAYER) == EntityCategory.PLAYER ||
        (f.getFilterCategoryBits() & EntityCategory.SENSOR) == EntityCategory.SENSOR ||
        (f.getFilterCategoryBits() & EntityCategory.MELEE) == EntityCategory.MELEE ||
        (f.getFilterCategoryBits() & EntityCategory.BULLET) == EntityCategory.BULLET;
      return canPlace;
    });

    if (canPlace) this.createCallback(this.entity.world, pos, body.getAngle());
    else {
      goldComponent.amount += this.requiredGold;
    }
  }
}
