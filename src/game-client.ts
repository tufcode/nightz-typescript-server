import { Client } from 'elsa';
import { Entity } from './entity';

import { getBytes, Protocol } from './protocol';
import { Tiers } from './data/tiers';

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
  public cameraFollowing: Entity;
  public observing: Entity[] = null;
  public tier: ITier = Tiers.Wood;
  public input: InputState = { down: false, left: false, right: false, up: false, angle: 0, primary: false };
  public ownedEntities: Entity[] = [];

  public queuedMessages: Buffer[] = [];

  public constructor(client: Client) {
    this.client = client;
  }

  public setTier(tier: ITier): void {
    this.tier = tier;
    this.client.send(getBytes[Protocol.TierInfo](this.tier));
  }

  public addOwnedEntity(entity: Entity): void {
    this.ownedEntities.push(entity);
  }
}
