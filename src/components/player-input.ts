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
import { Level } from './level';
import { getBytes, Protocol } from '../protocol';
import { Health } from './health';

export class PlayerInput extends Component {
  private movementComponent: Movement;
  private bodyComponent: PhysicsBody;
  private equipmentComponent: Equipment;
  private levelComponent: Level;
  private lastPrimary: boolean;

  public init(): void {
    const h = <Health>this.entity.getComponent(Health);
    this.equipmentComponent = <Equipment>this.entity.getComponent(Equipment);
    this.movementComponent = <Movement>this.entity.getComponent(Movement);
    this.bodyComponent = <PhysicsBody>this.entity.getComponent(PhysicsBody);
    if (this.movementComponent == null || this.bodyComponent == null) {
      console.error('PlayerInput requires Movement and PhysicsBody components.');
    }

    // Send owner EXP and Level updates when experience points change
    this.levelComponent = <Level>this.entity.getComponent(Level);
    this.levelComponent.on('afterPointsUpdate', () => this.sendExperienceToOwner());
    // Also send it immediately so that it is never 0,0,0
    this.sendExperienceToOwner();
  }

  public update(deltaTime: number): void {
    const body = this.bodyComponent.getBody();
    const input = Vec2.zero();

    if (this.entity.owner.input.right) input.x = 1;
    else if (this.entity.owner.input.left) input.x = -1;
    if (this.entity.owner.input.up) input.y = 1;
    else if (this.entity.owner.input.down) input.y = -1;

    if (input.lengthSquared() != 0) {
      this.movementComponent.move(input);
    }

    if (this.equipmentComponent != null && this.lastPrimary != this.entity.owner.input.primary) {
      this.lastPrimary = this.entity.owner.input.primary;
      this.equipmentComponent.hand?.setPrimary(this.entity.owner.input.primary);
      this.equipmentComponent.hat?.setPrimary(this.entity.owner.input.primary);
    }

    body.setAngle(this.entity.owner.input.angle);
  }

  private sendExperienceToOwner() {
    if (this.entity.owner == null) return;
    this.entity.owner.queueMessage(
      'exp',
      getBytes[Protocol.Experience](
        this.levelComponent.level,
        this.levelComponent.points,
        this.levelComponent.neededPoints,
      ),
    );
  }
}
