import { Component } from './component';
import { ComponentIds } from '../protocol';
import { Client } from 'elsa';
import { Vec2 } from 'planck-js';
import { ITier } from '../game-client';

export class Tier extends Component {
  private _tier: ITier;

  public get tier(): ITier {
    return this._tier;
  }

  public set tier(value: ITier) {
    this._tier = value;
    this.isDirty = true;
  }

  public serialize(): Buffer {
    this.isDirty = false;

    const buf = Buffer.allocUnsafe(2);
    // Packet Id
    buf.writeUInt8(ComponentIds.Tier, 0);
    // Position
    buf.writeUInt8(this.tier.id, 1);

    return buf;
  }
}
