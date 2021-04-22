import { Component } from './component';
import { Entity } from '../entity';
import { ComponentIds } from '../protocol';
import { Client } from 'elsa';
import GameRoom from '../game-room';

export class ChatMessage extends Component {
  public clearTick = 0;
  public text = '';

  public serialize(): Buffer {
    this.isDirty = false;
    const buf = Buffer.allocUnsafe(3 + 2 * this.text.length);
    let index = 0;
    buf.writeUInt8(ComponentIds.ChatMessage, index);
    index += 1;
    buf.writeUInt16LE(this.text.length, index);
    index += 2;
    for (let j = 0; j < this.text.length; j++) {
      buf.writeUInt16LE(this.text.charCodeAt(j), index);
      index += 2;
    }
    return buf;
  }
}
