import { Consumable } from './consumable';
import { Health } from '../health';
import { GameClient } from '../../game-client';
import { Protocol } from '../../protocol';
import { Animation } from '../animation';
import { Entity } from '../../entity';
import { Item } from './item';
import { ItemSlot } from '../inventory';

export class Food extends Item {
  private foodQueuedMessageIndex = -1;
  public set isEating(value: boolean) {
    this._isEating = value;
    if (value) this.animationComponent.setAnimation(3, 3);
    else this.animationComponent.setAnimation(0, 0);
  }
  private _amount = 0;
  private _isEating: boolean;
  private eatTick = 0;
  private animationComponent: Animation;

  public get amount(): number {
    return this._amount;
  }

  public set amount(value: number) {
    this._amount = value;
    // todo do i need to send this somewhere else?
    if (this.entity.owner == null) return;
    this.entity.owner.queueMessage('food', this.serialize());
  }

  private parentHealth: Health;

  public onEquip() {
    super.onEquip();
    this.parentHealth = <Health>this.parent.getComponent(Health);
    this.animationComponent = <Animation>this.parent.getComponent(Animation);
  }

  public setPrimary(b: boolean) {
    if (!this._primary && b) {
      this.onConsume();
    } else if (this._isEating) this.isEating = false;
    super.setPrimary(b);
  }

  protected onConsume(): void {
    if (this.amount >= 1) {
      this.eatTick = 0;
      this.isEating = true;
    }
  }

  public update(deltaTime: number) {
    if (this._isEating) {
      this.eatTick += deltaTime;
      if (this.eatTick >= 1) {
        this.isEating = false;
        this.amount--;
        this.parentHealth.currentHealth += 10;
      }
    }
  }

  public serialize(): Buffer {
    const buf = Buffer.allocUnsafe(5);
    // Packet Id
    buf.writeUInt8(Protocol.FoodInfo, 0);
    buf.writeUInt32LE(Math.floor(this._amount), 1);

    return buf;
  }
}
