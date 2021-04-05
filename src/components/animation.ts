import { Component } from './component';
import { ComponentIds } from '../protocol';
import { Client } from 'elsa';
import { Vec2 } from 'planck-js';
import { ITier } from '../game-client';

export class Animation extends Component {
  private _animationId = 0;
  private _speed = 0;
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
