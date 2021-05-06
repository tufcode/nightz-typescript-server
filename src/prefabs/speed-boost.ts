import { Box, Circle, Vec2 } from 'planck-js';
import { randomRange } from '../utils';
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
import { DecayOnOwnerLeave } from '../components/decay-on-owner-leave';

export const createSpeedBoost = (gameWorld: World, position: Vec2, angle: number, owner: GameClient): Entity => {
  const body = gameWorld.getPhysicsWorld().createBody({
    type: 'static',
    position: position,
    fixedRotation: true,
    angle: angle,
  });
  body.createFixture({
    shape: planck.Circle(0.7875),
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
      EntityCategory.SHIELD |
      EntityCategory.SENSOR,
    isSensor: true,
  });
  // Create AI entity
  const entity = new Entity(EntityId.SpeedBoost, gameWorld, owner);
  entity.addComponent(new Animation());
  entity.addComponent(new Position(body.getPosition(), body.getLinearVelocity()));
  entity.addComponent(new Rotation(body.getAngle()));
  entity.addComponent(new PhysicsBody(body));
  entity.addComponent(new Team((<Team>owner.controlling.getComponent(Team)).id));
  entity.addComponent(new Health(80));
  entity.addComponent(new Regeneration(2));
  entity.addComponent(new SpeedBoost());
  entity.addComponent(new DecayOnOwnerLeave());

  entity.addComponent(new Observable());

  return entity;
};
