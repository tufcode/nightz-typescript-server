import { Component } from '../components/component';
import { Inventory, ItemSlot } from '../components/inventory';
import { Shape, Vec2 } from 'planck-js';
import { World } from '../systems/world';
import { Entity } from '../entity';

export enum ItemState {
  IN_INVENTORY,
  EQUIPPED,
}

export class Item {
  public id: string;
  public state: ItemState;
  public type: ItemSlot;
  public inventory: Inventory;
  public used: number = 0;
  public max: number = 0;

  public constructor(id: string, type: ItemSlot) {
    this.id = id;
    this.type = type;
  }

  public primaryStart(entity: Entity): void {}
  public onEquip(entity: Entity): void {
    this.state = ItemState.EQUIPPED;
  }
  public onUnequip(): void {
    this.state = ItemState.IN_INVENTORY;
  }
  public onDestroy(): void {}

  public primaryEnd(entity: Entity): void {}
}

// HOWTO: You can create "status components" to send item updates to clients such as cooldowns
