import { Component } from './component';
import { ComponentIds, Protocol } from '../protocol';
import { Item } from './items/item';
import { GameClient } from '../game-client';
import { Level } from './level';
import { Type } from '../types';
import { EntityId } from '../data/entity-id';
import { Inventory } from './inventory';
import { Equipment } from './equipment';
import GameRoom from '../game-room';
import { VisibilitySystem } from '../systems/visibility-system';

export class Upgrade {
  public _upgrades: Upgrade[] = [];
  public _upgradeLevel: number;
  public _upgradeItemId: EntityId;
  public _createCallback: () => Item;

  public addUpgrade(upgradedItemId: EntityId, createCallback: () => Item, minimumLevel: number): Upgrade {
    const upgrade = new Upgrade();
    upgrade._upgradeItemId = upgradedItemId;
    upgrade._upgradeLevel = minimumLevel;
    upgrade._createCallback = createCallback;

    this._upgrades.push(upgrade);
    return upgrade;
  }
}

export class ItemUpgrade extends Component {
  private _upgradeTree: {
    [key: string]: { pointsId: string; currentUpgrade: Upgrade; currentItem?: Item };
  } = {};
  private _points: {
    [key: string]: number;
  } = {};
  private _givePointsAt: {
    [key: number]: string[];
  } = {};
  private _totalPoints = 0;
  private _levelComponent: Level;
  private _inventoryComponent: Inventory;
  private _equipmentComponent: Equipment;

  public init(): void {
    this._inventoryComponent = <Inventory>this.entity.getComponent(Inventory);
    this._equipmentComponent = <Equipment>this.entity.getComponent(Equipment);
    // Listen to level events
    this._levelComponent = <Level>this.entity.getComponent(Level);
    this._levelComponent.on('levelUp', () => {
      const givePointsTo = this._givePointsAt[this._levelComponent.level];
      if (givePointsTo) {
        for (let i = 0; i < givePointsTo.length; i++) {
          const pointsId = givePointsTo[i];
          if (this._points.hasOwnProperty(pointsId)) {
            this._points[pointsId] += 1;
          } else {
            this._points[pointsId] = 1;
          }
          this._totalPoints++;
        }
      }

      if (this._totalPoints > 0) {
        // Send upgrade here TODO only one per update pls
        (<GameClient>this.entity.owner.getUserData()).queuedMessages.push(this.serialize());
      }
    });
  }

  public addDefaultUpgrade(
    id: string,
    pointsId: string,
    upgradedItemId: EntityId,
    createCallback: () => Item,
    minimumLevel: number,
  ): Upgrade {
    const upgrade = new Upgrade();
    upgrade._upgradeItemId = upgradedItemId;
    upgrade._upgradeLevel = minimumLevel;
    upgrade._createCallback = createCallback;

    this._upgradeTree[id] = {
      pointsId,
      currentUpgrade: upgrade,
    };

    const item = createCallback();
    if (this._upgradeTree[id].currentItem) this._inventoryComponent.removeItem(this._upgradeTree[id].currentItem);
    this._inventoryComponent.addItem(item);
    this._upgradeTree[id].currentItem = item;

    return upgrade;
  }

  public addPointsWhen(pointsId: string, levels: number[]): void {
    for (let i = 0; i < levels.length; i++) {
      const level = levels[i];
      if (this._givePointsAt.hasOwnProperty(level)) {
        this._givePointsAt[level].push(pointsId);
      } else {
        this._givePointsAt[level] = [pointsId];
      }
    }
  }

  public upgrade(id: number): void {
    const keys = Object.keys(this._upgradeTree);
    for (let i = 0; i < keys.length; i++) {
      const tree = this._upgradeTree[keys[i]];
      if (!this._points[tree.pointsId]) continue;
      for (let j = 0; j < tree.currentUpgrade._upgrades.length; j++) {
        const upgrade = tree.currentUpgrade._upgrades[j];
        if (upgrade._upgradeItemId == id) {
          if (
            upgrade._upgradeLevel > tree.currentUpgrade._upgradeLevel &&
            upgrade._upgradeLevel <= this._levelComponent.level
          ) {
            tree.currentUpgrade = upgrade;
            this._points[tree.pointsId] -= 1;
            this._totalPoints--;

            // Create item
            const item = upgrade._createCallback();

            // Make observers update next frame so inventory packet doesn't get sent before entity is visible. TODO might be unnecessary
            (<VisibilitySystem>(<GameRoom>this.entity.world.room).systems[VisibilitySystem.name]).forceUpdateNext();

            // Add item to inventory
            this._inventoryComponent.addItem(item);

            // Remove current item of this type if any exists
            if (tree.currentItem) {
              this._inventoryComponent.removeItem(tree.currentItem);
              if (this._equipmentComponent.hand.entity.id == tree.currentItem.entity.id) {
                this._equipmentComponent.hand = item;
              }
            }
            // Set current item
            tree.currentItem = item;

            (<GameClient>this.entity.owner.getUserData()).queuedMessages.push(this.serialize());
          }
          break;
        }
      }
    }
  }

  public serialize(): Buffer {
    const buf = Buffer.allocUnsafe(2);
    // Packet Id
    buf.writeUInt8(Protocol.Upgrade, 0);

    const upgradable = [];
    const keys = Object.keys(this._upgradeTree);
    for (let i = 0; i < keys.length; i++) {
      const tree = this._upgradeTree[keys[i]];
      // Has enough points?
      if (this._points[tree.pointsId]) {
        for (let j = 0; j < tree.currentUpgrade._upgrades.length; j++) {
          const upgrade = tree.currentUpgrade._upgrades[j];
          // Can upgrade to this item?
          if (
            upgrade._upgradeLevel > tree.currentUpgrade._upgradeLevel &&
            upgrade._upgradeLevel <= this._levelComponent.level
          ) {
            upgradable.push(upgrade);
          }
        }
      }
    }

    buf.writeUInt8(upgradable.length, 1);

    const newBuf = Buffer.allocUnsafe(upgradable.length * 2);
    let index = 0;

    for (let i = 0; i < upgradable.length; i++) {
      newBuf.writeUInt16LE(upgradable[i]._upgradeItemId, index);
      index += 2;
    }

    return Buffer.concat([buf, newBuf]);
  }
}
