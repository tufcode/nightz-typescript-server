import { BehaviourNode, Status } from './behaviour-node';
import { Body, Vec2 } from 'planck-js';
import { BehaviourTree } from '../behaviour-tree';

export class MeleeAttack extends BehaviourNode {
  public constructor(tree: BehaviourTree) {
    super(tree);
  }

  public execute(deltaTime: number): Status {
    if (!this.tree.data['currentHand']) return Status.FAILED;

    return Status.SUCCESS;
  }
}
