import { Component } from './component';
import { Entity } from '../entity';
import { PhysicsBody } from './physics-body';
import { Body, Fixture, Vec2 } from 'planck-js';
import { PositionAndRotation } from './position-and-rotation';
import { Gold } from './gold';
import { Inventory } from './inventory';
import { Character } from './character';
import { InputState } from '../client-data';

export class CharacterController extends Character {
  public init(): void {
    super.init();
    this.speed = 40;
  }

  // todo stop dis
  public onTriggerEnter(me: Fixture, other: Fixture): void {
    (<Inventory>this.entity.getComponent(Inventory)).activeHand.onTriggerEnter(me, other);
  }

  public onTriggerExit(me: Fixture, other: Fixture): void {
    (<Inventory>this.entity.getComponent(Inventory)).activeHand.onTriggerExit(me, other);
  }

  public update(deltaTime: number): void {
    const body = this.bodyComponent.getBody();

    const input = Vec2.zero();

    if (this.entity.input.right) input.x = 1;
    else if (this.entity.input.left) input.x = -1;
    if (this.entity.input.up) input.y = 1;
    else if (this.entity.input.down) input.y = -1;

    if (input.lengthSquared() != 0) {
      this.move(body, input, deltaTime);
    }

    if (this.entity.input.angle.toFixed(2) != body.getAngle().toFixed(2)) {
      body.setAngle(this.entity.input.angle);
      this._rotationComponent.angle = body.getAngle();
    }
  }
}
