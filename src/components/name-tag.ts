import { Component } from './component';
import { Entity } from '../entity';
import { ComponentIds } from '../protocol';
import { Client } from 'elsa';

export class NameTag extends Component {
  public buffer: Buffer;
  private name: any;
  private _dirty: boolean;

  public setName(name: string) {
    this.name = name;
    this.updateBuffer();
  }

  public updateBuffer(): void {
    this.buffer = Buffer.allocUnsafe(3 + 2 * this.name.length);
    let index = 0;
    this.buffer.writeUInt8(ComponentIds.NameTag, index);
    index += 1;
    this.buffer.writeUInt16LE(this.name.length, index);
    index += 2;
    for (let j = 0; j < this.name.length; j++) {
      this.buffer.writeUInt16LE(this.name.charCodeAt(j), index);
      index += 2;
    }
    this._dirty = true;
    this.entity._isDirty = true;
  }

  public serialize(client: Client, initialization = false): Buffer {
    if (this._dirty) {
      this._dirty = false;
      return this.buffer;
    } else if (initialization) {
      return this.buffer;
    }
    return null;
  }
}
