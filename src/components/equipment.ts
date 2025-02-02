import { Component } from './component';
import { ComponentIds } from '../protocol';
import { Item } from '../items/item';
import { Fixture } from 'planck-js';
import { EntityId } from '../data/entity-id';
import { Movement } from './movement';

export class Equipment extends Component {
  private _hand: Item;
  private _hat: Item;
  private _movementComponent: Movement;
  private _handSpeedChange = 0;

  public get hat(): Item {
    return this._hat;
  }

  public set hat(value: Item) {
    this._hat = value;
    this.isDirty = true;
  }
  public get hand(): Item {
    return this._hand;
  }

  public set hand(value: Item) {
    this._movementComponent.speed += this._handSpeedChange;
    this._hand?.onUnequip();
    value.onEquip();
    this._hand = value;
    this.isDirty = true;

    this._handSpeedChange =
      this._movementComponent.speed - this._movementComponent.speed * this._hand.movementSpeedMultiplier;
    this._movementComponent.speed -= this._handSpeedChange;
  }

  public init(): void {
    this._movementComponent = <Movement>this.entity.getComponent(Movement);
  }

  public onTriggerEnter(me: Fixture, other: Fixture): void {
    if (this._hand != null) this._hand.onTriggerEnter(me, other);
  }

  public onTriggerExit(me: Fixture, other: Fixture): void {
    if (this._hand != null) this._hand.onTriggerExit(me, other);
  }

  public update(deltaTime: number): void {
    if (this._hand != null) this._hand.update(deltaTime);
  }

  public serialize(): Buffer {
    this.isDirty = false;

    const buf = Buffer.allocUnsafe(5);
    // Packet Id
    buf.writeUInt8(ComponentIds.Equipment, 0);
    buf.writeUInt16LE(this._hand != null ? this._hand.entityId : EntityId.None, 1);
    buf.writeUInt16LE(this._hat != null ? this._hat.entityId : EntityId.None, 3);

    return buf;
  }
}
