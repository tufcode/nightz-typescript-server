import { Component } from './component';
import { Item, ItemState } from '../items/item';
import { ComponentIds, getBytes, Protocol } from '../protocol';
import { Client } from 'elsa';
import { clamp } from '../utils';
import * as EventEmitter from 'eventemitter3';

export class Experience extends Component {
  private _isDirty: boolean;
  private _neededPoints = 200;
  private _points = 0;
  private _previousPoints = 0;
  private _level = 1;
  private _eventEmitter: EventEmitter;

  public constructor() {
    super();
    this._eventEmitter = new EventEmitter();
  }

  public on(event: 'beforeUpdatePoints' | 'afterUpdatePoints' | 'levelUp', fn: (...args: any[]) => void): EventEmitter {
    return this._eventEmitter.on(event, fn);
  }

  public get points(): number {
    return this._points;
  }

  public set points(value: number) {
    this._eventEmitter.emit('beforeUpdatePoints', value, this);
    this._points = value;
    this._eventEmitter.emit('afterUpdatePoints', this);
    this.calculateLevel();

    this._isDirty = true;
    this.entity._isDirty = true;
  }
  public get totalPoints(): number {
    return this._previousPoints + this._points;
  }
  public get level(): number {
    return this._level;
  }

  private calculateLevel() {
    if (this._level == 100) {
      this._neededPoints = 0;
      return;
    }
    while (this._points >= this._neededPoints) {
      this._level++;
      this._previousPoints += this._neededPoints;
      this._points = clamp(this._points - this._neededPoints, 0, Number.MAX_SAFE_INTEGER);
      this._neededPoints = Math.round((this._neededPoints + 200) * 1.05);
      this._eventEmitter.emit('levelUp');
    }
  }

  public serialize(client: Client, initialization?: boolean): Buffer {
    if (this._isDirty || initialization) {
      this._isDirty = false;
      if (this.entity.owner != null && this.entity.owner.id == client.id) {
        const buf = Buffer.allocUnsafe(10);

        let index = 0;
        buf.writeUInt8(ComponentIds.Experience, index);
        index += 1;

        // Level
        buf.writeUInt8(this._level, index);
        index += 1;
        // Points
        buf.writeUInt32LE(Math.floor(this._points), index);
        index += 4;
        // Needed Points
        buf.writeUInt32LE(this._neededPoints, index);
        index += 4;

        return buf;
      } else {
        const buf = Buffer.allocUnsafe(2);

        let index = 0;
        buf.writeUInt8(ComponentIds.Level, index);
        index += 1;

        // Level
        buf.writeUInt8(this._level, index);
        index += 1;

        return buf;
      }
    }
    return null;
  }
}
