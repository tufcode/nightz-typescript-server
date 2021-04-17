import { Component } from './component';
import { ComponentIds } from '../protocol';
import { Client } from 'elsa';
import { Vec2 } from 'planck-js';
import { ITier } from '../game-client';

export class Zone extends Component {
  private _name = 'Zone';
  private _scale: Vec2;
  private _colorR = 1;
  private _colorG = 1;
  private _colorB = 1;

  public setData(name: string, scale: Vec2, r: number, g: number, b: number): void {
    this._name = name;
    this._scale = scale;
    this._colorR = r;
    this._colorG = g;
    this._colorB = b;
    this.isDirty = true;
  }

  public update(deltaTime: number) {}

  public serialize(): Buffer {
    this.isDirty = false;

    const buf = Buffer.allocUnsafe(10 + this._name.length * 2);
    // Packet Id
    buf.writeUInt8(ComponentIds.Zone, 0);
    // Position
    buf.writeUInt16LE(this._scale.x, 1);
    buf.writeUInt16LE(this._scale.y, 3);
    buf.writeUInt8(this._colorR, 5);
    buf.writeUInt8(this._colorG, 6);
    buf.writeUInt8(this._colorB, 7);

    buf.writeUInt16LE(this._name.length, 8);
    for (let j = 0; j < this._name.length; j++) {
      buf.writeUInt16LE(this._name.charCodeAt(j), 10 + j * 2);
    }

    return buf;
  }
}
