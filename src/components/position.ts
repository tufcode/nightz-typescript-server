import { Component } from './component';
import { ComponentIds } from '../protocol';
import { Client } from 'elsa';
import { Vec2 } from 'planck-js';
import { performance } from 'perf_hooks';
import GameRoom from '../game-room';
import { VisibilitySystem } from '../systems/visibility-system';

export class Position extends Component {
  private _position: Vec2;
  private _velocity: Vec2;
  private teleportTick: number;

  public constructor(position: Vec2, velocity: Vec2) {
    super();
    this._position = position;
    this._velocity = velocity;
  }

  public get velocity(): Vec2 {
    return this._velocity;
  }

  public set velocity(value: Vec2) {
    this._velocity = value;
    this.isDirty = true;
  }

  public get position(): Vec2 {
    return this._position;
  }

  public set position(value: Vec2) {
    this._position = value;
    this.isDirty = true;
  }

  public serialize(): Buffer {
    this.isDirty = false;

    const buf = Buffer.allocUnsafe(18);
    // Packet Id
    buf.writeUInt8(ComponentIds.PositionAndRotation, 0);
    // Position
    buf.writeFloatLE(this._position.x, 1);
    buf.writeFloatLE(this._position.y, 5);
    // Velocity
    buf.writeFloatLE(this._velocity.x, 9);
    buf.writeFloatLE(this._velocity.y, 13);
    // Is teleportation?
    buf.writeUInt8(this.teleportTick == (<GameRoom>this.entity.world.room).currentTick ? 1 : 0, 17);

    return buf;
  }
}
