import { Component } from './component';
import { ComponentIds } from '../protocol';

export class Health extends Component {
  public regeneration = 1;
  private _currentHealth = 100;
  private _maxHealth = 100;
  private _isDirty: boolean;
  private _deathCallback: () => void;

  public constructor(deathCallback: () => void) {
    super();
    this._deathCallback = deathCallback;
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
    this._currentHealth = value;
    if (this._currentHealth <= 0) {
      if (this._deathCallback != null) this._deathCallback();
      this._currentHealth = this._maxHealth;
    }
    this.entity._isDirty = true;
    this._isDirty = true;
  }

  public serialize(client, initialization?: boolean): Buffer {
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
}
