import { Component } from './component';
import { ComponentIds } from '../protocol';
import { Client } from 'elsa';
import { Vec2 } from 'planck-js';
import { ITier } from '../game-client';

export class Minimap extends Component {
  public serialize(): Buffer {
    this.isDirty = false;

    const buf = Buffer.allocUnsafe(1);
    // Packet Id
    buf.writeUInt8(ComponentIds.Minimap, 0);

    return buf;
  }
}
