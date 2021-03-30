import * as planck from 'planck-js';
import { EntityCategory } from '../../protocol';
import { Entity } from '../../entity';
import { Health } from '../../components/health';
import { Team } from '../../components/team';
import { PhysicsBody } from '../../components/physics-body';
import { PositionAndRotation } from '../../components/position-and-rotation';
import { Vec2 } from 'planck-js';
import { World } from '../../systems/world';
import { Client } from 'elsa';

export const createBlock = (owner?: Client, team?: Team): ((world: World, position: Vec2, angle: number) => Entity) => {
  return (world: World, position: Vec2, angle: number) => {
    const body = world.getPhysicsWorld().createBody({
      type: 'static',
      position: position,
      fixedRotation: true,
      angle: angle,
    });
    body.createFixture({
      shape: planck.Circle(0.5),
      density: 0.0,
      filterCategoryBits: EntityCategory.STRUCTURE,
      filterMaskBits:
        EntityCategory.PLAYER |
        EntityCategory.BOUNDARY |
        EntityCategory.BULLET |
        EntityCategory.NPC |
        EntityCategory.STRUCTURE,
    });

    // Create entity
    const entity = new Entity('WoodenBlock', world, owner);
    const healthComponent = <Health>entity.addComponent(new Health(() => entity.destroy()));
    healthComponent.maxHealth = 200;
    healthComponent.currentHealth = 200;
    entity.addComponent(new PhysicsBody(body));
    entity.addComponent(new PositionAndRotation(position, angle));

    if (team != null) entity.addComponent(team);

    return entity;
  };
};
