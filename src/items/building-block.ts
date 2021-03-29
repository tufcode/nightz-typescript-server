import { Consumable } from './consumable';
import * as planck from 'planck-js';
import { Shape, Vec2 } from 'planck-js';
import { Entity } from '../entity';
import { PhysicsBody } from '../components/physics-body';
import { PositionAndRotation } from '../components/position-and-rotation';
import { EntityCategory, getBytes, Protocol } from '../protocol';
import { SyncScale } from '../components/sync-scale';
import { Health } from '../components/health';
import { Team } from '../components/team';
import { ItemSlot } from '../components/inventory';
import { World } from '../systems/world';

export class BuildingBlock extends Consumable {
  private createCallback: (world: World, position: Vec2, angle: number) => Entity;
  private constructionSize: Vec2;
  private constructionShape: Shape;
  private permissionCallback: (position: Vec2, angle: number) => boolean;
  private failureCallback: () => void;
  public constructor(
    id: string,
    type: ItemSlot,
    constructionSize: Vec2,
    constructionShape: Shape,
    permissionCallback: (position: Vec2, angle: number) => boolean,
    failureCallback: () => void,
    createCallback: (world: World, position: Vec2, angle: number) => Entity,
  ) {
    super();
    this.id = id;
    this.type = type;
    this.constructionSize = constructionSize;
    this.constructionShape = constructionShape;
    this.permissionCallback = permissionCallback;
    this.failureCallback = failureCallback;
    this.createCallback = createCallback;
  }

  protected onConsume(): void {
    const body = (<PhysicsBody>this.inventory.entity.getComponent(PhysicsBody)).getBody();
    const pos = body.getWorldPoint(Vec2(1, 0));

    if (!this.permissionCallback(pos, body.getAngle())) {
      return;
    }

    const placedBody = this.inventory.entity.world.getPhysicsWorld().createBody({
      type: 'dynamic',
      position: pos,
      fixedRotation: true,
      linearDamping: 10,
      angle: body.getAngle(),
    });
    placedBody.createFixture({
      shape: this.constructionShape,
      density: 1.0,
      filterCategoryBits: EntityCategory.STRUCTURE,
      filterMaskBits: EntityCategory.BOUNDARY | EntityCategory.STRUCTURE,
    });

    // Create temporary entity
    const entity = new Entity('Placement', this.inventory.entity.world);
    entity.addComponent(new PositionAndRotation(pos, body.getAngle()));
    entity.addComponent(new PhysicsBody(placedBody));
    (<SyncScale>entity.addComponent(new SyncScale())).setScale(this.constructionSize);

    this.inventory.entity.world.addEntity(entity);

    let tries = 0;
    const fn = () => {
      tries++;
      if (!placedBody.isAwake()) {
        // Create the real entity
        this.inventory.entity.world.addEntity(
          this.createCallback(this.inventory.entity.world, placedBody.getPosition(), placedBody.getAngle()),
        );
        // Destroy temporary entity
        entity.destroy();
      } else {
        if (tries >= 100) {
          this.failureCallback();
          entity.destroy();
          if (this.inventory.entity.owner != null)
            this.inventory.entity.owner.send(getBytes[Protocol.TemporaryMessage]('NoRest,' + entity.objectId, 2));
        } else setTimeout(fn, 100);
      }
    };

    setTimeout(fn, 100);

    //this.entity.destroy();
  }
}
