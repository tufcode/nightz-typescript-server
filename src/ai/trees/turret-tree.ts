import { BehaviourTree } from '../behaviour-tree';
import { Sequence } from '../nodes/sequence';
import { Selector } from '../nodes/selector';
import { GetPosition } from '../nodes/get-position';
import { GetClosestObject } from '../nodes/get-closest-object';
import { FailUnlessSecondsPassed } from '../nodes/fail-unless-seconds-passed';
import { GetObjectsInRadius } from '../nodes/get-objects-in-radius';
import { EntityCategory } from '../../protocol';
import { World } from '../../systems/world';
import { Body } from 'planck-js';
import { BehaviourNode, Status } from '../nodes/behaviour-node';
import { Entity } from '../../entity';
import { Team } from '../../components/team';
import { Turret } from '../../components/turret';
import { ExecuteCode } from '../nodes/execute-code';

export const createTurretBehaviourTree = (body: Body, gameWorld: World, turret: Turret, team: Team): BehaviourNode => {
  const tree = new BehaviourTree();

  // Attack closest target
  const attackSequence = new Sequence(tree);
  attackSequence.addNode(new GetPosition(tree, body));
  attackSequence.addNode(new GetClosestObject(tree));
  attackSequence.addNode(
    new ExecuteCode(tree, () => {
      turret.fireAt(tree.data['closestObjectPos']);
      return Status.SUCCESS;
    }),
  );

  // Get available targets in a radius every second
  const findSequence = new Sequence(tree);
  findSequence.addNode(new FailUnlessSecondsPassed(tree, 1));
  findSequence.addNode(new GetPosition(tree, body));
  findSequence.addNode(
    new GetObjectsInRadius(tree, gameWorld.getPhysicsWorld(), 10, (f) => {
      if (
        !(
          (f.getFilterCategoryBits() & EntityCategory.PLAYER) == EntityCategory.PLAYER ||
          (f.getFilterCategoryBits() & EntityCategory.NPC) == EntityCategory.NPC
        )
      )
        return false;

      const otherTeam = <Team>(<Entity>f.getBody().getUserData()).getComponent(Team);
      return otherTeam != null && team.isHostileTowards(otherTeam);
    }),
  );
  findSequence.addNode(attackSequence);

  const findSelector = new Selector(tree);

  findSelector.addNode(findSequence);
  findSelector.addNode(attackSequence);
  return findSelector;
};
