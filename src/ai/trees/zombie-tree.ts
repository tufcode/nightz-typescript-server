import { BehaviourTree } from '../behaviour-tree';
import { Sequence } from '../nodes/sequence';
import { Selector } from '../nodes/selector';
import { GetCurrentHand } from '../nodes/get-current-hand';
import { ActivateHandItem } from '../nodes/activate-hand-item';
import { GetPosition } from '../nodes/get-position';
import { GetClosestObject } from '../nodes/get-closest-object';
import { ShouldGetPatrolTarget } from '../nodes/should-get-patrol-target';
import { GetPatrolTarget } from '../nodes/get-patrol-target';
import { MoveTowards } from '../nodes/move-towards';
import { RotateTowards } from '../nodes/rotate-towards';
import { Inverted } from '../nodes/inverted';
import { InRange } from '../nodes/in-range';
import { FailUnlessSecondsPassed } from '../nodes/fail-unless-seconds-passed';
import { GetObjectsInRadius } from '../nodes/get-objects-in-radius';
import { EntityCategory } from '../../protocol';
import { Equipment } from '../../components/equipment';
import { World } from '../../systems/world';
import { Movement } from '../../components/movement';
import { Body } from 'planck-js';
import { BehaviourNode } from '../nodes/behaviour-node';

export const createZombieBehaviourTree = (
  equipment: Equipment,
  body: Body,
  gameWorld: World,
  moveComponent: Movement,
): BehaviourNode => {
  const tree = new BehaviourTree();
  const rootSequence = new Sequence(tree);
  const patrolSelector = new Selector(tree);
  const patrolSequence = new Sequence(tree);
  const getPatrolTargetSequence = new Sequence(tree);

  const chaseOrAttackSelector = new Selector(tree);
  const chaseSequence = new Sequence(tree);
  const attackSequence = new Sequence(tree);

  const findSelector = new Selector(tree);

  const mainSelector = new Selector(tree);
  mainSelector.addNode(rootSequence);
  mainSelector.addNode(patrolSelector);

  chaseOrAttackSelector.addNode(chaseSequence);
  chaseOrAttackSelector.addNode(attackSequence);

  rootSequence.addNode(new GetCurrentHand(tree, equipment));
  rootSequence.addNode(new ActivateHandItem(tree, false));
  rootSequence.addNode(new GetPosition(tree, body));
  rootSequence.addNode(new GetClosestObject(tree));
  rootSequence.addNode(chaseOrAttackSelector);

  patrolSelector.addNode(getPatrolTargetSequence);
  patrolSelector.addNode(patrolSequence);

  getPatrolTargetSequence.addNode(new ShouldGetPatrolTarget(tree));
  getPatrolTargetSequence.addNode(new GetPatrolTarget(tree, gameWorld.bounds, 10));

  patrolSequence.addNode(new GetPosition(tree, body));
  patrolSequence.addNode(new MoveTowards(tree, moveComponent, 'patrolTarget'));
  patrolSequence.addNode(new RotateTowards(tree, body, 'patrolTarget'));

  chaseSequence.addNode(new Inverted(tree, new InRange(tree, 'closestObjectPos', 1.4)));
  chaseSequence.addNode(new ActivateHandItem(tree, false));
  chaseSequence.addNode(new MoveTowards(tree, moveComponent, 'closestObjectPos'));
  chaseSequence.addNode(new RotateTowards(tree, body, 'closestObjectPos'));

  attackSequence.addNode(new ActivateHandItem(tree, true));
  attackSequence.addNode(new MoveTowards(tree, moveComponent, 'closestObjectPos'));
  attackSequence.addNode(new RotateTowards(tree, body, 'closestObjectPos'));

  const findSequence = new Sequence(tree);
  findSequence.addNode(new FailUnlessSecondsPassed(tree, 1));
  findSequence.addNode(new GetPosition(tree, body));
  findSequence.addNode(
    new GetObjectsInRadius(tree, gameWorld.getPhysicsWorld(), 10, (f) => {
      return (
        (f.getFilterCategoryBits() & EntityCategory.PLAYER) == EntityCategory.PLAYER ||
        (f.getFilterCategoryBits() & EntityCategory.STRUCTURE) == EntityCategory.STRUCTURE
      );
    }),
  );

  findSequence.addNode(mainSelector);

  findSelector.addNode(findSequence);
  findSelector.addNode(mainSelector);
  return findSelector;
};
