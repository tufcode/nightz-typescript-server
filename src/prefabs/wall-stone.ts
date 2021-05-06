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
import { KillRewards } from '../components/kill-rewards';
import { Movement } from '../components/movement';
import { Inventory } from '../components/inventory';
import { Equipment } from '../components/equipment';
import { Minimap } from '../components/minimap';
import { MeleeWeapon } from '../items/melee-weapon';
import { Observable } from '../components/observable';
import { BehaviourTree } from '../ai/behaviour-tree';
import { Sequence } from '../ai/nodes/sequence';
import { Selector } from '../ai/nodes/selector';
import { ActivateHandItem } from '../ai/nodes/activate-hand-item';
import { GetCurrentHand } from '../ai/nodes/get-current-hand';
import { GetPosition } from '../ai/nodes/get-position';
import { GetClosestObject } from '../ai/nodes/get-closest-object';
import { Inverted } from '../ai/nodes/inverted';
import { InRange } from '../ai/nodes/in-range';
import { MoveTowards } from '../ai/nodes/move-towards';
import { RotateTowards } from '../ai/nodes/rotate-towards';
import { WaitSeconds } from '../ai/nodes/wait-seconds';
import { GetObjectsInRadius } from '../ai/nodes/get-objects-in-radius';
import { BetterAI } from '../components/better-ai';
import { NameTag } from '../components/name-tag';
import { World } from '../systems/world';
import * as planck from 'planck-js';
import { GameClient } from '../game-client';
import { Miner } from '../components/miner';
import { DecayOnOwnerLeave } from '../components/decay-on-owner-leave';

export const createWallStone = (gameWorld: World, position: Vec2, angle: number, owner: GameClient): Entity => {
  const body = gameWorld.getPhysicsWorld().createBody({
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
      EntityCategory.SHIELD |
      EntityCategory.SENSOR,
  });

  // Create entity
  const entity = new Entity(EntityId.WallStone, gameWorld, owner);
  entity.addComponent(new Health(600));
  entity.addComponent(new Position(position, Vec2.zero()));
  entity.addComponent(new Rotation(angle));
  entity.addComponent(new PhysicsBody(body));
  const team = <Team>entity.addComponent(new Team((<Team>owner.controlling.getComponent(Team)).id));
  entity.addComponent(new DecayOnOwnerLeave());
  entity.addComponent(new Observable());

  return entity;
};
