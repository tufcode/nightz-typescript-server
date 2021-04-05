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
import { AI } from '../components/ai';
import { NameTag } from '../components/name-tag';
import { PhysicsBody } from '../components/physics-body';
import { Position } from '../components/position';
import { Rotation } from '../components/rotation';
import { Tier } from '../components/tier';
import { Equipment } from '../components/equipment';
import { PlayerInput } from '../components/player-input';
import { Construction } from '../components/construction';

export class SimpleSystems extends System {
  private room: GameRoom;

  public constructor(room: GameRoom) {
    super();
    this.room = room;
  }

  public tick(deltaTime: number): void {
    // Player Input
    const componentsPI = <PlayerInput[]>this.room.getComponentsOfType(PlayerInput.name);
    for (let i = 0; i < componentsPI.length; i++) {
      const c = componentsPI[i];
      c.update(deltaTime);
    }

    // NameTag
    const componentsNT = <NameTag[]>this.room.getComponentsOfType(NameTag.name);
    for (let i = 0; i < componentsNT.length; i++) {
      const c = componentsNT[i];
      if (c.isDirty) {
        c.entity.isDirty = true;
        c.entity.componentBuffers[NameTag.name] = { t: this.room.currentTick, buffer: c.serialize() };
      }
    }

    // PhysicsBody
    const componentsPB = <PhysicsBody[]>this.room.getComponentsOfType(PhysicsBody.name);
    for (let i = 0; i < componentsPB.length; i++) {
      const c = componentsPB[i];
      c.update(deltaTime);
    }

    // Position
    const componentsP = <Position[]>this.room.getComponentsOfType(Position.name);
    for (let i = 0; i < componentsP.length; i++) {
      const c = componentsP[i];
      if (c.isDirty) {
        c.entity.isDirty = true;
        c.entity.componentBuffers[Position.name] = { t: this.room.currentTick, buffer: c.serialize() };
      }
    }

    // Rotation
    const componentsR = <Rotation[]>this.room.getComponentsOfType(Rotation.name);
    for (let i = 0; i < componentsR.length; i++) {
      const c = componentsR[i];
      if (c.isDirty) {
        c.entity.isDirty = true;
        c.entity.componentBuffers[Rotation.name] = { t: this.room.currentTick, buffer: c.serialize() };
      }
    }

    // Tier
    const componentsT = <Tier[]>this.room.getComponentsOfType(Tier.name);
    for (let i = 0; i < componentsT.length; i++) {
      const c = componentsT[i];
      if (c.isDirty) {
        c.entity.isDirty = true;
        c.entity.componentBuffers[Tier.name] = { t: this.room.currentTick, buffer: c.serialize() };
      }
    }

    // Equipment
    const componentsE = <Equipment[]>this.room.getComponentsOfType(Equipment.name);
    for (let i = 0; i < componentsE.length; i++) {
      const c = componentsE[i];
      if (c.isDirty) {
        c.entity.isDirty = true;
        c.entity.componentBuffers[Equipment.name] = { t: this.room.currentTick, buffer: c.serialize() };
      }
    }

    // Construction
    const componentsC = <Construction[]>this.room.getComponentsOfType(Construction.name);
    for (let i = 0; i < componentsC.length; i++) {
      const c = componentsC[i];
      c.update(deltaTime);
    }
  }
}
