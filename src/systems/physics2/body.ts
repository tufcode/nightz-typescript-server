import { Vector2 } from './vector2';
import { World } from './world';
import * as EventEmitter from 'eventemitter3';

export enum BodyType {
  Dynamic,
  Static,
  Sensor,
}

export class Body {
  public position: Vector2;
  public velocity: Vector2;
  public radius: number;
  public isColliding: boolean;
  public mass: number;
  public angle = 0;
  public fixedRotation: boolean;
  public restitution = 0;
  public linearDamping = 0.1;

  public type: BodyType = BodyType.Dynamic;
  public ignoredBodies: Body[] = [];
  public collisionMask = 0x0001;
  public collisionCategory = 0x0001;

  public _bodyId: number;
  public _world: World;
  public _collidingBodies: Body[] = [];
  public _futureCollidingBodies: Body[] = [];
  private _forces: Vector2 = new Vector2(0, 0);
  private _eventEmitter: EventEmitter;
  private _userData: unknown;

  public constructor(position: Vector2, velocity: Vector2, radius: number, mass: number) {
    this.position = position;
    this.velocity = velocity;
    this.radius = radius;
    this.mass = mass;

    this._eventEmitter = new EventEmitter();

    this.isColliding = false;
  }

  public update(deltaTime: number): void {
    if (this.isDynamic()) {
      // Add forces
      this.velocity.add(
        new Vector2(this._forces.x * (this.mass * deltaTime), this._forces.y * (this.mass * deltaTime)),
      );
      this._forces = new Vector2(0, 0);

      // Apply gravity
      //this.velocity.y += this._world.gravity * deltaTime;

      // Decrease velocity
      this.velocity.mul(1.0 / (1.0 + deltaTime * this.linearDamping));

      // Velocity threshold
      if (this.velocity.lengthSquared() <= 0.01) {
        this.velocity = new Vector2(0, 0);
      }

      // Move with set velocity
      this.position.x += this.velocity.x * deltaTime;
      this.position.y += this.velocity.y * deltaTime;

      // Calculate the angle (vy before vx)
      //if (!this.fixedRotation) this.angle = Math.atan2(this.velocity.y, this.velocity.x);
    }
  }

  public addForce(f: Vector2): void {
    this._forces.add(f);
  }

  public addImpulse(f: Vector2): void {
    this.velocity.add(f.mul(this.mass));
  }

  public isStatic(): boolean {
    return this.type == BodyType.Static;
  }

  public isDynamic(): boolean {
    return this.type == BodyType.Dynamic;
  }

  public isSensor(): boolean {
    return this.type == BodyType.Sensor;
  }

  public on(
    event: 'collision-start' | 'collision-end' | 'trigger-start' | 'trigger-end',
    callback: (...args: unknown[]) => void,
  ): EventEmitter {
    return this._eventEmitter.on(event, callback);
  }

  public _updateCollisionCache(): void {
    const noLongerColliding = this._collidingBodies.filter((b) => this._futureCollidingBodies.indexOf(b) == -1);
    const newCollisions = this._futureCollidingBodies.filter((b) => this._collidingBodies.indexOf(b) == -1);
    this._collidingBodies = this._futureCollidingBodies.slice(0);
    this._futureCollidingBodies = [];

    for (let k = 0; k < noLongerColliding.length; k++) {
      const b = noLongerColliding[k];
      const event: 'collision-end' | 'trigger-end' = this.isSensor() || b.isSensor() ? 'trigger-end' : 'collision-end';

      this._emit(event, b);
    }
    for (let k = 0; k < newCollisions.length; k++) {
      const b = newCollisions[k];
      const event: 'collision-start' | 'trigger-start' =
        this.isSensor() || b.isSensor() ? 'trigger-start' : 'collision-start';

      this._emit(event, b);
    }
  }

  public _emit(event: 'collision-start' | 'collision-end' | 'trigger-start' | 'trigger-end', ...args: unknown[]): void {
    this._eventEmitter.emit(event, ...args);
  }

  public getUserData(): unknown {
    return this._userData;
  }

  public setUserData(d: unknown): void {
    this._userData = d;
  }
}
