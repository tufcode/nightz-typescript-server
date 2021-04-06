import { Component } from './component';
import { Item } from './items/item';
import { getBytes, Protocol } from '../protocol';
import { GameClient } from '../game-client';

export enum ItemSlot {
  Slot1 = 0,
  Slot2 = 1,
  Slot3 = 2,
  Slot4 = 3,
  Slot5 = 4,
  Slot6 = 5,
  Slot7 = 6,
  Slot8 = 7,
  Slot9 = 8,
  Hat = 9,
}

export class Inventory extends Component {
  private items: Item[] = [];

  public constructor() {
    super();
    // Set isDirty to false because it is true when a Component is instantiated and we don't want inventory to be
    // sent to anyone but owner.
    this.isDirty = false;
  }

  public addItem(item: Item): void {
    item.inventory = this;
    this.items.push(item);

    (<GameClient>this.entity.owner.getUserData()).queuedMessages.push(this.serialize());
  }

  public removeItem(item: Item): void {
    this.items.splice(this.items.indexOf(item), 1);
    (<GameClient>this.entity.owner.getUserData()).queuedMessages.push(this.serialize());
  }

  public serialize(): Buffer {
    const buf = Buffer.allocUnsafe(2 + 6 * this.items.length + 4);

    let index = 0;
    buf.writeUInt8(Protocol.Inventory, index);
    index += 1;
    buf.writeUInt8(this.items.length, index);
    index += 1;

    for (let i = 0; i < this.items.length; i++) {
      buf.writeUInt8(this.items[i].used, index);
      index += 1;
      buf.writeUInt8(this.items[i].max, index);
      index += 1;
      buf.writeUInt32LE(this.items[i].entity.objectId, index);
      index += 4;
    }

    return buf;
  }
}
