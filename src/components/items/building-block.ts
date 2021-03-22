import { Item, ItemState } from './item';
import { Consumable } from './consumable';
import * as planck from 'planck-js';
import { Entity } from '../../entity';
import { PhysicsBody } from '../physics-body';
import { Equipped } from '../equipped';
import { Inventory } from '../inventory';
import { CharacterController } from '../character-controller';
import { NameTag } from '../name-tag';
import { AABB, Vec2 } from 'planck-js';
import { PositionAndRotation } from '../position-and-rotation';
import { ComponentIds, EntityCategory, getBytes, Protocol } from '../../protocol';
import { Client } from 'elsa';

export class BuildingBlock extends Consumable {
  protected onConsume() {
    let pos: Vec2;
    const physicsComponent = <PhysicsBody>this.inventory.entity.getComponent(PhysicsBody);
    if (physicsComponent == null)
      pos = (<PositionAndRotation>this.inventory.entity.getComponent(PositionAndRotation)).vec;
    else pos = physicsComponent.getBody().getWorldPoint(Vec2(1, 0));

    let canPlace = true;
    const aabb = new AABB(Vec2(pos.x - 0.5, pos.y - 0.5), Vec2(pos.x + 0.5, pos.y + 0.5));
    this.entity.world.getPhysicsWorld().queryAABB(aabb, (fixture) => {
      canPlace = (fixture.getFilterCategoryBits() & EntityCategory.PLAYER) == EntityCategory.PLAYER;
      return canPlace;
    });

    console.log('Create?', canPlace);
    if (!canPlace) {
      if (this.inventory.entity.owner != null)
        this.inventory.entity.owner.send(getBytes[Protocol.TemporaryMessage]('Occupied', 2));
      return;
    }

    let body = this.entity.world.getPhysicsWorld().createBody({
      type: 'static',
      position: pos,
      fixedRotation: true,
      angle: physicsComponent.getBody().getAngle(),
    });
    body.createFixture({
      shape: planck.Box(0.5, 0.5),
      density: 0.0,
      filterCategoryBits: EntityCategory.STRUCTURE,
      filterMaskBits:
        EntityCategory.PLAYER |
        EntityCategory.BOUNDARY |
        EntityCategory.BULLET |
        EntityCategory.NPC |
        EntityCategory.STRUCTURE,
    });

    // Create player entity
    const entity = new Entity('Box', this.entity.world);
    entity.addComponent(new PhysicsBody(body));
    (<NameTag>entity.addComponent(new NameTag())).setName('Box ' + Date.now());

    this.entity.world.addEntity(entity);

    //this.entity.destroy();
  }
}
