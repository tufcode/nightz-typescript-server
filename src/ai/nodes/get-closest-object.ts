import { BehaviourNode, Status } from './behaviour-node';
import { Body, Fixture, Vec2 } from 'planck-js';

export class GetClosestObject extends BehaviourNode {
  public execute(deltaTime: number): Status {
    const objects = this.tree.data['objectsInRadius'];
    if (!objects || objects.length == 0 || !this.tree.data['position']) return Status.FAILED;

    let bestDistance = Number.MAX_VALUE;
    let closest = null;

    for (let i = 0; i < objects.length; i++) {
      const body = (<Fixture>objects[i]).getBody();
      const objectCenter = body.getWorldCenter();

      // Check distance
      const distance = Vec2.distance(this.tree.data['position'], objectCenter);

      if (distance < bestDistance) {
        bestDistance = distance;
        closest = body;
      }
    }

    this.tree.data['closestObject'] = closest;

    return Status.SUCCESS;
  }
}
