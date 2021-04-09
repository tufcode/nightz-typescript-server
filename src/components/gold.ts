import { Component } from './component';
import { ComponentIds, Protocol } from '../protocol';
import { Item } from './items/item';
import { GameClient } from '../game-client';

export class Gold extends Component {
  private _amount = 0;

  public get amount(): number {
    return this._amount;
  }

  public set amount(value: number) {
    // todo maybe make it so it only sends one packet per patch even if there are multiple updates?
    this._amount = value;
    (<GameClient>this.entity.owner.getUserData()).queuedMessages.push(this.serialize());
  }

  public constructor() {
    super();
    // Set isDirty to false because it is true when a Component is instantiated and we don't want inventory to be
    // sent to anyone but owner.
    this.isDirty = false;
  }

  public init() {
    this.amount = 10000;
  }

  public serialize(): Buffer {
    const buf = Buffer.allocUnsafe(5);
    // Packet Id
    buf.writeUInt8(Protocol.GoldInfo, 0);
    buf.writeUInt32LE(Math.floor(this._amount), 1);

    return buf;
  }
}
