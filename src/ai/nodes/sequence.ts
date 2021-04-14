import { BehaviourNode, Status } from './behaviour-node';
import { BehaviourTree } from '../behaviour-tree';

export class Sequence extends BehaviourNode {
  private nodes: BehaviourNode[] = [];
  private currentIndex = 0;

  public addNode(node: BehaviourNode): void {
    this.nodes.push(node);
  }

  public execute(deltaTime: number): Status {
    for (; this.currentIndex < this.nodes.length; this.currentIndex++) {
      const childStatus = this.nodes[this.currentIndex].execute(deltaTime);
      switch (childStatus) {
        case Status.FAILED:
          this.currentIndex = 0;
          return childStatus;
        case Status.RUNNING:
          return childStatus;
        case Status.SUCCESS:
          continue;
        default:
          return Status.SUCCESS;
      }
    }
    this.currentIndex = 0;
  }
}
