import { System } from './system';
import { performance } from 'perf_hooks';
import { getBytes, Protocol } from '../protocol';
import GameRoom from '../game-room';
import { Entity } from '../entity';
import { Observable } from '../components/observable';
import { Client } from 'elsa';
import { GameClient } from '../game-client';
import { Component } from '../components/component';
import { Level } from '../components/level';
import { AI } from '../components/ai';

export class LevelSystem extends System {
  private room: GameRoom;

  public constructor(room: GameRoom) {
    super();
    this.room = room;
  }

  public tick(deltaTime: number): void {
    const components = <Level[]>this.room.getComponentsOfType(Level.name);
    for (let i = 0; i < components.length; i++) {
      const c = components[i];
      if (c.isDirty) {
        c.entity.isDirty = true;
        c.entity.componentBuffers[LevelSystem.name] = { t: this.room.currentTick, buffer: c.serialize() };
      }
    }
  }
}
