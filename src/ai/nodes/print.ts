import { BehaviourNode, Status } from './behaviour-node';
import { BehaviourTree } from '../behaviour-tree';

export class Print extends BehaviourNode {
  private t: string;

  public constructor(tree: BehaviourTree, t: string) {
    super(tree);
    this.t = t;
  }

  public execute(deltaTime: number): Status {
    console.log(this.t);
    return Status.SUCCESS;
  }
}
