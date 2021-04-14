import { BehaviourNode, Status } from './behaviour-node';
import { AABB, Body, Vec2 } from 'planck-js';
import { BehaviourTree } from '../behaviour-tree';

export class GetObjectsInRadius extends BehaviourNode {
  private body: Body;
  private radius: number;

  public constructor(tree: BehaviourTree, body: Body, radius: number) {
    super(tree);
    this.body = body;
    this.radius = radius;
  }

  public execute(deltaTime: number): Status {
    this.tree.data['objectsInRadius'] = [];

    const pos = this.body.getWorldCenter();
    const aabbLower = pos.clone().sub(Vec2(this.radius, this.radius));
    const aabbUpper = pos.clone().add(Vec2(this.radius, this.radius));
    const aabb = new AABB(aabbLower, aabbUpper);
    this.body.getWorld().queryAABB(aabb, (f) => {
      // Skip if it is a sensor
      if (f.isSensor()) return true;

      // Don't detect those outside the circle (we are casting a box, so...)
      const targetCenter = f.getBody().getWorldCenter();
      if (targetCenter.clone().sub(pos).length() >= this.radius) return true;

      // Store it
      this.tree.data['objectsInRadius'].push(f);
    });
    return Status.SUCCESS;
  }
}
