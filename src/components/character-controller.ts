import { Component } from './component';
import { Entity } from '../entity';
import { PhysicsBody } from './physics-body';
import { Vec2 } from 'planck-js';
import { PositionAndRotation } from './position-and-rotation';
import { Gold } from './gold';

export class CharacterController extends Component {
  public entity: Entity;

  private bodyComponent: PhysicsBody;
  private syncComponent: PositionAndRotation;

  private speed = 60;

  public init(): void {
    this.syncComponent = <PositionAndRotation>this.entity.getComponent(PositionAndRotation);
    this.bodyComponent = <PhysicsBody>this.entity.getComponent(PhysicsBody);
    if (this.bodyComponent == null || this.syncComponent == null) {
      console.error('CharacterController requires PhysicsBody and PositionAndRotation components.');
    }
  }

  public update(): void {
    (<Gold>this.entity.getComponent(Gold)).amount += 100;
    const body = this.bodyComponent.getBody();
    const targetVelocity = Vec2.zero();

    if (this.entity.input.right) targetVelocity.x = 1;
    else if (this.entity.input.left) targetVelocity.x = -1;
    if (this.entity.input.up) targetVelocity.y = 1;
    else if (this.entity.input.down) targetVelocity.y = -1;

    const hasMoveInput = targetVelocity.lengthSquared() != 0;

    if (hasMoveInput) {
      targetVelocity.normalize();
      targetVelocity.mul(this.speed);

      const currentVelocity = body.getLinearVelocity();
      const velocityChange = Vec2.sub(targetVelocity, currentVelocity);

      body.applyLinearImpulse(velocityChange, body.getWorldCenter(), true);
    }

    // Set angle
    if (this.entity.input.angle.toFixed(2) != body.getAngle().toFixed(2)) {
      body.setAngle(this.entity.input.angle);
      this.syncComponent.angle = body.getAngle();
    }
  }
}
