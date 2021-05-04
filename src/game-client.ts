import { Client } from 'elsa';
import { Entity } from './entity';

import { getBytes, Protocol } from './protocol';
import { Tiers } from './data/tiers';
import { Health } from './components/health';

export interface ITier {
  id: number;
  upgradeCost: number;
}
export interface InputState {
  angle: number;
  primary: boolean;
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
}
export class GameClient {
  public client: Client;
  public controlling: Entity;
  public cameraFollowing: Entity;
  public observing: Entity[] = null;
  public tier: ITier = Tiers.Wood;
  public input: InputState = { down: false, left: false, right: false, up: false, angle: 0, primary: false };
  public ownedEntities: Entity[] = [];

  private _queuedMessages: [string, Buffer][] = [];
  public respawnRewardExp: number;
  public nickname = 'Player';

  public constructor(client: Client) {
    this.client = client;
  }

  public cameraFollow(target: Entity): void {
    this.cameraFollowing = target;
    this.queueMessage('follow', getBytes[Protocol.CameraFollow](target.objectId));

    const health = <Health>target.getComponent(Health);
    if (health != null) {
      health.on('damage', (amount: number, source: Entity) => {
        if (health.isDead) {
          this.cameraFollowing = null;
          // Follow killer
          if (source == null) return;
          if (source.owner && source.owner.controlling) {
            this.cameraFollow(source.owner.controlling);
          } else {
            this.cameraFollow(source);
          }
        }
      });
    }
  }

  public queueMessage(id: string, buf: Buffer): void {
    const index = this._queuedMessages.findIndex((x) => x[0] == id);
    if (index != -1) {
      this._queuedMessages.splice(index, 1);
    }

    this._queuedMessages.push([id, buf]);
  }

  public takeMessageFromQueue(): Buffer {
    const m = this._queuedMessages.shift();
    if (m == undefined) return null; // todo unnecessary

    return m[1];
  }

  public setTier(tier: ITier): void {
    this.tier = tier;
    this.client.send(getBytes[Protocol.TierInfo](this.tier));
  }

  public addOwnedEntity(entity: Entity): void {
    this.ownedEntities.push(entity);
  }
}
