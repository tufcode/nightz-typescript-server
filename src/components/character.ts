import { Component } from './component';
import { Entity } from '../entity';
import { PhysicsBody } from './physics-body';
import { Body, Fixture, Vec2 } from 'planck-js';
import { PositionAndRotation } from './position-and-rotation';
import { Gold } from './gold';
import { Inventory } from './inventory';
import { Rotation } from './rotation';

export class Character extends Component {
  protected bodyComponent: PhysicsBody;

  public speed = 10;
  protected _rotationComponent: Rotation;

  public init(): void {
    this.bodyComponent = <PhysicsBody>this.entity.getComponent(PhysicsBody);
    this._rotationComponent = <Rotation>this.entity.getComponent(Rotation);
    if (this.bodyComponent == null) {
      console.error('Character requires PhysicsBody components.');
    }
  }

  public move(body: Body, input: Vec2, deltaTime: number): void {
    input.normalize();
    input.mul(this.speed);

    const currentVelocity = body.getLinearVelocity();
    const velocityChange = Vec2.sub(input, currentVelocity);

    body.applyLinearImpulse(input, body.getWorldCenter(), true);
  }
}
