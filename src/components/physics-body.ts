import { Component } from './component';
import { Entity } from '../entity';
import { Body, Vec2 } from 'planck-js';
import { Position } from './position';
import { Rotation } from './rotation';

export class PhysicsBody extends Component {
  public entity: Entity;
  private readonly body: Body;
  private _syncComponent: Position;
  private _rotationComponent: Rotation;
  private _lastPos: Vec2;
  private _lastVel: Vec2;
  private _lastAngle = 0;

  public constructor(body: Body) {
    super();
    this.body = body;
  }

  public init(): void {
    this.body.setUserData(this.entity);
    this._lastPos = Vec2.clone(this.body.getPosition());
    this._lastVel = Vec2.clone(this.body.getLinearVelocity());

    this._syncComponent = <Position>this.entity.getComponent(Position);
    this._rotationComponent = <Rotation>this.entity.getComponent(Rotation);
  }

  public onDestroy(): void {
    this.entity.world.getPhysicsWorld().destroyBody(this.body);
  }

  public update(deltaTime: number): void {
    const pos = this.body.getPosition();
    const vel = this.body.getLinearVelocity();
    const ang = this.body.getAngle();
    // Move
    if (
      (this._syncComponent != null && Vec2.distance(this._lastPos, pos) >= 0.0001) ||
      Vec2.distance(this._lastVel, vel) >= 0.0001
    ) {
      this._syncComponent.position = pos;
      this._syncComponent.velocity = vel;
      this._lastPos = Vec2.clone(pos);
      this._lastVel = Vec2.clone(vel);
    }

    // Rotate
    if (this._rotationComponent.angle.toFixed(2) != ang.toFixed(2)) {
      this._rotationComponent.angle = ang;
      this.body.setAwake(true);
    }
  }

  public getBody(): Body {
    return this.body;
  }
}
