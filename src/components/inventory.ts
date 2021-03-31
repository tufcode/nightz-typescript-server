import { Component } from './component';
import { Item, ItemState } from '../items/item';
import { ComponentIds, getBytes, Protocol } from '../protocol';
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
  private _lastPrimary: boolean;
  private _gold = 0;

  public get gold(): number {
    return this._gold;
  }

  public set gold(value: number) {
    this._gold = value;
    if (this.entity.owner != null) {
      this.entity.owner.send(getBytes[Protocol.GoldInfo](this.gold));
    }
  }

  public init(): void {}

  public update(deltaTime: number): void {
    if (this.entity.input.primary) {
      if (!this._lastPrimary) {
        this._lastPrimary = true;
        if (this.activeHand != null) this.activeHand.primaryStart(this.entity);
        if (this.activeHat != null) this.activeHat.primaryStart(this.entity);
      }
    } else if (this._lastPrimary) {
      if (this.activeHand != null) this.activeHand.primaryEnd(this.entity);
      if (this.activeHat != null) this.activeHat.primaryEnd(this.entity);
      this._lastPrimary = false;
    }
  }

  public selectItem(id: number): void {
    for (let i = 0; i < this.items.length; i++) {
      const item = this.items[i];
      if (item.entity.objectId == id) {
        if (this.activeHand != null) this.activeHand.onUnequip();

        this.activeHand = item;
        this._isDirty = true;
        this.entity._isDirty = true;
        break;
      }
    }
  }

  public addItem(item: Item): void {
    item.inventory = this;
    this.items.push(item);

    if (item.type == ItemSlot.Slot1 && this.activeHand == null) {
      this.activeHand = item;
      item.onEquip(this.entity);
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

        const buf = Buffer.allocUnsafe(2 + 6 * this.items.length + 4);

        let index = 0;
        buf.writeUInt8(ComponentIds.InventoryFull, index);
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

        // Item ids
        buf.writeUInt32LE(this.activeHand?.entity.objectId ?? 0, index);
        index += 4;

        return buf;
      } else {
        const buf = Buffer.allocUnsafe(5);

        let index = 0;
        buf.writeUInt8(ComponentIds.InventoryActiveOnly, index);
        index += 1;

        // Item ids
        buf.writeUInt32LE(this.activeHand?.entity.objectId ?? 0, index);
        index += 4;
      }
    }
    return null;
  }
}
