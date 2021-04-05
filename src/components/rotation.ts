import { Component } from './component';
import { ComponentIds } from '../protocol';
import { Client } from 'elsa';
import { Vec2 } from 'planck-js';

export class Rotation extends Component {
  private _angle: number;

  public constructor(angle: number) {
    super();
    this._angle = angle;
  }
  public get angle(): number {
    return this._angle;
  }

  public set angle(value: number) {
    this._angle = value;
    this.isDirty = true;
  }

  public serialize(): Buffer {
    this.isDirty = false;

    const buf = Buffer.allocUnsafe(5);
    // Packet Id
    buf.writeUInt8(ComponentIds.Rotation, 0);
    // Rotation
    buf.writeFloatLE(this._angle, 1);

    return buf;
  }
}
