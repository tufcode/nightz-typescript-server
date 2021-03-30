import { Item, ItemState } from './item';
import { Entity } from '../entity';
import { PositionAndRotation } from '../components/position-and-rotation';
import { Box, Circle, Fixture } from 'planck-js';
import { EntityCategory } from '../protocol';
import { PhysicsBody } from '../components/physics-body';

export class Axe extends Item {
  private fixture: Fixture;
  public onEquip(entity: Entity): void {
    const body = (<PhysicsBody>entity.getComponent(PhysicsBody)).getBody();
    this.fixture = body.createFixture({
      shape: Box(0.25, 0.25),
      filterCategoryBits: body.getFixtureList().getFilterCategoryBits(),
      filterMaskBits:
        EntityCategory.PLAYER |
        EntityCategory.BOUNDARY |
        EntityCategory.BULLET |
        EntityCategory.NPC |
        EntityCategory.STRUCTURE,
      isSensor: true,
    });
  }

  public primaryStart(entity: Entity): void {
    const positionComponent = <PositionAndRotation>entity.getComponent(PositionAndRotation);
    console.log(Date.now(), 'ATTACK!', positionComponent.position);
  }
}
