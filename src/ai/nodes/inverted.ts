import { BehaviourNode, Status } from './behaviour-node';
import { BehaviourTree } from '../behaviour-tree';

export class Inverted extends BehaviourNode {
  private node: BehaviourNode;

  public constructor(tree: BehaviourTree, node: BehaviourNode) {
    super(tree);
    this.node = node;
  }

  public execute(deltaTime: number): Status {
    const result = this.node.execute(deltaTime);
    switch (result) {
      case Status.FAILED:
        return Status.SUCCESS;
      case Status.RUNNING:
        return Status.RUNNING;
      case Status.SUCCESS:
        return Status.FAILED;
    }
  }
}
