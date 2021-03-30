import { Item, ItemState } from './item';
import { Entity } from '../entity';

export class Consumable extends Item {
  public primaryStart(entity: Entity): void {
    this.onConsume();
  }

  protected onConsume(): void {}
}
