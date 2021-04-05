import { Component } from './component';
import { ComponentIds } from '../protocol';
import { Item } from '../items/item';

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
    this._hand = value;
    this.isDirty = true;
  }

  public serialize(): Buffer {
    this.isDirty = false;

    const buf = Buffer.allocUnsafe(9);
    // Packet Id
    buf.writeUInt8(ComponentIds.Equipment, 0);
    buf.writeUInt32LE(this._hand?.entity.objectId ?? 0, 1);
    buf.writeUInt32LE(this._hat?.entity.objectId ?? 0, 5);

    return buf;
  }
}
