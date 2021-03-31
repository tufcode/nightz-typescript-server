import { Client } from 'elsa';
import { Component } from './component';
import { PositionAndRotation } from './position-and-rotation';
import { ClientData } from '../client-data';
import { Item, ItemState } from '../items/item';
import { Vec2 } from 'planck-js';

export class Observable extends Component {
  private _syncComponent: PositionAndRotation;

  public init(): void {
    this._syncComponent = <PositionAndRotation>this.entity.getComponent(PositionAndRotation);
  }

  public onCheckObserver(client: Client): boolean {
    if (this.entity.owner != null) {
      if (this.entity.owner.id == client.id) return true;
    } else {
      const clientOwner = <ClientData>client.getUserData();

      // Get client sync component
      const clientSyncComponent = <PositionAndRotation>clientOwner.controlling.entity.getComponent(PositionAndRotation);
      // Don't be visible to players with no position, if such thing is possible
      if (clientSyncComponent == null) return false;

      // Do a distance check if I have sync component
      if (this._syncComponent != null)
        return this.checkDistance(this._syncComponent.position, clientSyncComponent.position);

      // We can't be observed if I don't have sync component.
      return false;
    }

    const myOwner = <ClientData>this.entity.owner.getUserData();
    const clientOwner = <ClientData>client.getUserData();

    // Don't be visible to players with no objects
    if (clientOwner.controlling == null) return false;

    // Get client sync component
    const clientSyncComponent = <PositionAndRotation>clientOwner.controlling.entity.getComponent(PositionAndRotation);
    // Don't be visible to players with no position, if such thing is possible
    if (clientSyncComponent == null) return false;

    // Do a distance check if I have sync component
    if (this._syncComponent != null)
      return this.checkDistance(this._syncComponent.position, clientSyncComponent.position);

    // I can't verify anything if my owner has no controlling entity. I'm invisible.
    if (myOwner.controlling == null) return false;

    // I don't have a sync component. Check if I'm an item
    const item = <Item>this.entity.getComponent(Item);
    if (item != null) {
      // Do a distance check with my owner's entity if I'm equipped
      if (item.state == ItemState.EQUIPPED) {
        // Check if my owner's controlling entity has a sync component and return false if it doesn't
        const controllingEntitySync = <PositionAndRotation>myOwner.controlling.entity.getComponent(PositionAndRotation);
        if (controllingEntitySync == null) {
          return false;
        }
        // Do a distance check
        return this.checkDistance(controllingEntitySync.position, clientSyncComponent.position);
      } else return false; // I'm not equipped, no point showing.
    } else return false; // I'm not an item and I don't have a sync component, I don't know how to be visible!
  }

  private checkDistance(position: Vec2, position2: Vec2): boolean {
    return Vec2.distance(position, position2) < 20.0;
  }
}
