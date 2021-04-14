import { BehaviourNode, Status } from './behaviour-node';
import { AABB, Body, Fixture, Vec2, World } from 'planck-js';
import { BehaviourTree } from '../behaviour-tree';
import { EntityCategory } from '../../protocol';

export class GetObjectsInRadius extends BehaviourNode {
  private world: World;
  private radius: number;
  private validate: (f: Fixture) => boolean;

  public constructor(tree: BehaviourTree, world: World, radius: number, validate: (f: Fixture) => boolean) {
    super(tree);
    this.world = world;
    this.radius = radius;
    this.validate = validate;
  }

  public execute(deltaTime: number): Status {
    if (!this.tree.data['position']) return Status.FAILED;
    this.tree.data['objectsInRadius'] = [];

    const pos = this.tree.data['position'];
    const aabbLower = pos.clone().sub(Vec2(this.radius, this.radius));
    const aabbUpper = pos.clone().add(Vec2(this.radius, this.radius));
    const aabb = new AABB(aabbLower, aabbUpper);
    this.world.queryAABB(aabb, (f) => {
      // Skip if it is a sensor
      if (f.isSensor()) return true;

      // Get body
      const b = f.getBody();

      // Don't detect those outside the circle (we are casting a box, so...)
      const targetCenter = b.getWorldCenter();
      if (targetCenter.clone().sub(pos).length() >= this.radius) return true;

      // Is it a valid target?
      if (!this.validate(f)) return true;

      // Store it
      this.tree.data['objectsInRadius'].push(f);
    });
    return Status.SUCCESS;
  }
}
