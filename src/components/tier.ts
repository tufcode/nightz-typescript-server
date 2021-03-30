import { Component } from './component';
import { ComponentIds } from '../protocol';
import { Client } from 'elsa';
import { Vec2 } from 'planck-js';
import { ITier } from '../client-data';

export class Tier extends Component {
  public linkedTo: Tier;
  private _tier: ITier;
  private _isDirty: boolean;

  public get tier(): ITier {
    return this._tier;
  }

  public set tier(value: ITier) {
    this._tier = value;
    this._isDirty = true;
    this.entity._isDirty = true;
  }

  public serialize(client: Client, initialization?: boolean): Buffer {
    if (!this._isDirty && !initialization) return null;
    this._isDirty = false;

    const buf = Buffer.allocUnsafe(2);
    // Packet Id
    buf.writeUInt8(ComponentIds.Tier, 0);
    // Position
    buf.writeUInt8(this.tier.id, 1);

    return buf;
  }
}
