import { Component } from '../component';
import { Inventory, ItemType } from '../inventory';
import { Fixture, Shape, Vec2 } from 'planck-js';
import { World } from '../../systems/world';
import { Entity } from '../../entity';
import { GameClient } from '../../game-client';
import { Protocol } from '../../protocol';
import { EntityId } from '../../data/entity-id';

export enum ItemState {
  IN_INVENTORY,
  EQUIPPED,
}

export class Item {
  public get inventory(): Inventory {
    return this._inventory;
  }
  public set inventory(value: Inventory) {
    this._inventory = value;
  }

  public get parent(): Entity {
    return this._inventory?.entity;
  }

  public id: number;
  public entityId: EntityId;
  public state: ItemState;
  public type: ItemType;
  public used = 0;
  public max = 0;

  public requiredWood = 0;
  public requiredStone = 0;
  public requiredFood = 0;
  public maximumUse = 0;
  public currentUse = 0;

  protected _primary: boolean;
  private _inventory: Inventory;

  public constructor(entityId: EntityId, type: ItemType, requiredStone = 0, requiredFood = 0, requiredWood = 0) {
    this.entityId = entityId;
    this.type = type;
    this.requiredWood = requiredWood;
    this.requiredStone = requiredStone;
    this.requiredFood = requiredFood;
  }

  public update(deltaTime: number): void {}
  public onEquip(): void {
    this.state = ItemState.EQUIPPED;
  }
  public onUnequip(): void {
    this.state = ItemState.IN_INVENTORY;
  }
  public onDestroy(): void {}

  public setPrimary(b: boolean): void {
    this._primary = b;
  }

  public serializeForOwner(): Buffer {
    const buf = Buffer.allocUnsafe(15);

    buf.writeUInt8(Protocol.ItemInfo, 0);
    buf.writeUInt32LE(this.id, 1);
    buf.writeUInt16LE(this.requiredWood, 5);
    buf.writeUInt16LE(this.requiredStone, 7);
    buf.writeUInt16LE(this.requiredFood, 9);
    buf.writeUInt16LE(this.currentUse, 11);
    buf.writeUInt16LE(this.maximumUse, 13);

    return buf;
  }

  public onTriggerEnter(me: Fixture, other: Fixture) {}

  public onTriggerExit(me: Fixture, other: Fixture) {}
}
