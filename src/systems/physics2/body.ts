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

  public minus(vector: Vector2): Vector2 {
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

export class Body {
  public position: Vector2;
  public velocity: Vector2;
  public radius: number;
  public isColliding: boolean;
  public mass: number;
  public angle: number = 0;
  private fixedRotation: boolean;
  public restitution: number = 0;
  public linearDamping = 0.1;
  private _currentForce: Vector2 = new Vector2(0, 0);

  public constructor(position: Vector2, velocity: Vector2, radius: number, mass: number) {
    this.position = position;
    this.velocity = velocity;
    this.radius = radius;
    this.mass = mass;

    this.isColliding = false;
  }

  public update(deltaTime: number): void {
    // Move with set velocity
    this.position.x += this.velocity.x * deltaTime;
    this.position.y += this.velocity.y * deltaTime;

    // Add forces
    this.velocity.add(
      new Vector2(this._currentForce.x * (this.mass * deltaTime), this._currentForce.y * (this.mass * deltaTime)),
    );
    this._currentForce = new Vector2(0, 0);

    // Decrease velocity
    this.velocity.mul(1.0 / (1.0 + deltaTime * this.linearDamping));

    // Calculate the angle (vy before vx)
    if (!this.fixedRotation) this.angle = Math.atan2(this.velocity.y, this.velocity.x);
  }

  public addForce(f: Vector2): void {
    this._currentForce.add(f);
  }

  public addImpulse(f: Vector2): void {
    this.velocity.add(f.mul(this.mass));
  }
}
