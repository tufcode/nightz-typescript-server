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
  private _regeneration = 0;

  private _lastDamage = Date.now();
  private _regenTick = 0;

  public constructor(maxHealth: number, regeneration: number, deathCallback: () => void) {
    super();
    this._eventEmitter = new EventEmitter();
    this._maxHealth = maxHealth;
    this._currentHealth = maxHealth;
    this._regeneration = regeneration;
    this._deathCallback = deathCallback;
  }

  public on(event: 'damage' | 'heal', fn: (...args: any[]) => void): EventEmitter {
    return this._eventEmitter.on(event, fn);
  }
  public get isDead(): boolean {
    return this._isDead;
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
    let makeDirty = true;
    if (Math.floor(value) == Math.floor(this._currentHealth)) makeDirty = false;

    this._currentHealth = value;
    if (this._currentHealth <= 0) {
      if (this._deathCallback != null && !this.isUnkillable) {
        makeDirty = false;
        this._isDead = true;
        this._deathCallback();
      } else this._currentHealth = this._maxHealth;
    }
    if (makeDirty) {
      this.entity._isDirty = true;
      this._isDirty = true;
    }
  }

  public damage(amount: number, source: Entity): void {
    if (this._isDead) return;
    this.currentHealth -= amount;
    this.lastDamageSource = source;
    this._lastDamage = Date.now();

    this._eventEmitter.emit('damage', amount, source);
  }

  public update(deltaTime: number) {
    if (this._currentHealth < this._maxHealth && Date.now() - this._lastDamage > 3000) {
      this._regenTick += deltaTime;
      if (this._regenTick >= 1) {
        this._regenTick = 0;
        this.currentHealth = Math.min(this._maxHealth, this._currentHealth + this._regeneration);
      }
    } else this._regenTick = 0;
  }

  public serialize(client: Client, initialization?: boolean): Buffer {
    if (!this._isDirty && !initialization) return null;
    this._isDirty = false;

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
