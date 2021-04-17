import { Component } from './component';
import { ComponentIds } from '../protocol';
import { Entity } from '../entity';
import * as EventEmitter from 'eventemitter3';

export class Health extends Component {
  public isUnkillable: boolean;
  public isDirty: boolean;

  private _currentHealth = 100;
  private _maxHealth = 100;
  private _eventEmitter: EventEmitter;

  private lastDamageSource: Entity;
  private lastDamageTime: number;
  private lastDamageAmount: number;
  public get damagedRecently(): boolean {
    return Date.now() - this.lastDamageTime <= 3000;
  }

  public constructor(maxHealth: number) {
    super();
    this._eventEmitter = new EventEmitter();
    this._maxHealth = maxHealth;
    this._currentHealth = maxHealth;
  }

  public on(event: 'damage' | 'heal', fn: (...args: any[]) => void): EventEmitter {
    return this._eventEmitter.on(event, fn);
  }

  public get isDead(): boolean {
    return this._currentHealth <= 0;
  }

  public get maxHealth(): number {
    return this._maxHealth;
  }
  public set maxHealth(value: number) {
    this._maxHealth = Math.max(value, 0);
    this.isDirty = true;
  }

  public get currentHealth(): number {
    return this._currentHealth;
  }
  public set currentHealth(value: number) {
    if (this.isDead) return;

    this._currentHealth = Math.max(Math.min(value, this._maxHealth), 0);
    this.isDirty = true;
  }

  public damage(amount: number, source: Entity): void {
    if (this.isDead) return;
    if (!this.isUnkillable) {
      this.currentHealth -= amount;
      this.lastDamageSource = source;
      this.lastDamageTime = Date.now();
      this.lastDamageAmount = amount;
    }

    this._eventEmitter.emit('damage', amount, source);
  }

  public serialize(): Buffer {
    this.isDirty = false;

    const buf = Buffer.allocUnsafe(9);
    // Packet Id
    buf.writeUInt8(ComponentIds.Health, 0);
    // Max
    buf.writeUInt32LE(Math.floor(this.maxHealth), 1);
    // Current
    buf.writeUInt32LE(Math.floor(this.currentHealth), 5);

    return buf;
  }
}
