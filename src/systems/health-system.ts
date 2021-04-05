import { System } from './system';
import { performance } from 'perf_hooks';
import { getBytes, Protocol } from '../protocol';
import GameRoom from '../game-room';
import { Entity } from '../entity';
import { Observable } from '../components/observable';
import { Client } from 'elsa';
import { ClientData } from '../client-data';
import { Component } from '../components/component';
import { Level } from '../components/level';
import { Movement } from '../components/movement';
import { Vec2 } from 'planck-js';
import { AI } from '../components/ai';
import { Health } from '../components/health';

export class HealthSystem extends System {
  private room: GameRoom;

  public constructor(room: GameRoom) {
    super();
    this.room = room;
  }

  public tick(deltaTime: number): void {
    const components = <Health[]>this.room.getComponentsOfType(Health.name);
    for (let i = 0; i < components.length; i++) {
      const c = components[i];

      if (c.currentHealth == 0) {
        if (c.isUnkillable) {
          c.currentHealth = c.maxHealth;
        } else {
          c.entity.destroy();
          continue;
        }
      }

      if (c.isDirty) {
        c.entity.isDirty = true;
        c.entity.componentBuffers[HealthSystem.name] = { t: this.room.currentTick, buffer: c.serialize() };
      }
    }
  }
}
