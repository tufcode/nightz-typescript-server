import { Vec2 } from 'planck-js';

export enum BodyType {
  Dynamic,
  Static,
}

export class Body {
  public x: number = 0;
  public y: number = 0;
  public r: number = 0;
  public vx: number = 0;
  public vy: number = 0;
  public linearDamping: number = 0;
  public type: BodyType;

  public constructor(x: number, y: number, radius: number, vx = 0, vy = 0) {
    this.x = x;
    this.y = y;
    this.r = radius;
    this.vx = vx;
    this.vy = vy;
  }

  public move(deltaTime: number): void {
    console.log(deltaTime);
    this.x += this.vx * deltaTime;
    this.y += this.vy * deltaTime;

    //this.vx -= this.vx * this.linearDamping;
    //this.vy -= this.vy * this.linearDamping;
  }

  public getPosition(): Vec2 {
    return Vec2(this.x, this.y);
  }

  public getAngle(): number {
    return 0;
  }
}
