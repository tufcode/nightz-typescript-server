import { Component } from '../components/component';
import { Inventory, ItemSlot } from '../components/inventory';

export enum ItemState {
  IN_INVENTORY,
  EQUIPPED,
}

export class Item {
  public id: string;
  public state: ItemState;
  public type: ItemSlot;
  public inventory: Inventory;

  public primary(): void {}
  public onEquip(): void {
    this.state = ItemState.EQUIPPED;
  }
  public onUnequip(): void {
    this.state = ItemState.IN_INVENTORY;
  }
  public onDestroy(): void {}
}

// HOWTO: You can create "status components" to send item updates to clients such as cooldowns
