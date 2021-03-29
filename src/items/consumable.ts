import { Item, ItemState } from './item';

export class Consumable extends Item {
  private _lastPrimary: number;
  public primary(): void {
    if (Date.now() - this._lastPrimary < 100) return;

    this._lastPrimary = Date.now();
    this.onConsume();
  }

  protected onConsume(): void {}
}
