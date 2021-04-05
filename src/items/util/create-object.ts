import * as planck from 'planck-js';
import { EntityCategory } from '../../protocol';
import { Entity } from '../../entity';
import { Health } from '../../components/health';
import { Team } from '../../components/team';
import { PhysicsBody } from '../../components/physics-body';
import { Position } from '../../components/position';
import { Vec2 } from 'planck-js';
import { World } from '../../systems/world';
import { Client } from 'elsa';
import { Axe } from '../axe';
import { Item } from '../item';
import { Observable } from '../../components/observable';
import { Rotation } from '../../components/rotation';

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
        EntityCategory.BOUNDARY |
        EntityCategory.STRUCTURE |
        EntityCategory.RESOURCE |
        EntityCategory.PLAYER |
        EntityCategory.NPC |
        EntityCategory.BULLET |
        EntityCategory.MELEE |
        EntityCategory.SENSOR,
    });

    // Create entity
    const entity = new Entity('WoodenBlock', world, owner);
    entity.addComponent(new Health(200, 20));
    entity.addComponent(new Position(position, Vec2.zero()));
    entity.addComponent(new Rotation(angle));
    entity.addComponent(new PhysicsBody(body));
    entity.addComponent(new Observable());

    if (team != null) entity.addComponent(team);

    return entity;
  };
};

export const createAxe = (world: World, owner?: Client): Item => {
  // Create entity
  const entity = new Entity('WoodenAxe', world, owner);
  entity.addComponent(new Observable());
  return <Item>entity.addComponent(new Axe());
  // todo take axe as a parameter
};

export const createItem = (item: Item, world: World, owner?: Client): Item => {
  const entity = new Entity(item.id, world, owner);
  entity.addComponent(new Observable());
  return <Item>entity.addComponent(item);
};
