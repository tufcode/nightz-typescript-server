import { Component } from '../component';
import { Equipped } from '../equipped';
import { Inventory } from '../inventory';

export enum ItemState {
  ON_GROUND,
  IN_INVENTORY,
  EQUIPPED,
}
export enum ItemType {
  HAND,
}

export class Item extends Component {
  public state: ItemState;
  public inventory: Inventory;

  public onEquip() {
    this.state = ItemState.EQUIPPED;
  }
  public onDrop() {
    this.state = ItemState.ON_GROUND;
  }
  public onPickup(inventory: Inventory) {
    this.inventory = inventory;
    this.state = ItemState.IN_INVENTORY;
  }

  public onDestroy() {
    if (this.inventory != null) this.inventory.removeItem(this);
  }
}
