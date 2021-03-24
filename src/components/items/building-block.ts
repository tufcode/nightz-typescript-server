import { Consumable } from './consumable';
import * as planck from 'planck-js';
import { Entity } from '../../entity';
import { PhysicsBody } from '../physics-body';
import { NameTag } from '../name-tag';
import { AABB, Vec2 } from 'planck-js';
import { PositionAndRotation } from '../position-and-rotation';
import { EntityCategory, getBytes, Protocol } from '../../protocol';
import { AIController } from '../ai-controller';

export class BuildingBlock extends Consumable {
  protected onConsume(): void {
    let pos: Vec2;
    const physicsComponent = <PhysicsBody>this.inventory.entity.getComponent(PhysicsBody);
    if (physicsComponent == null)
      pos = (<PositionAndRotation>this.inventory.entity.getComponent(PositionAndRotation)).position;
    else pos = physicsComponent.getBody().getWorldPoint(Vec2(1, 0));

    let canPlace = true;
    const aabb = new AABB(Vec2(pos.x, pos.y), Vec2(pos.x + 0.5, pos.y + 0.5));
    this.entity.world.getPhysicsWorld().queryAABB(aabb, (fixture) => {
      console.log(
        aabb.getCenter(),
        aabb.getPerimeter(),
        (<Entity>fixture.getBody().getUserData()).getComponent(AIController) == null,
      );
      canPlace = (fixture.getFilterCategoryBits() & EntityCategory.PLAYER) == EntityCategory.PLAYER;
      return canPlace;
    });

    console.log('Create?', canPlace);
    if (!canPlace) {
      if (this.inventory.entity.owner != null)
        this.inventory.entity.owner.send(getBytes[Protocol.TemporaryMessage]('Occupied', 2));
      return;
    }

    const body = this.entity.world.getPhysicsWorld().createBody({
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
    entity.addComponent(new PositionAndRotation(body.getPosition(), body.getAngle()));
    (<NameTag>entity.addComponent(new NameTag())).setName('Box ' + Date.now());

    this.entity.world.addEntity(entity);

    //this.entity.destroy();
  }
}
