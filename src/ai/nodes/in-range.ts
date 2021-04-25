import { BehaviourNode, Status } from './behaviour-node';
import { Body, Vec2 } from 'planck-js';
import { BehaviourTree } from '../behaviour-tree';

export class InRange extends BehaviourNode {
  private varName: string;
  private range: number;

  public constructor(tree: BehaviourTree, varName: string, range: number) {
    super(tree);
    this.varName = varName;
    this.range = range;
  }

  public execute(deltaTime: number): Status {
    if (!this.tree.data[this.varName] || !this.tree.data['position']) return Status.FAILED;

    if (Vec2.distance(this.tree.data['position'], this.tree.data[this.varName]) <= this.range) return Status.SUCCESS;

    return Status.FAILED;
  }
}
