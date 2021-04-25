import { Component } from './component';
import { Item, ItemState } from './items/item';
import { ComponentIds, getBytes, Protocol } from '../protocol';
import { Client } from 'elsa';
import { clamp } from '../utils';
import * as EventEmitter from 'eventemitter3';

export class Level extends Component {
  public get neededPoints(): number {
    return this._neededPoints;
  }
  public isDirty: boolean;
  private _neededPoints = 50;
  private _points = 0;
  private _previousPoints = 0;
  private _level = 1;
  private _eventEmitter: EventEmitter;

  public constructor() {
    super();
    this._eventEmitter = new EventEmitter();
  }

  public on(event: 'beforePointsUpdate' | 'afterPointsUpdate' | 'levelUp', fn: (...args: any[]) => void): EventEmitter {
    return this._eventEmitter.on(event, fn);
  }

  public off(event: 'beforePointsUpdate' | 'afterPointsUpdate' | 'levelUp'): EventEmitter {
    return this._eventEmitter.off(event);
  }

  public get points(): number {
    return this._points;
  }

  public set points(value: number) {
    this._eventEmitter.emit('beforePointsUpdate', this._points, value);
    this._points = value;
    this.calculateLevel();
    this._eventEmitter.emit('afterPointsUpdate');
  }
  public get totalPoints(): number {
    return this._previousPoints + this._points;
  }
  public get level(): number {
    return this._level;
  }

  private calculateLevel() {
    if (this._level == 100) {
      return;
    }
    while (this._points >= this._neededPoints) {
      this.isDirty = true;
      this._level++;
      this._previousPoints += this._neededPoints;
      this._points = clamp(this._points - this._neededPoints, 0, Number.MAX_SAFE_INTEGER);
      this._neededPoints = Math.round((this._neededPoints + 120) * 1.1);
      this._eventEmitter.emit('levelUp');

      if (this._level == 100) {
        this._neededPoints = 0;
        return;
      }
    }
  }

  public serialize(): Buffer {
    this.isDirty = false;
    const buf = Buffer.allocUnsafe(2);

    let index = 0;
    buf.writeUInt8(ComponentIds.Level, index);
    index += 1;

    // Level
    buf.writeUInt8(this._level, index);
    index += 1;

    return buf;
  }

  public static calculateLevel(points: number): number {
    let needed = 50;
    let level = 1;
    while (points >= needed) {
      level++;
      points = clamp(points - needed, 0, Number.MAX_SAFE_INTEGER);
      needed = Math.round((needed + 120) * 1.1);

      if (level == 100) {
        return level;
      }
    }
    return level;
  }
}
