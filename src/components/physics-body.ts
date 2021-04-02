import { Component } from './component';
import { Entity } from '../entity';
import { Body } from 'planck-js';
import { PositionAndRotation } from './position-and-rotation';
import { Rotation } from './rotation';

export class PhysicsBody extends Component {
  public entity: Entity;
  private readonly body: Body;
  private _syncComponent: PositionAndRotation;
  private _rotationComponent: Rotation;

  public constructor(body: Body) {
    super();
    this.body = body;
  }

  public init(): void {
    this.body.setUserData(this.entity);

    this._syncComponent = <PositionAndRotation>this.entity.getComponent(PositionAndRotation);
  }

  public onDestroy() {
    this.entity.world.getPhysicsWorld().destroyBody(this.body);
  }

  public update(deltaTime: number) {
    if (this._syncComponent != null && this.body.isAwake()) {
      this._syncComponent.position = this.body.getPosition();
      this._syncComponent.velocity = this.body.getLinearVelocity();
    }
  }

  public getBody(): Body {
    return this.body;
  }
}
