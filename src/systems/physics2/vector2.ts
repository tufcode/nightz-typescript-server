export class Vector2 {
  public x: number;
  public y: number;

  public constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  public add(vector: Vector2): Vector2 {
    this.x += vector.x;
    this.y += vector.y;
    return this;
  }

  public sub(vector: Vector2): Vector2 {
    this.x -= vector.x;
    this.y -= vector.y;
    return this;
  }

  public lengthSquared(): number {
    return this.x * this.x + this.y * this.y;
  }

  public normalize(): Vector2 {
    return this.divide(this.lengthSquared());
  }

  private divide(n: number): Vector2 {
    this.x /= n;
    this.y /= n;
    return this;
  }

  public mul(n: number): Vector2 {
    this.x *= n;
    this.y *= n;
    return this;
  }

  public toString(): string {
    return `Vector2(x: ${this.x}, y:${this.y})`;
  }
}
