import { System } from './system';
import { performance } from 'perf_hooks';
import { getBytes, Protocol } from '../protocol';
import GameRoom from '../game-room';
import { Entity } from '../entity';
import { Observable } from '../components/observable';
import { Client } from 'elsa';
import { ClientData } from '../client-data';
import { Component } from '../components/component';

export class Visibility extends System {
  private room: GameRoom;
  private entities: Entity[] = [];

  private sendRate = 1 / 15;
  private observerUpdateTick = 0;
  private sendTick = 0;
  private _f = 0;

  public constructor(room: GameRoom) {
    super();
    this.room = room;
  }

  public register(component: Component): void {
    this.entities.push(component.entity);
  }

  public unregister(component: Component): void {
    this.entities.splice(this.entities.indexOf(component.entity), 1);
  }

  public tick(deltaTime: number): void {
    const now = performance.now();
    // Ticks
    this._f++;
    this.observerUpdateTick += deltaTime;
    this.sendTick += deltaTime;
    const isObserverUpdate = this.observerUpdateTick >= 0.1;
    const shouldSend = this.sendTick >= this.sendRate;
    if (!shouldSend) return;
    this.sendTick = 0;

    // Send positions and update observers if necessary
    for (let i = 0; i < this.room.clients.length; i++) {
      const client = this.room.clients[i];
      const clientData = client.getUserData();
      if (clientData == undefined) continue;

      if (isObserverUpdate || clientData.observing == null) {
        // Only send update for existing entities when we already had a observer
        // update because observer updates send add/remove packets
        const existing = this.updateObserverCache(client).filter((e) => {
          if (e._isDirty) {
            e._isDirty = false;
            return e;
          }
        });
        if (existing.length > 0)
          client.send(getBytes[Protocol.EntityUpdate](client, existing, now - this.room.startTime));
      } else {
        // Send update for dirty entities if there are any
        const dirty = clientData.observing.filter((e) => {
          if (e._isDirty) {
            e._isDirty = false;
            return e;
          }
        });
        if (dirty.length > 0) client.send(getBytes[Protocol.EntityUpdate](client, dirty, now - this.room.startTime));
      }
    }
    if (isObserverUpdate) this.observerUpdateTick = 0;
  }

  public updateObserverCache(client: Client): Entity[] {
    const clientData = <ClientData>client.getUserData();
    const newEntities = [];
    const existingEntities = [];
    const cache = clientData.observing || [];
    clientData.observing = this.entities.filter((e) => {
      const observable = <Observable>e.getComponent(Observable);

      // Check observer
      if (observable.onCheckObserver(client)) {
        if (!cache.includes(e)) {
          newEntities.push(e);
        } else existingEntities.push(e);
        return true;
      }
      // Client can't see this entity.
      return false;
    });

    // Add new entities
    if (newEntities.length > 0)
      client.send(getBytes[Protocol.Entities](client, newEntities, performance.now() - this.room.startTime));

    // Destroy out-of-view entities
    const noLongerObserving = cache.filter((e) => {
      return !clientData.observing.includes(e);
    });
    // Send remove packet
    if (noLongerObserving.length > 0) client.send(getBytes[Protocol.RemoveEntities](noLongerObserving));

    // Return existing entities
    return existingEntities;
  }
}
