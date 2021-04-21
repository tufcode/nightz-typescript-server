import { Component } from './component';
import { Item } from './items/item';
import { getBytes, Protocol } from '../protocol';
import { GameClient } from '../game-client';
import { Type } from '../types';

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
  // sent to anyone but owner.
  private items: Item[] = [];
  private itemsWithId: { [key: number]: Item } = {};
  private itemsWithClass: { [key: string]: Item } = {};
  private lastItemId = 0;

  public constructor() {
    super();
    // Set isDirty to false because it is true when a Component is instantiated and we don't want inventory to be
    // sent to anyone but owner.
    this.isDirty = false;
  }

  public addItem(item: Item): void {
    item.id = this.lastItemId++;
    this.itemsWithId[item.id] = item;
    this.itemsWithClass[item.constructor.name] = item;
    this.items.push(item);

    if (this.entity.owner != null) {
      this.entity.owner.queueMessage('inv', this.serialize());
    }

    item.inventory = this;
  }

  public removeItem(item: Item): void {
    delete this.itemsWithId[item.id];
    delete this.itemsWithClass[item.constructor.name];
    this.items.splice(this.items.indexOf(item), 1);

    if (this.entity.owner != null) {
      this.entity.owner.queueMessage('inv', this.serialize());
    }

    item.onDestroy();
  }

  public serialize(): Buffer {
    const buf = Buffer.allocUnsafe(2 + 6 * this.items.length);

    let index = 0;
    buf.writeUInt8(Protocol.Inventory, index);
    index += 1;
    buf.writeUInt8(this.items.length, index);
    index += 1;

    for (let i = 0; i < this.items.length; i++) {
      buf.writeUInt16LE(this.items[i].entityId, index);
      index += 2;
      buf.writeUInt32LE(this.items[i].id, index);
      index += 4;
    }

    return buf;
  }

  public getItemById(id: number): Item {
    return this.itemsWithId[id];
  }

  public getItem(item: Type<Item>): Item {
    return this.itemsWithClass[item.name];
  }
}
