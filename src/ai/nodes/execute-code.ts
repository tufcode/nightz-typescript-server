import { BehaviourNode, Status } from './behaviour-node';
import { BehaviourTree } from '../behaviour-tree';

export class ExecuteCode extends BehaviourNode {
  private readonly c: () => Status;

  public constructor(tree: BehaviourTree, callback: () => Status) {
    super(tree);
    this.c = callback;
  }

  public execute(deltaTime: number): Status {
    return this.c();
  }
}
