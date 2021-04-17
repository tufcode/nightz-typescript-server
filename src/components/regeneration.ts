import { Component } from './component';
import { ComponentIds } from '../protocol';
import { Entity } from '../entity';
import * as EventEmitter from 'eventemitter3';
import { Health } from './health';

export class Regeneration extends Component {
  private _amount = 0;
  private _currentTick = 0;
  private _healthComponent: Health;
  private _combatHealing: boolean;

  public constructor(healthPerSecond: number, allowHealingInCombat = false) {
    super();
    this._amount = healthPerSecond;
    this._combatHealing = allowHealingInCombat;
  }

  public init(): void {
    this._healthComponent = <Health>this.entity.getComponent(Health);
  }

  public update(deltaTime: number): void {
    this._currentTick += deltaTime;
    if (!this._combatHealing && this._healthComponent.damagedRecently) return;

    if (this._currentTick >= 1 && this._healthComponent.currentHealth < this._healthComponent.maxHealth) {
      this._currentTick = 0;
      this._healthComponent.currentHealth = Math.min(
        this._healthComponent.currentHealth + this._amount,
        this._healthComponent.maxHealth,
      );
    }
  }
}
