import { BehaviourNode, Status } from './behaviour-node';
import { Vec2 } from 'planck-js';
import { BehaviourTree } from '../behaviour-tree';
import { Movement } from '../../components/movement';
import { clamp, randomRange } from '../../utils';

export class GetPatrolTarget extends BehaviourNode {
  private movement: Movement;
  private delay: number;
  private _currTick = 0;
  private bounds: Vec2;
  private range: number;

  public constructor(tree: BehaviourTree, bounds: Vec2, range: number) {
    super(tree);
    this.bounds = bounds;
    this.range = range;
  }

  public execute(deltaTime: number): Status {
    this.tree.data['patrolTarget'] = Vec2(
      clamp(
        randomRange(this.tree.data['position'].x - this.range, this.tree.data['position'].x + this.range),
        -(this.bounds.x / 2),
        this.bounds.x / 2,
      ),
      clamp(
        randomRange(this.tree.data['position'].y - this.range, this.tree.data['position'].y + this.range),
        -(this.bounds.y / 2),
        this.bounds.y / 2,
      ),
    );

    return Status.SUCCESS;
  }
}
