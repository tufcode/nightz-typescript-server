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
import { GetPatrolTarget } from '../ai/nodes/get-patrol-target';
import { FailUnlessSecondsPassed } from '../ai/nodes/fail-unless-seconds-passed';
import { ShouldGetPatrolTarget } from '../ai/nodes/should-get-patrol-target';
import { Print } from '../ai/nodes/print';
import { createZombieBehaviourTree } from '../ai/trees/zombie-tree';

export const CreateZombie = (gameWorld: World, position: Vec2, angle: number): Entity => {
  const body = gameWorld.getPhysicsWorld().createBody({
    type: 'dynamic',
    position,
    angle,
    fixedRotation: true,
    linearDamping: 10,
  });
  body.createFixture({
    shape: Circle(0.5),
    density: 20.0,
    friction: 0,
    filterCategoryBits: EntityCategory.NPC,
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
  // Create AI entity
  const entity = new Entity(EntityId.Zombie, gameWorld);
  entity.addComponent(new Animation());
  entity.addComponent(new Position(body.getPosition(), body.getLinearVelocity()));
  entity.addComponent(new Rotation(body.getAngle()));
  entity.addComponent(new PhysicsBody(body));
  entity.addComponent(new Team(1));
  entity.addComponent(new Health(180));
  entity.addComponent(new Regeneration(4));
  entity.addComponent(new KillRewards(80, randomRange(0, 60)));
  const moveComponent = <Movement>entity.addComponent(new Movement(800));
  const inventory = <Inventory>entity.addComponent(new Inventory());
  const equipment = <Equipment>entity.addComponent(new Equipment());
  entity.addComponent(new Minimap());
  const item = new MeleeWeapon(EntityId.None, 0, 2.5, 4, 3.2, 0, 0, 0, Box(0.1, 0.4, Vec2(0.5 + 0.1, 0)), 5);
  inventory.addItem(item);
  equipment.hand = item;

  //entity.addComponent(new ZombieAI());
  entity.addComponent(new Observable());

  (<BetterAI>entity.addComponent(new BetterAI())).addNode(
    createZombieBehaviourTree(equipment, body, gameWorld, moveComponent),
  );

  (<NameTag>entity.addComponent(new NameTag())).setName('Zombie');

  return entity;
};
