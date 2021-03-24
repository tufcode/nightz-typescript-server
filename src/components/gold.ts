import { Component } from './component';
import { Item } from './items/item';
import { ComponentIds, getBytes, Protocol } from '../protocol';
import { Client } from 'elsa/src/index';
import { BuildingBlock } from './items/building-block';

export class Gold extends Component {
  public get amount(): number {
    return this._amount;
  }

  public set amount(value: number) {
    this._amount = value;
    this.entity._isDirty = true;
    this._isDirty = true;
  }
  private _amount = 0;
  private _isDirty: boolean;

  public update(): void {
    this.amount += 1;
  }

  public serialize(client: Client, initialization?: boolean): Buffer {
    if ((this._isDirty || initialization) && this.entity.owner != null && this.entity.owner.id == client.id) {
      this._isDirty = false;

      const buf = Buffer.allocUnsafe(5);
      // Packet Id
      buf.writeUInt8(ComponentIds.Gold, 0);
      // Amount
      buf.writeUInt32LE(this.amount, 1);

      return buf;
    }
    return null;
  }
}
