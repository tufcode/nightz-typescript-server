import { Item, ItemState } from './item';

export class Consumable extends Item {
  private _lastPrimary: boolean;
  public update(deltaTime: number) {
    if (this.state == ItemState.EQUIPPED && this.inventory.entity.input.primary) {
      if (this._lastPrimary) return;

      this._lastPrimary = true;
      this.onConsume();
    } else this._lastPrimary = false;
  }

  protected onConsume() {}
}
