import { Client } from 'elsa';
import { Position } from './position';
import { GameClient } from '../game-client';
import { Item, ItemState } from './items/item';
import { Observable } from './observable';

export class ObservableItem extends Observable {
  public init(): void {
    this._itemComponent = <Item>this.entity.getComponent(Item);
  }

  public onCheckObserver(client: Client): boolean {
    return this.entity.owner != null && this.entity.owner.id == client.id
      ? true
      : this.checkPosition(<GameClient>client.getUserData());
  }

  private checkPosition(client: GameClient) {
    // Don't be visible to players with no objects
    if (client.cameraFollowing == null) return false;

    // Get client sync component
    const clientSyncComponent = <Position>client.cameraFollowing.getComponent(Position);

    // Don't be visible to players with no position, if such thing is possible
    if (clientSyncComponent == null) return false;

    // Do a distance check with my parent entity if I'm an equipped item
    if (this._itemComponent.state == ItemState.EQUIPPED) {
      const parentPosition = <Position>this._itemComponent.parent.getComponent(Position);
      if (parentPosition != null) {
        return this.checkDistance(parentPosition.position, clientSyncComponent.position);
      }
    }

    // We can't be observed if I'm not equipped or parent has no position
    return false;
  }
}
