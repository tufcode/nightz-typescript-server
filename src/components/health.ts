import { Component } from './component';
import { ComponentIds } from '../protocol';
import { Entity } from '../entity';
import * as EventEmitter from 'eventemitter3';
import { Client } from 'elsa';

export class Health extends Component {
  public isUnkillable: boolean;

  private _currentHealth = 100;
  private _maxHealth = 100;
  private _isDirty: boolean;
  private _deathCallback: () => void;
  private _isDead: boolean;
  private lastDamageSource: Entity;
  private _eventEmitter: EventEmitter;

  public constructor(deathCallback: () => void) {
    super();
    this._eventEmitter = new EventEmitter();
    this._deathCallback = deathCallback;
  }

  public on(event: 'damage' | 'heal', fn: (...args: any[]) => void): EventEmitter {
    return this._eventEmitter.on(event, fn);
  }

  public get maxHealth(): number {
    return this._maxHealth;
  }
  public set maxHealth(value: number) {
    this._maxHealth = value;
    this.entity._isDirty = true;
    this._isDirty = true;
  }
  public get currentHealth(): number {
    return this._currentHealth;
  }
  public set currentHealth(value: number) {
    if (this._isDead) return;
    this._currentHealth = value;
    if (this._currentHealth <= 0) {
      if (this._deathCallback != null && !this.isUnkillable) {
        this._isDead = true;
        this._deathCallback();
      } else this._currentHealth = this._maxHealth;
    }
    this.entity._isDirty = true;
    this._isDirty = true;
  }

  public damage(amount: number, source: Entity): void {
    this.currentHealth -= amount;
    this.lastDamageSource = source;

    this._eventEmitter.emit('damage', amount, source);
  }

  public serialize(client: Client, initialization?: boolean): Buffer {
    if (!this._isDirty && !initialization) return null;
    this._isDirty = false;

    const buf = Buffer.allocUnsafe(9);
    // Packet Id
    buf.writeUInt8(ComponentIds.Health, 0);
    // Max
    buf.writeUInt32LE(this.maxHealth, 1);
    // Current
    buf.writeUInt32LE(this.currentHealth, 5);

    return buf;
  }

  public isDead(): boolean {
    return this._isDead;
  }
}
