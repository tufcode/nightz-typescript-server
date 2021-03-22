import { Component } from './component';
import { ComponentIds } from '../protocol';
import { Client } from 'elsa';
import { Vec2 } from 'planck-js';

export class PositionAndRotation extends Component {
  public vec: Vec2;
  public angle: number;

  public serialize(client: Client, initialization?: boolean): Buffer {
    const buf = Buffer.allocUnsafe(13);
    // Packet Id
    buf.writeUInt8(ComponentIds.PositionAndRotation, 0);
    // Position
    buf.writeFloatLE(this.vec.x, 1);
    buf.writeFloatLE(this.vec.y, 5);
    // Rotation
    buf.writeFloatLE(this.angle, 9);

    return buf;
  }
}
