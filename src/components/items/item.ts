import { Component } from '../component';
import { Inventory, ItemSlot } from '../inventory';
import { Shape, Vec2 } from 'planck-js';
import { World } from '../../systems/world';
import { Entity } from '../../entity';
import { GameClient } from '../../game-client';
import { Protocol } from '../../protocol';
import { EntityId } from '../../data/entity-id';

export enum ItemState {
  IN_INVENTORY,
  EQUIPPED,
}

export class Item extends Component {
  public get inventory(): Inventory {
    return this._inventory;
  }
  public set inventory(value: Inventory) {
    this._inventory = value;

    if (this.parent.owner == null) return;
    const cli = <GameClient>this.parent.owner.getUserData();
    if (this.queuedMessageIndex != -1 && cli.queuedMessages.length > this.queuedMessageIndex) {
      cli.queuedMessages.splice(this.queuedMessageIndex, 1);
    }

    this.queuedMessageIndex = cli.queuedMessages.push(this.serializeForOwner()) - 1;
  }

  public get parent(): Entity {
    return this._inventory?.entity;
  }

  public state: ItemState;
  public type: ItemSlot;
  public used = 0;
  public max = 0;

  public requiredWood = 0;
  public requiredStone = 0;
  public requiredFood = 0;
  public maximumUse = 0;
  public currentUse = 0;

  protected _primary: boolean;
  private queuedMessageIndex = -1;
  private _inventory: Inventory;

  public constructor(type: ItemSlot) {
    super();
    this.type = type;
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
    buf.writeUInt32LE(this.entity.objectId, 1);
    buf.writeUInt16LE(this.requiredWood, 5);
    buf.writeUInt16LE(this.requiredStone, 7);
    buf.writeUInt16LE(this.requiredFood, 9);
    buf.writeUInt16LE(this.currentUse, 11);
    buf.writeUInt16LE(this.maximumUse, 13);

    return buf;
  }
}

// HOWTO: You can create "status components" to send item updates to clients such as cooldowns
