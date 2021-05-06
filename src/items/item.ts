import { Component } from '../components/component';
import { Inventory, ItemType } from '../components/inventory';
import { Fixture, Shape, Vec2 } from 'planck-js';
import { World } from '../systems/world';
import { Entity } from '../entity';
import { GameClient } from '../game-client';
import { Protocol } from '../protocol';
import { EntityId } from '../data/entity-id';

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
  public movementSpeedMultiplier: number;

  public requiredWood = 0;
  public requiredStone = 0;
  public requiredFood = 0;
  public maximumUse = 0;
  public usageMeterId: string;

  protected _primary: boolean;
  private _inventory: Inventory;

  public constructor(
    entityId: EntityId,
    type: ItemType,
    movementSpeedMultiplier: number,
    requiredStone = 0,
    requiredFood = 0,
    requiredWood = 0,
    usageMeterId?: string,
  ) {
    this.entityId = entityId;
    this.type = type;
    this.movementSpeedMultiplier = movementSpeedMultiplier;
    this.requiredWood = requiredWood;
    this.requiredStone = requiredStone;
    this.requiredFood = requiredFood;
    this.usageMeterId = usageMeterId;
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

  public onTriggerEnter(me: Fixture, other: Fixture) {}

  public onTriggerExit(me: Fixture, other: Fixture) {}
}
