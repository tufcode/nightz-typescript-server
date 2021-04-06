import { Consumable } from './consumable';
import { Vec2 } from 'planck-js';
import { Entity } from '../../entity';
import { PhysicsBody } from '../physics-body';
import { EntityCategory } from '../../protocol';
import { ItemSlot } from '../inventory';
import { World } from '../../systems/world';
import { Construction } from '../construction';
import { EntityId } from '../../data/entity-id';

export class BuildingBlock extends Consumable {
  private createCallback: (world: World, position: Vec2, angle: number) => Entity;
  private permissionCallback: (position: Vec2, angle: number) => boolean;
  private failureCallback: () => void;
  public constructor(
    type: ItemSlot,
    permissionCallback: (position: Vec2, angle: number) => boolean,
    failureCallback: () => void,
    createCallback: (world: World, position: Vec2, angle: number) => Entity,
  ) {
    super(type);
    this.permissionCallback = permissionCallback;
    this.failureCallback = failureCallback;
    this.createCallback = createCallback;
  }

  protected onConsume(): void {
    const body = (<PhysicsBody>this.inventory.entity.getComponent(PhysicsBody)).getBody();
    const pos = body.getWorldPoint(Vec2(1, 0));

    if (!this.permissionCallback(pos, body.getAngle())) {
      this.failureCallback();
      return;
    }

    const placedEntity = this.createCallback(this.entity.world, pos, body.getAngle());
    const placedBody = (<PhysicsBody>placedEntity.getComponent(PhysicsBody)).getBody();
    placedBody.setType('dynamic');
    placedBody.setFixedRotation(true);
    placedBody.setLinearDamping(10);
    const fixture = placedBody.getFixtureList();
    fixture.setFilterData({
      groupIndex: fixture.getFilterGroupIndex(),
      categoryBits: fixture.getFilterCategoryBits(),
      maskBits: EntityCategory.BOUNDARY | EntityCategory.STRUCTURE | EntityCategory.RESOURCE,
    });

    placedEntity.addComponent(new Construction(this.failureCallback, this.createCallback));
  }
}
