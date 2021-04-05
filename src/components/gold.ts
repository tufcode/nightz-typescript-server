import { Component } from './component';
import { ComponentIds } from '../protocol';
import { Item } from '../items/item';

export class Gold extends Component {
  private _amount = 0;

  public get amount(): number {
    return this._amount;
  }

  public set amount(value: number) {
    this._amount = value;
    this.entity.owner.send(this.serialize());
  }

  public constructor() {
    super();
    // Set isDirty to false because it is true when a Component is instantiated and we don't want inventory to be
    // sent to anyone but owner.
    this.isDirty = false;
  }

  public serialize(): Buffer {
    const buf = Buffer.allocUnsafe(5);
    // Packet Id
    buf.writeUInt8(ComponentIds.PositionAndRotation, 0);
    buf.writeUInt32LE(this._amount, 1);

    return buf;
  }
}
