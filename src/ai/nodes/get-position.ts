import { BehaviourNode, Status } from './behaviour-node';
import { Body, Vec2 } from 'planck-js';
import { BehaviourTree } from '../behaviour-tree';

export class GetPosition extends BehaviourNode {
  private body: Body;

  public constructor(tree: BehaviourTree, body: Body) {
    super(tree);
    this.body = body;
  }

  public execute(deltaTime: number): Status {
    this.tree.data['position'] = this.body.getWorldCenter();

    return Status.SUCCESS;
  }
}
