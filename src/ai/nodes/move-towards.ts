import { BehaviourNode, Status } from './behaviour-node';
import { Body, Vec2 } from 'planck-js';
import { BehaviourTree } from '../behaviour-tree';
import { Movement } from '../../components/movement';

export class MoveTowards extends BehaviourNode {
  private varName: string;
  private movement: Movement;

  public constructor(tree: BehaviourTree, movement: Movement, varName: string) {
    super(tree);
    this.movement = movement;
    this.varName = varName;
  }

  public execute(deltaTime: number): Status {
    if (!this.tree.data[this.varName] || !this.tree.data['position']) return Status.FAILED;

    this.movement.move(
      Vec2(
        this.tree.data[this.varName].x - this.tree.data['position'].x,
        this.tree.data[this.varName].y - this.tree.data['position'].y,
      ),
    );

    return Status.SUCCESS;
  }
}
