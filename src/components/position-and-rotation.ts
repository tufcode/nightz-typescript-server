import { Component } from './component';
import { ComponentIds } from '../protocol';
import { Client } from 'elsa';
import { Vec2 } from 'planck-js';
import { Vector2 } from '../systems/physics2/body';

export class PositionAndRotation extends Component {
  private _position: Vector2;
  private _angle: number;
  private _isDirty: boolean;

  public constructor(position: Vector2, angle: number) {
    super();
    this._position = position;
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

  public get position(): Vector2 {
    return this._position;
  }

  public set position(value: Vector2) {
    this._position = value;
    this._isDirty = true;
    this.entity._isDirty = true;
  }

  public serialize(client: Client, initialization?: boolean): Buffer {
    if (!this._isDirty && !initialization) return null;
    this._isDirty = false;

    const buf = Buffer.allocUnsafe(13);
    // Packet Id
    buf.writeUInt8(ComponentIds.PositionAndRotation, 0);
    // Position
    buf.writeFloatLE(this._position.x, 1);
    buf.writeFloatLE(this._position.y, 5);
    // Rotation
    buf.writeFloatLE(this._angle, 9);

    return buf;
  }
}
