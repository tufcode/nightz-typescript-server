import { BehaviourNode, Status } from './behaviour-node';
import { BehaviourTree } from '../behaviour-tree';

export class FailUnlessSecondsPassed extends BehaviourNode {
  private _currTick = 0;
  private readonly seconds: number;

  public constructor(tree: BehaviourTree, seconds: number) {
    super(tree);
    this.seconds = seconds;
  }

  public execute(deltaTime: number): Status {
    this._currTick += deltaTime;
    if (this._currTick >= this.seconds) {
      this._currTick = 0;
      return Status.SUCCESS;
    }
    return Status.FAILED;
  }
}
