import { Component } from './component';
import { PhysicsBody } from './physics-body';
import { Rotation } from './rotation';
import GameRoom from '../game-room';
import { VisibilitySystem } from '../systems/visibility-system';
import { Body, Vec2 } from 'planck-js';
import { MovementSystem } from '../systems/movement-system';

export class Movement extends Component {
  public bodyComponent: PhysicsBody;

  public speed = 10;

  public constructor(speed: number) {
    super();
    this.speed = speed;
  }

  public init(): void {
    this.bodyComponent = <PhysicsBody>this.entity.getComponent(PhysicsBody);
    if (this.bodyComponent == null) {
      console.error('Movement requires PhysicsBody component.');
    }
  }

  public move(input: Vec2): void {
    const body = this.bodyComponent.getBody();
    input.normalize();
    input.mul(this.speed);

    body.applyForceToCenter(input, true);
  }
}
