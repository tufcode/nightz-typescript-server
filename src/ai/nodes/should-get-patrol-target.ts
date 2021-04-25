import { BehaviourNode, Status } from './behaviour-node';
import { Vec2 } from 'planck-js';
import { BehaviourTree } from '../behaviour-tree';
import { Movement } from '../../components/movement';

export class ShouldGetPatrolTarget extends BehaviourNode {
  private _targetReached;
  private _currTick = 0;
  public constructor(tree: BehaviourTree) {
    super(tree);
  }

  public execute(deltaTime: number): Status {
    this._currTick += deltaTime;
    const isTimeout = this._currTick >= 5;
    const isTargetReached =
      this.tree.data['patrolTarget'] == null
        ? false
        : Vec2.distance(this.tree.data['patrolTarget'], this.tree.data['position']) < 0.25;
    if (isTimeout) {
      // Patrol after timeout
      this._currTick = 0;
      return Status.SUCCESS;
    } else if (isTargetReached) {
      // Wait a full timeout after reaching target
      if (!this._targetReached) {
        this._currTick = 0;
        this._targetReached = true;
      }
      this.tree.data['patrolTarget'] = null;
    }

    this._targetReached = false;

    return Status.FAILED;
  }
}
