import { Component } from './component';
import { Entity } from '../entity';
import { Body, Shape, Vec2 } from 'planck-js';
import { PositionAndRotation } from './position-and-rotation';
import { PhysicsBody } from './physics-body';
import { ItemSlot } from './inventory';
import { World } from '../systems/world';

export class Construction extends Component {
  private bodyComponent: PhysicsBody;
  private timeSpentWaiting: number = 0;
  private failureCallback: () => void;
  private createCallback: (world: World, position: Vec2, angle: number) => Entity;
  private _isDone: boolean;

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
    /*let k = body.getContactList();
    let i = 0;
    for (; k != null; k = k.next) {
      i++;
      if (i >= 3) {
        // Maximum contacts reached, destroy this.
        this._isDone = true;
        this.failureCallback();
        this.entity.destroy();
        console.log('maxContactsReached');
        return;
      }
    }*/
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
