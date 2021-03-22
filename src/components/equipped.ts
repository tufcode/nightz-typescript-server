import { Component } from './component';
import { Item } from './items/item';
import { ComponentIds, getBytes, Protocol } from '../protocol';
import { Client } from 'elsa/src/index';
import { BuildingBlock } from './items/building-block';

export interface InventoryItem {
  slot: number;
  item: Item;
}

export class Equipped extends Component {
  public handheld: Item;
  public hat: Item;
  private _isDirty: boolean;

  public equip(item: Item) {
    item.onEquip();
    this.handheld = item;
    this._isDirty = true;
  }

  public unEquip(item: Item) {
    this.handheld = null;
    this._isDirty = true;
  }

  public serialize(client: Client, initialization?: boolean): Buffer {
    if (!this._isDirty && !initialization) return null;
    this._isDirty = false;

    const buf = Buffer.allocUnsafe(18);
    // Packet Id
    buf.writeUInt8(ComponentIds.Equipped, 0);
    // Is building block?
    buf.writeUInt8(this.handheld != null && this.handheld instanceof BuildingBlock ? 1 : 0, 1);
    // Offsets
    buf.writeFloatLE(1, 2);
    buf.writeFloatLE(0, 6);
    // Item ids
    buf.writeUInt32LE(this.handheld ? this.handheld.entity.objectId : 0, 10);
    buf.writeUInt32LE(this.hat ? this.hat.entity.objectId : 0, 14);

    return buf;
  }
}
