import { Component } from './component';
import { Entity } from '../entity';
import { ComponentIds } from '../protocol';
import { Client } from 'elsa';
import GameRoom from '../game-room';

export class ChatMessage extends Component {
  private clearTick = 0;
  public get text(): string {
    return this._text;
  }

  public set text(value: string) {
    this.clearTick = 0;
    this._text = value;
    this.isDirty = true;
  }
  private _text = '';
  public isDirty: boolean;

  public update(deltaTime: number) {
    this.clearTick += deltaTime;
    if (this.clearTick >= 3 && this._text != '') {
      this.text = '';
    }
  }

  public serialize(): Buffer {
    this.isDirty = false;
    const buf = Buffer.allocUnsafe(3 + 2 * this._text.length);
    let index = 0;
    buf.writeUInt8(ComponentIds.ChatMessage, index);
    index += 1;
    buf.writeUInt16LE(this._text.length, index);
    index += 2;
    for (let j = 0; j < this._text.length; j++) {
      buf.writeUInt16LE(this._text.charCodeAt(j), index);
      index += 2;
    }
    return buf;
  }
}
