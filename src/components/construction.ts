import { Component } from './component';
import { Entity } from '../entity';
import { Body, Shape, Vec2 } from 'planck-js';
import { PositionAndRotation } from './position-and-rotation';
import { PhysicsBody } from './physics-body';
import { ItemSlot } from './inventory';
import { World } from '../systems/world';
import { Rotation } from './rotation';

export class Construction extends Component {
  private bodyComponent: PhysicsBody;
  private timeSpentWaiting = 0;
  private failureCallback: () => void;
  private createCallback: (world: World, position: Vec2, angle: number) => Entity;
  private _isDone: boolean;
  private rotationComponent: Rotation;
  private positionComponent: PositionAndRotation;

  public constructor(
    failureCallback: () => void,
    createCallback: (world: World, position: Vec2, angle: number) => Entity,
  ) {
    super();
    this.failureCallback = failureCallback;
    this.createCallback = createCallback;
  }

  public init(): void {
    this.bodyComponent = <PhysicsBody>this.entity.getComponent(PhysicsBody);
  }

  public update(deltaTime: number): void {
    if (this._isDone) return;
    const body = this.bodyComponent.getBody();
    if (body.isAwake()) {
      this.timeSpentWaiting += deltaTime;
      if (this.timeSpentWaiting >= 5) {
        this._isDone = true;
        this.failureCallback();
        this.entity.destroy();
      }
      return;
    }
    this._isDone = true;
    this.entity.destroy();
    this.entity.world.addEntity(this.createCallback(this.entity.world, body.getPosition(), body.getAngle()));
  }
}
