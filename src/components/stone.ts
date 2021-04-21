import { Component } from './component';
import { ComponentIds, Protocol } from '../protocol';
import { Item } from './items/item';
import { GameClient } from '../game-client';

export class Stone extends Component {
  private _amount = 0;
  private queuedMessageIndex = -1;

  public get amount(): number {
    return this._amount;
  }

  public set amount(value: number) {
    this._amount = value;

    if (this.entity.owner == null) return;
    this.entity.owner.queueMessage('stone', this.serialize());
  }

  public constructor() {
    super();
    // Set isDirty to false because it is true when a Component is instantiated and we don't want gold to be
    // sent to anyone but owner.
    this.isDirty = false;
  }

  public serialize(): Buffer {
    const buf = Buffer.allocUnsafe(5);
    // Packet Id
    buf.writeUInt8(Protocol.StoneInfo, 0);
    buf.writeUInt32LE(Math.floor(this._amount), 1);

    return buf;
  }
}
