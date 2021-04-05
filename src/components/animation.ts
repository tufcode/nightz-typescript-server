import { Component } from './component';
import { ComponentIds, EntityCategory } from '../protocol';
import { Client } from 'elsa';

export class Animation extends Component {
  public isDirty: boolean;
  private _animationId = 0;
  private _speed: number;

  public setAnimation(id: number, speed: number): void {
    this._animationId = id;
    this._speed = speed;
    this.isDirty = true;
  }

  public serialize(): Buffer {
    this.isDirty = false;

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
