import { Component } from './component';
import { ComponentIds } from '../protocol';
import { Client } from 'elsa';
import { Vec2 } from 'planck-js';

export class Rotation extends Component {
  private _angle: number;
  private _isDirty: boolean;

  public constructor(angle: number) {
    super();
    this._angle = angle;
  }
  public get angle(): number {
    return this._angle;
  }

  public set angle(value: number) {
    this._angle = value;
    this._isDirty = true;
    this.entity._isDirty = true;
  }

  public serialize(client: Client, initialization?: boolean): Buffer {
    if (!this._isDirty && !initialization) return null;
    this._isDirty = false;

    const buf = Buffer.allocUnsafe(5);
    // Packet Id
    buf.writeUInt8(ComponentIds.Rotation, 0);
    // Rotation
    buf.writeFloatLE(this._angle, 1);

    return buf;
  }
}
