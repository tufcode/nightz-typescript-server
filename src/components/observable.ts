import { Client } from 'elsa';
import { Component } from './component';
import { Position } from './position';
import { GameClient } from '../game-client';
import { Item, ItemState } from './items/item';
import { Vec2 } from 'planck-js';
import GameRoom from '../game-room';
import { VisibilitySystem } from '../systems/visibility-system';

export class Observable extends Component {
  private _syncComponent: Position;
  protected _itemComponent: Item;

  public init(): void {
    this._syncComponent = <Position>this.entity.getComponent(Position);
    this._itemComponent = <Item>this.entity.getComponent(Item);
  }

  public onCheckObserver(gameClient: GameClient): boolean {
    if (this.entity.owner != null) {
      if (this.entity.owner.client.id == gameClient.client.id) return true;
    } else {
      // Don't be visible to players with no objects
      if (gameClient.cameraFollowing == null) return false;

      // Get client sync component
      const clientSyncComponent = <Position>gameClient.cameraFollowing.getComponent(Position);
      // Don't be visible to players with no position, if such thing is possible
      if (clientSyncComponent == null) return false;

      // Do a distance check if I have sync component
      if (this._syncComponent != null)
        return this.checkDistance(this._syncComponent.position, clientSyncComponent.position);

      // Do a distance check with my parent entity if I'm an item TODO improve this
      if (this._itemComponent != null && this._itemComponent.parent != null) {
        const parentPosition = <Position>this._itemComponent.parent.getComponent(Position);
        if (parentPosition != null) {
          return this.checkDistance(parentPosition.position, clientSyncComponent.position);
        }
      }

      // We can't be observed if I don't have sync component.
      return false;
    }

    // Don't be visible to players with no objects
    if (gameClient.cameraFollowing == null) return false;

    // Get client sync component
    const clientSyncComponent = <Position>gameClient.cameraFollowing.getComponent(Position);
    // Don't be visible to players with no position, if such thing is possible
    if (clientSyncComponent == null) return false;

    // Do a distance check if I have sync component
    if (this._syncComponent != null)
      return this.checkDistance(this._syncComponent.position, clientSyncComponent.position);

    // I can't verify anything if my owner has no controlling entity. I'm invisible.
    if (this.entity.owner.cameraFollowing == null) return false;

    return false; // I don't know how to be visible!
  }

  protected checkDistance(position: Vec2, position2: Vec2): boolean {
    return Vec2.distance(position, position2) < 20.0;
  }
}
