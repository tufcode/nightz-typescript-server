export enum BodyType {
  Dynamic,
  Static,
}

export class Body {
  public x: number;
  public y: number;
  public r: number;
  private vx: number;
  private vy: number;
  public constructor(x: number, y: number, radius: number, vx = 0, vy = 0) {
    this.x = x;
    this.y = y;
    this.r = radius;
    this.vx = vx;
    this.vy = vy;
  }

  public move(deltaTime: number): void {
    this.x += this.vx * deltaTime;
    this.y += this.vy * deltaTime;
  }
}
