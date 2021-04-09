import { Component } from '../component';
import { Inventory, ItemSlot } from '../inventory';
import { Shape, Vec2 } from 'planck-js';
import { World } from '../../systems/world';
import { Entity } from '../../entity';

export enum ItemState {
  IN_INVENTORY,
  EQUIPPED,
}

export class Item extends Component {
  public get parent(): Entity {
    return this.inventory.entity;
  }
  public state: ItemState;
  public type: ItemSlot;
  public inventory: Inventory;
  public used = 0;
  public max = 0;
  protected _primary: boolean;

  public constructor(type: ItemSlot) {
    super();
    this.type = type;
  }

  public update(deltaTime: number): void {}
  public onEquip(entity: Entity): void {
    this.state = ItemState.EQUIPPED;
  }
  public onUnequip(): void {
    this.state = ItemState.IN_INVENTORY;
  }
  public onDestroy(): void {}

  public setPrimary(b: boolean): void {
    this._primary = b;
  }
}

// HOWTO: You can create "status components" to send item updates to clients such as cooldowns
