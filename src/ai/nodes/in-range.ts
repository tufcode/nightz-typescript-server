import { BehaviourNode, Status } from './behaviour-node';
import { Body, Vec2 } from 'planck-js';
import { BehaviourTree } from '../behaviour-tree';

export class InRange extends BehaviourNode {
  private body: Body;
  private varName: string;
  private range: number;

  public constructor(tree: BehaviourTree, body: Body, varName: string, range: number) {
    super(tree);
    this.body = body;
    this.varName = varName;
    this.range = range;
  }

  public execute(deltaTime: number): Status {
    if (!this.tree.data[this.varName]) return Status.FAILED;

    if (Vec2.distance(this.body.getWorldCenter(), this.tree.data[this.varName].getWorldCenter()) <= this.range)
      return Status.SUCCESS;

    return Status.FAILED;
  }
}
