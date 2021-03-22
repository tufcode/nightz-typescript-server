import { Component } from './component';
import { Entity } from '../entity';
import { PhysicsBody } from './physics-body';
import { Vec2 } from 'planck-js';

export class CharacterController extends Component {
  public entity: Entity;

  private bodyComponent: PhysicsBody;

  private maxSpeed: number = 4;
  private acceleration: number = 4;
  private terminalVelocity: number = 4;

  public init() {
    this.bodyComponent = <PhysicsBody>this.entity.getComponent(PhysicsBody);
    if (this.bodyComponent == null) {
      console.error('CharacterController requires a PhysicsBody component.');
    }
  }

  public update(deltaTime: number) {
    const body = this.bodyComponent.getBody();
    let targetVelocity = Vec2.zero();

    /*const angle = body.getAngle(); // Body angle in radians.

    targetVelocity.x = Math.cos(angle);
    targetVelocity.y = Math.sin(angle);*/

    // (this.owner.input.right ? 1 : 0, this.owner.input.up ? 1 : 0);
    if (this.entity.input.right) targetVelocity.x = 1;
    else if (this.entity.input.left) targetVelocity.x = -1;
    if (this.entity.input.up) targetVelocity.y = 1;
    else if (this.entity.input.down) targetVelocity.y = -1;

    const sqr = targetVelocity.lengthSquared() || 1;
    targetVelocity.x /= sqr;
    targetVelocity.y /= sqr;
    targetVelocity.mul(this.maxSpeed);

    let currentVelocity = body.getLinearVelocity();
    let velocityChange = Vec2.sub(targetVelocity, currentVelocity);

    body.applyLinearImpulse(velocityChange.clamp(this.acceleration), body.getWorldCenter(), true);

    // Clamp speeds
    const vel = body.getLinearVelocity();
    const newX = this.clamp(vel.x, -this.terminalVelocity, this.terminalVelocity);
    const newY = this.clamp(vel.y, -this.terminalVelocity, this.terminalVelocity);
    body.setLinearVelocity(Vec2(newX, newY));
    // Set angle
    //body.setAngle(this.entity.input.angle);
  }

  public clamp(val, min, max) {
    return Math.min(Math.max(val, min), max);
  }
}
