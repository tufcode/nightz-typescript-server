import { BehaviourNode, Status } from './behaviour-node';
import { Body, Vec2 } from 'planck-js';
import { BehaviourTree } from '../behaviour-tree';

export class ActivateHandItem extends BehaviourNode {
  private activate: boolean;
  public constructor(tree: BehaviourTree, activate: boolean) {
    super(tree);
    this.activate = activate;
  }

  public execute(deltaTime: number): Status {
    if (!this.tree.data['currentHand']) return Status.FAILED;

    this.tree.data['currentHand'].setPrimary(this.activate);

    return Status.SUCCESS;
  }
}
