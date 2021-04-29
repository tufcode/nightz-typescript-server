import { Box, Circle, Vec2 } from 'planck-js';
import { randomRange, randomRangeFloat } from '../utils';
import { EntityCategory } from '../protocol';
import { Entity } from '../entity';
import { EntityId } from '../data/entity-id';
import { Animation } from '../components/animation';
import { Position } from '../components/position';
import { Rotation } from '../components/rotation';
import { PhysicsBody } from '../components/physics-body';
import { Team } from '../components/team';
import { Health } from '../components/health';
import { Regeneration } from '../components/regeneration';
import { Observable } from '../components/observable';
import { World } from '../systems/world';
import * as planck from 'planck-js';
import { GameClient } from '../game-client';
import { Miner } from '../components/miner';
import { SpeedBoost } from '../components/speed-boost';
import { Mine } from '../components/mine';
import { Minimap } from '../components/minimap';
import { ObservableByAll } from '../components/observable-by-all';

export const createGoldMine = (gameWorld: World, position: Vec2, angle: number): Entity => {
  const body = gameWorld.getPhysicsWorld().createBody({
    type: 'static',
    position,
    angle,
  });
  body.createFixture({
    shape: Circle(1.25),
    friction: 0,
    filterCategoryBits: EntityCategory.RESOURCE,
    filterMaskBits:
      EntityCategory.BOUNDARY |
      EntityCategory.STRUCTURE |
      EntityCategory.RESOURCE |
      EntityCategory.PLAYER |
      EntityCategory.NPC |
      EntityCategory.BULLET |
      EntityCategory.MELEE,
  });

  const entity = new Entity(EntityId.GoldMine, gameWorld);
  entity.addComponent(new Position(body.getPosition(), body.getLinearVelocity()));
  entity.addComponent(new Rotation(body.getAngle()));
  entity.addComponent(new PhysicsBody(body));
  const health = <Health>entity.addComponent(new Health(100));
  entity.addComponent(new Team(1));
  entity.addComponent(new Mine(true, false, false, false));
  entity.addComponent(new Minimap());
  entity.addComponent(new ObservableByAll());

  health.isImmune = true;

  return entity;
};
