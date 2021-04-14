import { BehaviourNode, Status } from './behaviour-node';

export class Selector extends BehaviourNode {
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
          continue;
        case Status.RUNNING:
          return childStatus;
        case Status.SUCCESS:
          this.currentIndex = 0;
          return Status.SUCCESS;
        default:
          return Status.SUCCESS;
      }
    }
    this.currentIndex = 0;
    return Status.FAILED;
  }
}
