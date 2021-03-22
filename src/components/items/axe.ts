import { Item, ItemState } from './item';

export class Axe extends Item {
  public update(deltaTime: number) {
    if (this.state == ItemState.EQUIPPED && this.inventory.entity.input.primary) {
      console.log(Date.now(), 'ATTACK, AXE!');
    }
  }
}
