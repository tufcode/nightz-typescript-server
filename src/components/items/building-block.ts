import { Consumable } from './consumable';
import * as planck from 'planck-js';
import { Entity } from '../../entity';
import { PhysicsBody } from '../physics-body';
import { NameTag } from '../name-tag';
import { AABB, Vec2 } from 'planck-js';
import { PositionAndRotation } from '../position-and-rotation';
import { EntityCategory, getBytes, Protocol } from '../../protocol';
import { AIController } from '../ai-controller';
import { SyncScale } from '../sync-scale';

export class BuildingBlock extends Consumable {
  protected onConsume(): void {
    const body = (<PhysicsBody>this.inventory.entity.getComponent(PhysicsBody)).getBody();
    const pos = body.getWorldPoint(Vec2(1, 0));

    const placedBody = this.entity.world.getPhysicsWorld().createBody({
      type: 'dynamic',
      position: pos,
      fixedRotation: true,
      linearDamping: 10,
      angle: body.getAngle(),
    });
    placedBody.createFixture({
      shape: planck.Box(0.5, 0.5),
      density: 1.0,
      filterCategoryBits: EntityCategory.STRUCTURE,
      filterMaskBits: EntityCategory.BOUNDARY | EntityCategory.STRUCTURE,
    });

    // Create temporary entity
    const p = placedBody.getFixtureList().getAABB(0).getPerimeter() * 100; /*100xScaleForUnity*/
    const entity = new Entity('Placement', this.entity.world);
    entity.addComponent(new PositionAndRotation(Vec2.zero(), 0));
    entity.addComponent(new PhysicsBody(placedBody));
    (<SyncScale>entity.addComponent(new SyncScale())).setScale(Vec2(p, p));
    (<NameTag>entity.addComponent(new NameTag())).setName('Object ' + entity.objectId);

    this.entity.world.addEntity(entity);

    let tries = 0;
    const fn = () => {
      tries++;
      if (!body.isAwake()) {
        // Create the real entity
        this.createRealEntity(placedBody.getPosition(), placedBody.getAngle());
        // Destroy temporary entity
        entity.destroy();
      } else {
        if (tries >= 10) {
          entity.destroy();
          if (this.inventory.entity.owner != null)
            this.inventory.entity.owner.send(getBytes[Protocol.TemporaryMessage]('NoRest,' + entity.objectId, 2));
        } else setTimeout(fn, 1000);
      }
    };

    setTimeout(fn, 1000);

    //this.entity.destroy();
  }

  private createRealEntity(position: Vec2, angle: number): void {
    const body = this.entity.world.getPhysicsWorld().createBody({
      type: 'static',
      position: position,
      fixedRotation: true,
      angle: angle,
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
  }
}
