import { Component } from './component';
import { Item } from './items/item';
import { ComponentIds, getBytes, Protocol } from '../protocol';
import { Client } from 'elsa/src/index';
import { BuildingBlock } from './items/building-block';
import { Vec2 } from 'planck-js';

export class SyncScale extends Component {
  public get scale(): Vec2 {
    return this._scale;
  }

  public set scale(value: Vec2) {
    this._scale = value;
    this.entity._isDirty = true;
    this._isDirty = true;
  }

  private _scale: Vec2;
  private _isDirty: boolean;

  public setScale(s: Vec2): void {
    this.scale = s;
  }

  public serialize(client: Client, initialization?: boolean): Buffer {
    if ((this._isDirty || initialization) && this._scale != null) {
      this._isDirty = false;

      const buf = Buffer.allocUnsafe(5);
      // Packet Id
      buf.writeUInt8(ComponentIds.Scale, 0);
      // Scale
      buf.writeUInt16LE(this.scale.x, 1);
      buf.writeUInt16LE(this.scale.y, 3);

      return buf;
    }
    return null;
  }
}
