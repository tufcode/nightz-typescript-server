import { Component } from './component';
import { ComponentIds } from '../protocol';
import { Entity } from '../entity';
import * as EventEmitter from 'eventemitter3';
import { Fixture } from 'planck-js';

export class Health extends Component {
  public isImmune: boolean;
  public isDirty: boolean;

  private _currentHealth = 100;
  private _maxHealth = 100;
  private _eventEmitter: EventEmitter;

  private lastDamageSource: Entity | Fixture;
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

  public on(event: 'damage' | 'heal', fn: (...args: any[]) => void): void {
    this._eventEmitter.on(event, fn);
  }

  public off(event: 'damage' | 'heal', listener: (...args: any[]) => void): void {
    this._eventEmitter.removeListener(event, listener);
  }

  public get isDead(): boolean {
    return this._currentHealth == 0;
  }

  public get maxHealth(): number {
    return this._maxHealth;
  }
  public set maxHealth(value: number) {
    this._maxHealth = Math.max(value, 1);
    this.isDirty = true;
  }

  public get currentHealth(): number {
    return this._currentHealth;
  }
  public set currentHealth(value: number) {
    if ((this.isDead && value == this._currentHealth) || value == this._currentHealth) return;
    this._currentHealth = value;
    this.isDirty = true;
  }

  public damage(amount: number, source: Entity | Fixture): void {
    if (this.isDead) return;
    amount = Math.min(Math.min(amount, this._maxHealth), this._currentHealth);
    if (!this.isImmune) {
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
