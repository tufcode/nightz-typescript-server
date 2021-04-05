import { Component } from './component';
import { PhysicsBody } from './physics-body';
import { Rotation } from './rotation';
import GameRoom from '../game-room';
import { VisibilitySystem } from '../systems/visibility-system';
import { Body, Vec2 } from 'planck-js';
import { Movement } from './movement';
import { GameClient } from '../game-client';
import { MovementSystem } from '../systems/movement-system';
import { Equipment } from './equipment';

export class PlayerInput extends Component {
  private movementComponent: Movement;
  private bodyComponent: PhysicsBody;
  private ownerClientData: GameClient;
  private equipmentComponent: Equipment;

  public init(): void {
    this.ownerClientData = this.entity.owner.getUserData();
    this.equipmentComponent = <Equipment>this.entity.getComponent(Equipment);
    this.movementComponent = <Movement>this.entity.getComponent(Movement);
    this.bodyComponent = <PhysicsBody>this.entity.getComponent(PhysicsBody);
    if (this.movementComponent == null || this.bodyComponent == null) {
      console.error('PlayerInput requires Movement and PhysicsBody components.');
    }
  }

  public update(deltaTime: number): void {
    const body = this.bodyComponent.getBody();
    const input = Vec2.zero();

    if (this.ownerClientData.input.right) input.x = 1;
    else if (this.ownerClientData.input.left) input.x = -1;
    if (this.ownerClientData.input.up) input.y = 1;
    else if (this.ownerClientData.input.down) input.y = -1;

    if (input.lengthSquared() != 0) {
      this.movementComponent.move(input);
    }

    if (this.equipmentComponent != null) {
      this.equipmentComponent.hand?.setPrimary(this.ownerClientData.input.primary);
      this.equipmentComponent.hat?.setPrimary(this.ownerClientData.input.primary);
    }

    body.setAngle(this.ownerClientData.input.angle);
  }
}
