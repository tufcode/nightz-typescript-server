import { Component } from './component';
import { Item, ItemState } from '../items/item';
import { ComponentIds } from '../protocol';
import { Client } from 'elsa';

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
  public activeHand: Item;
  public activeHat: Item;

  private items: Item[] = [];
  private _isDirty: boolean;

  public init(): void {}

  public update(deltaTime: number): void {
    if (this.entity.input.primary) {
      if (this.activeHand != null) this.activeHand.primary();
      if (this.activeHat != null) this.activeHat.primary();
    }
  }

  public addItem(item: Item): void {
    item.inventory = this;
    this.items.push(item);

    if (item.type == ItemSlot.Slot1 && this.activeHand == null) {
      this.activeHand = item;
    }

    this._isDirty = true;
    this.entity._isDirty = true;
  }

  public removeItem(item: Item): void {
    this.items.splice(this.items.indexOf(item), 1);
    this._isDirty = true;
    this.entity._isDirty = true;
  }

  public serialize(client: Client, initialization?: boolean): Buffer {
    if (this._isDirty || initialization) {
      this._isDirty = false;
      if (this.entity.owner != null && this.entity.owner.id == client.id) {
        let totalItemIdLength = 0;
        for (let i = 0; i < this.items.length; i++) {
          totalItemIdLength += this.items[i].id.length * 2;
        }

        const buf = Buffer.allocUnsafe(
          2 + 2 * this.items.length + totalItemIdLength + 2 + this.activeHand.id.length * 2,
        );

        let index = 0;
        buf.writeUInt8(ComponentIds.InventoryFull, index);
        index += 1;
        buf.writeUInt8(this.items.length, index);
        index += 1;

        for (let i = 0; i < this.items.length; i++) {
          buf.writeUInt16LE(this.items[i].id.length, index);
          index += 2;
          for (let j = 0; j < this.items[i].id.length; j++) {
            buf.writeUInt16LE(this.items[i].id.charCodeAt(j), index);
            index += 2;
          }
        }

        // Item ids
        buf.writeUInt16LE(this.activeHand.id.length, index);
        index += 2;
        for (let j = 0; j < this.activeHand.id.length; j++) {
          buf.writeUInt16LE(this.activeHand.id.charCodeAt(j), index);
          index += 2;
        }

        return buf;
      } else {
        const buf = Buffer.allocUnsafe(3 + this.activeHand.id.length * 2);

        let index = 0;
        buf.writeUInt8(ComponentIds.InventoryActiveOnly, index);
        index += 1;

        // Item ids
        buf.writeUInt16LE(this.activeHand.id.length, index);
        index += 2;
        for (let j = 0; j < this.activeHand.id.length; j++) {
          buf.writeUInt16LE(this.activeHand.id.charCodeAt(j), index);
          index += 2;
        }
      }
    }
    return null;
  }
}
