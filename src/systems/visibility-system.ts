import { System } from './system';
import { performance } from 'perf_hooks';
import { getBytes, Protocol } from '../protocol';
import GameRoom from '../game-room';
import { Entity } from '../entity';
import { Observable } from '../components/observable';
import { Client } from 'elsa';
import { GameClient } from '../game-client';
import { Component } from '../components/component';

export class VisibilitySystem extends System {
  private room: GameRoom;
  private observerUpdateTick = 0;

  public constructor(room: GameRoom) {
    super();
    this.room = room;
  }

  public tick(deltaTime: number): void {
    const components = <Observable[]>this.room.getComponentsOfType(Observable.name);
    // Ticks
    this.observerUpdateTick += deltaTime;
    if (this.observerUpdateTick >= 0.1) {
      // Update observers
      this.observerUpdateTick = 0;
      for (let i = 0; i < this.room.clients.length; i++) {
        const client = this.room.clients[i];

        this.updateObserverCache(client, components);
      }
    }
  }

  public updateObserverCache(client, components: Observable[]): Entity[] {
    const clientData = <GameClient>client.getUserData();
    if (!clientData) return;

    const newEntities = [];
    const existingEntities = [];
    const cache = clientData.observing || [];
    clientData.observing = components
      .map((observable) => {
        // Check observer
        if (observable.onCheckObserver(clientData)) {
          if (!cache.includes(observable.entity)) {
            newEntities.push(observable.entity);
          } else {
            existingEntities.push(observable.entity);
          }
          return observable.entity;
        }
      })
      .filter((e) => e != undefined);

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

  public forceUpdateNext(): void {
    this.observerUpdateTick = Number.MAX_VALUE;
  }
}
