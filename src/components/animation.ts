import { Component } from './component';
import { ComponentIds, EntityCategory } from '../protocol';
import { Client } from 'elsa';

export class Animation extends Component {
  private _animationId = 0;
  private _isDirty: boolean;
  private _speed: number;
  public setAnimation(id: number, speed: number): void {
    this._animationId = id;
    this._speed = speed;
    this._isDirty = true;
    this.entity._isDirty = true;
  }

  public serialize(client: Client, initialization?: boolean): Buffer {
    if (!this._isDirty && !initialization) return null;
    this._isDirty = false;

    const buf = Buffer.allocUnsafe(6);
    // Packet Id
    buf.writeUInt8(ComponentIds.Animation, 0);
    buf.writeUInt8(this._animationId, 1);
    buf.writeFloatLE(this._speed, 2);

    return buf;
  }

  public getAnimationId(): number {
    return this._animationId;
  }
}
