import { Component } from './component';
import { ComponentIds, Protocol } from '../protocol';
import { Item } from './items/item';
import { GameClient } from '../game-client';
import { Level } from './level';
import { Type } from '../types';
import { EntityId } from '../data/entity-id';

export class ItemUpgrade extends Component {
  private _upgradeTree: {
    [key: string]: {
      pointsId: string;
      upgrades: { upgradedItemId: EntityId; upgradedItem: Item; minimumLevel: number }[];
      currentUpgradeLevel: number;
    };
  } = {};
  private _points: {
    [key: string]: number;
  } = {};
  private _givePointsAt: {
    [key: number]: string[];
  } = {};
  private _totalPoints = 0;
  private _levelComponent: Level;

  public init(): void {
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

  public addUpgrade(
    id: string,
    pointsId: string,
    upgradedItemId: EntityId,
    upgradedItem: Item,
    minimumLevel: number,
  ): void {
    if (this._upgradeTree.hasOwnProperty(id)) {
      this._upgradeTree[id].upgrades.push({ upgradedItemId, upgradedItem, minimumLevel });
    } else {
      this._upgradeTree[id] = {
        pointsId,
        upgrades: [{ upgradedItemId, upgradedItem, minimumLevel }],
        currentUpgradeLevel: 1,
      };
    }
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
    console.log('Upgrade: ', id);
    const keys = Object.keys(this._upgradeTree);
    for (let i = 0; i < keys.length; i++) {
      const tree = this._upgradeTree[keys[i]];
      if (!this._points[tree.pointsId]) continue;
      for (let j = 0; j < tree.upgrades.length; j++) {
        const upgrade = tree.upgrades[i];
        if (upgrade.upgradedItemId == id) {
          if (upgrade.minimumLevel > tree.currentUpgradeLevel && upgrade.minimumLevel <= this._levelComponent.level) {
            tree.currentUpgradeLevel = upgrade.minimumLevel;
            // Upgraded!
            console.log('Item upgraded');

            this._points[tree.pointsId] -= 1;
            this._totalPoints--;

            if (this._totalPoints > 0) {
              // Send upgrade here TODO only one per update pls
              (<GameClient>this.entity.owner.getUserData()).queuedMessages.push(this.serialize());
            }
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
        for (let j = 0; j < tree.upgrades.length; j++) {
          const upgrade = tree.upgrades[j];
          // Can upgrade to this item?
          if (upgrade.minimumLevel > tree.currentUpgradeLevel && upgrade.minimumLevel <= this._levelComponent.level) {
            upgradable.push(upgrade);
          }
        }
      }
    }

    buf.writeUInt8(upgradable.length, 1);

    const newBuf = Buffer.allocUnsafe(upgradable.length * 2);
    let index = 0;

    for (let i = 0; i < upgradable.length; i++) {
      newBuf.writeUInt16LE(upgradable[i].upgradedItemId, index);
      index += 2;
    }

    return Buffer.concat([buf, newBuf]);
  }
}
