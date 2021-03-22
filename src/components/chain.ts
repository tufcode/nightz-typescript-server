import { Component } from './component';
import { Entity } from '../entity';
import { PhysicsBody } from './physics-body';
import { Vec2 } from 'planck-js';

export class Chain extends Component {
  private bodyComponent: PhysicsBody;

  public init() {
    this.bodyComponent = <PhysicsBody>this.entity.getComponent(PhysicsBody);
    if (this.bodyComponent == null) {
      console.error('Chain requires a PhysicsBody component.');
    }
  }

  public update(deltaTime: number) {
    const body = this.bodyComponent.getBody();
    // Clamp speeds
    const vel = body.getLinearVelocity();
    const newX = this.clamp(vel.x, -10, 10);
    const newY = this.clamp(vel.y, -10, 10);
    body.setLinearVelocity(Vec2(newX, newY));
  }

  public clamp(val, min, max) {
    return Math.min(Math.max(val, min), max);
  }
}
