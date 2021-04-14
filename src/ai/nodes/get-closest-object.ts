import { BehaviourNode, Status } from './behaviour-node';
import { Body, Fixture, Vec2 } from 'planck-js';
import { BehaviourTree } from '../behaviour-tree';

export class GetClosestObject extends BehaviourNode {
  private body: Body;

  public constructor(tree: BehaviourTree, body: Body) {
    super(tree);
    this.body = body;
  }

  public execute(deltaTime: number): Status {
    const objects = this.tree.data['objectsInRadius'];
    if (!objects || objects.length == 0) return Status.FAILED;

    let bestDistance = Number.MAX_VALUE;
    let closest = null;
    const myCenter = this.body.getWorldCenter();

    for (let i = 0; i < objects.length; i++) {
      const body = (<Fixture>objects[i]).getBody();
      const objectCenter = body.getWorldCenter();

      // Check distance
      const distance = Vec2.distance(myCenter, objectCenter);

      if (distance < bestDistance) {
        bestDistance = distance;
        closest = body;
      }
    }

    this.tree.data['closestObject'] = closest;

    return Status.SUCCESS;
  }
}
