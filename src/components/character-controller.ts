import { Component } from './component';
import { Entity } from '../entity';
import { PhysicsBody } from './physics-body';
import { Vec2 } from 'planck-js';
import { PositionAndRotation } from './position-and-rotation';
import { Vector2 } from '../systems/physics2/body';

export class CharacterController extends Component {
  public entity: Entity;

  private bodyComponent: PhysicsBody;
  private syncComponent: PositionAndRotation;

  private speed = 4;

  public init(): void {
    this.syncComponent = <PositionAndRotation>this.entity.getComponent(PositionAndRotation);
    this.bodyComponent = <PhysicsBody>this.entity.getComponent(PhysicsBody);
    if (this.bodyComponent == null || this.syncComponent == null) {
      console.error('CharacterController requires PhysicsBody and PositionAndRotation components.');
    }
  }

  public update(): void {
    const body = this.bodyComponent.getBody();
    const targetVelocity = new Vector2(0, 0);

    if (this.entity.input.right) targetVelocity.x = 1;
    else if (this.entity.input.left) targetVelocity.x = -1;
    if (this.entity.input.up) targetVelocity.y = 1;
    else if (this.entity.input.down) targetVelocity.y = -1;

    const hasMoveInput = targetVelocity.lengthSquared() != 0;

    if (hasMoveInput) {
      targetVelocity.normalize();
      targetVelocity.mul(this.speed);

      body.addImpulse(targetVelocity);
      //body.velocity.x = targetVelocity.x;
      //body.velocity.y = targetVelocity.y;
    }

    // Clamp speeds
    const newX = this.clamp(body.velocity.x, -this.speed, this.speed);
    const newY = this.clamp(body.velocity.y, -this.speed, this.speed);
    body.velocity.x = newX;
    body.velocity.y = newY;

    // Set angle
    if (this.entity.input.angle.toFixed(2) != body.angle.toFixed(2)) {
      //body.setAngle(this.entity.input.angle);
      this.syncComponent.angle = body.angle;
    }

    this.syncComponent.position = body.position;
  }
  public clamp(val, min, max) {
    return Math.min(Math.max(val, min), max);
  }
}
