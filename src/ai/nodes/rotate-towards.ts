import { BehaviourNode, Status } from './behaviour-node';
import { Body, Vec2 } from 'planck-js';
import { BehaviourTree } from '../behaviour-tree';
import { Movement } from '../../components/movement';

export class RotateTowards extends BehaviourNode {
  private body: Body;
  private varName: string;

  public constructor(tree: BehaviourTree, body: Body, varName: string) {
    super(tree);
    this.body = body;
    this.varName = varName;
  }

  public execute(deltaTime: number): Status {
    if (!this.tree.data[this.varName] || !this.tree.data['position']) return Status.FAILED;

    const targetAngle = Math.atan2(
      this.tree.data[this.varName].y - this.tree.data['position'].y,
      this.tree.data[this.varName].x - this.tree.data['position'].x,
    );
    this.body.setAngle(targetAngle);

    return Status.SUCCESS;
  }
}
