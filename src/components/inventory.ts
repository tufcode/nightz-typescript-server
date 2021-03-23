import { Component } from './component';
import { Item } from './items/item';
import { ComponentIds, getBytes, Protocol } from '../protocol';
import { Client } from 'elsa';
import { Equipped } from './equipped';
import GameRoom from '../game-room';

export class Inventory extends Component {
  private items: Item[] = [];
  private _isDirty: boolean;

  public addItem(item: Item): boolean {
    item.onPickup(this);
    this.items.push(item);
    this._isDirty = true;
    this.entity._isDirty = true;
    return true;
  }

  public removeItem(item: Item): void {
    this.items.splice(this.items.indexOf(item), 1);
    this._isDirty = true;
    this.entity._isDirty = true;

    const equippedComponent = <Equipped>this.entity.getComponent(Equipped);
    if (equippedComponent != null) equippedComponent.unEquip(item);
  }

  public serialize(client: Client, initialization?: boolean): Buffer {
    if ((this._isDirty || initialization) && this.entity.owner != null && this.entity.owner.id == client.id) {
      this._isDirty = false;
      const buf = Buffer.allocUnsafe(2 + 4 * this.items.length);

      let index = 0;
      buf.writeUInt8(ComponentIds.Inventory, index);
      index += 1;
      buf.writeUInt8(this.items.length, index);
      index += 1;

      for (let i = 0; i < this.items.length; i++) {
        buf.writeUInt32LE(this.items[i].entity.objectId, index);
        index += 4;
      }

      return buf;
    }
    return null;
  }
}
