import { Component } from './component';
import { Entity } from '../entity';
import { ComponentIds } from '../protocol';
import { Client } from 'elsa';

export class NameTag extends Component {
  public get name(): string {
    return this._name;
  }

  public set name(value: string) {
    this._name = value;
    this.isDirty = true;
  }
  private _name: string;
  public isDirty: boolean;

  public setName(name: string) {
    this._name = name;
  }

  public serialize(): Buffer {
    this.isDirty = false;
    const buf = Buffer.allocUnsafe(3 + 2 * this._name.length);
    let index = 0;
    buf.writeUInt8(ComponentIds.NameTag, index);
    index += 1;
    buf.writeUInt16LE(this._name.length, index);
    index += 2;
    for (let j = 0; j < this._name.length; j++) {
      buf.writeUInt16LE(this._name.charCodeAt(j), index);
      index += 2;
    }
    return buf;
  }
}
