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
import { NameTag } from '../components/name-tag';
import { PhysicsBody } from '../components/physics-body';
import { Position } from '../components/position';
import { Rotation } from '../components/rotation';
import { Tier } from '../components/tier';
import { Equipment } from '../components/equipment';
import { PlayerInput } from '../components/player-input';
import { Construction } from '../components/construction';
import { Item } from '../components/items/item';
import { Animation } from '../components/animation';
import { Spike } from '../components/spike';
import { ChatMessage } from '../components/chat-message';
import { Minimap } from '../components/minimap';
import { Zone } from '../components/zone';

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

    // Items
    const componentsI = <Item[]>this.room.getComponentsOfType(Item.name);
    for (let i = 0; i < componentsI.length; i++) {
      const c = componentsI[i];
      c.update(deltaTime);
    }

    // Spikes
    const componentsS = <Spike[]>this.room.getComponentsOfType(Spike.name);
    for (let i = 0; i < componentsS.length; i++) {
      const c = componentsS[i];
      c.update(deltaTime);
    }

    // Animations
    const componentsA = <Animation[]>this.room.getComponentsOfType(Animation.name);
    for (let i = 0; i < componentsA.length; i++) {
      const c = componentsA[i];
      if (c.isDirty) {
        c.entity.isDirty = true;
        c.entity.componentBuffers[Animation.name] = { t: this.room.currentTick, buffer: c.serialize() };
      }
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

    // Chat Message
    const componentsCM = <ChatMessage[]>this.room.getComponentsOfType(ChatMessage.name);
    for (let i = 0; i < componentsCM.length; i++) {
      const c = componentsCM[i];
      c.update(deltaTime);
      if (c.isDirty) {
        c.entity.isDirty = true;
        c.entity.componentBuffers[ChatMessage.name] = { t: this.room.currentTick, buffer: c.serialize() };
      }
    }
    // Minimap
    const componentsMM = <Minimap[]>this.room.getComponentsOfType(Minimap.name);
    for (let i = 0; i < componentsMM.length; i++) {
      const c = componentsMM[i];
      if (c.isDirty) {
        c.entity.isDirty = true;
        c.entity.componentBuffers[Minimap.name] = { t: this.room.currentTick, buffer: c.serialize() };
      }
    }
    // Zone
    const componentsZ = <Zone[]>this.room.getComponentsOfType(Zone.name);
    for (let i = 0; i < componentsZ.length; i++) {
      const c = componentsZ[i];
      if (c.isDirty) {
        c.entity.isDirty = true;
        c.entity.componentBuffers[Zone.name] = { t: this.room.currentTick, buffer: c.serialize() };
      }
    }

    // Construction
    const componentsC = <Construction[]>this.room.getComponentsOfType(Construction.name);
    for (let i = 0; i < componentsC.length; i++) {
      const c = componentsC[i];
      c.update(deltaTime);
      if (c.isDirty) {
        c.entity.isDirty = true;
        c.entity.componentBuffers[Construction.name] = { t: this.room.currentTick, buffer: c.serialize() };
      }
    }
  }
}
