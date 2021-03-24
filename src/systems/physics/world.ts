import { Body } from './body';
import { Collision } from './collision';

export class World {
  public bodies: Body[];

  public step(deltaTime: number): void {
    for (const body of this.bodies) {
      body.move(deltaTime);
    }

    const collisions: Collision[] = [];
    for (let i = 0; i < this.bodies.length; i++) {
      for (let j = 0; j < this.bodies.length; j++) {
        if (i < j) {
          const { collisionInfo, collided } = Collision.checkCollision(this.bodies[i], this.bodies[j]);
          if (collided) collisions.push(collisionInfo);
        }
      }
    }

    for (const col of collisions) col.resolve();
  }
}
