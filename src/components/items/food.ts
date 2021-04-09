import { Consumable } from './consumable';
import { Health } from '../health';
import { GameClient } from '../../game-client';
import { Protocol } from '../../protocol';
import { Animation } from '../animation';
import { Entity } from '../../entity';
import { Item } from './item';
import { ItemSlot } from '../inventory';

export class Food extends Item {
  public set isEating(value: boolean) {
    console.log(value == true, 'foodVal, current', this.current);
    this._isEating = value;
    if (value) this.animationComponent.setAnimation(3, 3);
    else this.animationComponent.setAnimation(0, 0);
  }
  private _current = 0;
  private _isEating: boolean;
  private eatTick = 0;
  private animationComponent: Animation;

  public get current(): number {
    return this._current;
  }

  public set current(value: number) {
    // todo maybe make it so it only sends one packet per patch even if there are multiple updates?
    this._current = value;
    (<GameClient>this.parent.owner.getUserData()).queuedMessages.push(this.serialize());
  }

  private parentHealth: Health;

  public onEquip(entity: Entity) {
    super.onEquip(entity);
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
    if (this.current >= 1) {
      this.eatTick = 0;
      this.isEating = true;
    }
  }

  public update(deltaTime: number) {
    if (this._isEating) {
      this.eatTick += deltaTime;
      if (this.eatTick >= 1) {
        this.isEating = false;
        this.current--;
        this.parentHealth.currentHealth += 10;
      }
    }
  }

  public serialize(): Buffer {
    const buf = Buffer.allocUnsafe(5);
    // Packet Id
    buf.writeUInt8(Protocol.FoodInfo, 0);
    buf.writeUInt32LE(Math.floor(this._current), 1);

    return buf;
  }
}
