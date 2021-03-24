import { Body } from './body';

export interface ICollisionData {
  collisionInfo: Collision;
  collided: boolean;
}

export class Collision {
  private body1: Body;
  private body2: Body;
  private dx: number;
  private dy: number;
  private distance: number;
  public constructor(body1: Body, body2: Body, distanceX: number, distanceY: number, distance: number) {
    this.body1 = body1;
    this.body2 = body2;

    this.dx = distanceX;
    this.dy = distanceY;
    this.distance = distance;
  }

  public resolve(): void {
    const nx = this.dx / this.distance; // Compute eigen vectors
    const ny = this.dy / this.distance;
    const s = this.body1.r + this.body2.r - this.distance; // Compute penetration depth
    this.body1.x -= (nx * s) / 2; // Move first object by half of collision size
    this.body1.y -= (ny * s) / 2;
    this.body2.x += (nx * s) / 2; // Move other object by half of collision size in opposite direction
    this.body2.y += (ny * s) / 2;
  }

  public static checkCollision(body1: Body, body2: Body): ICollisionData {
    const dx = body2.x - body1.x;
    const dy = body2.y - body1.y;
    const d = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
    if (d < body1.r + body2.r) {
      return {
        collisionInfo: new Collision(body1, body2, dx, dy, d),
        collided: true,
      };
    }
    return {
      collisionInfo: null,
      collided: false,
    };
  }
}
