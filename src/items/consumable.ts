import { Item, ItemState } from './item';
import { Entity } from '../entity';

export class Consumable extends Item {
  public setPrimary(b: boolean) {
    if (!this._primary && b) {
      this.onConsume();
    }
    super.setPrimary(b);
  }

  protected onConsume(): void {}
}
