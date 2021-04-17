import { Component } from './component';
import { ComponentIds } from '../protocol';
import { Item } from './items/item';
import { Fixture } from 'planck-js';
import { EntityId } from '../data/entity-id';

export class Equipment extends Component {
  private _hand: Item;
  private _hat: Item;

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
    value.onEquip();
    this._hand = value;
    this.isDirty = true;
  }

  public onTriggerEnter(me: Fixture, other: Fixture): void {
    if (this._hand != null) this._hand.onTriggerEnter(me, other);
  }

  public onTriggerExit(me: Fixture, other: Fixture): void {
    if (this._hand != null) this._hand.onTriggerExit(me, other);
  }

  public serialize(): Buffer {
    this.isDirty = false;

    const buf = Buffer.allocUnsafe(9);
    // Packet Id
    buf.writeUInt8(ComponentIds.Equipment, 0);
    buf.writeUInt32LE(this._hand != null && this._hand.entity.id != EntityId.None ? this._hand.entity.objectId : 0, 1);
    buf.writeUInt32LE(this._hat?.entity.objectId ?? 0, 5);

    return buf;
  }
}
