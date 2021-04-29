import * as planck from 'planck-js';
import { Vec2 } from 'planck-js';
import { EntityCategory } from '../protocol';
import { Entity } from '../entity';
import { Health } from '../components/health';
import { Team } from '../components/team';
import { PhysicsBody } from '../components/physics-body';
import { Position } from '../components/position';
import { World } from '../systems/world';
import { Client } from 'elsa';
import { MeleeWeapon } from '../items/melee-weapon';
import { Item } from '../items/item';
import { Observable } from '../components/observable';
import { Rotation } from '../components/rotation';
import { EntityId } from '../data/entity-id';
import { Spike } from '../components/spike';
import { GameClient } from '../game-client';

export const createWoodenBlock = (
  owner?: GameClient,
  team?: Team,
): ((world: World, position: Vec2, angle: number) => Entity) => {
  return (world: World, position: Vec2, angle: number) => {
    const body = world.getPhysicsWorld().createBody({
      type: 'static',
      position: position,
      fixedRotation: true,
      angle: angle,
    });
    body.createFixture({
      shape: planck.Circle(0.45),
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
        EntityCategory.SHIELD,
    });

    // Create entity
    const entity = new Entity(EntityId.WallWooden, world, owner);
    entity.addComponent(new Health(200));
    entity.addComponent(new Position(position, Vec2.zero()));
    entity.addComponent(new Rotation(angle));
    entity.addComponent(new PhysicsBody(body));
    entity.addComponent(new Observable());

    if (team != null) entity.addComponent(team);

    return entity;
  };
};
export const createWoodenSpike = (
  owner?: GameClient,
  team?: Team,
): ((world: World, position: Vec2, angle: number) => Entity) => {
  return (world: World, position: Vec2, angle: number) => {
    const body = world.getPhysicsWorld().createBody({
      type: 'static',
      position: position,
      fixedRotation: true,
      angle: angle,
    });
    body.createFixture({
      shape: planck.Circle(0.45),
      density: 0.0,
      filterCategoryBits: EntityCategory.STRUCTURE,
      filterMaskBits:
        EntityCategory.BOUNDARY |
        EntityCategory.STRUCTURE |
        EntityCategory.RESOURCE |
        EntityCategory.PLAYER |
        EntityCategory.NPC |
        EntityCategory.BULLET |
        EntityCategory.MELEE,
    });

    // Create entity
    const entity = new Entity(EntityId.SpikeWooden, world, owner);
    if (team != null) entity.addComponent(team);
    entity.addComponent(new Health(200));
    entity.addComponent(new Position(position, Vec2.zero()));
    entity.addComponent(new Rotation(angle));
    entity.addComponent(new PhysicsBody(body));
    entity.addComponent(new Spike());
    entity.addComponent(new Observable());

    return entity;
  };
};
