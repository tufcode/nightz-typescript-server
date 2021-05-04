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
import { Item } from '../items/item';
import { Animation } from '../components/animation';
import { DamageOnTouch } from '../components/damage-on-touch';
import { ChatMessage } from '../components/chat-message';
import { Minimap } from '../components/minimap';
import { Zone } from '../components/zone';
import { Miner } from '../components/miner';
import { SpeedBoost } from '../components/speed-boost';
import { Turret } from '../components/turret';
import { Projectile } from '../components/projectile';
import { Shield } from '../items/shield';
import { DecayOnOwnerLeave } from '../components/decay-on-owner-leave';

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

    // Spikes
    const componentsS = <DamageOnTouch[]>this.room.getComponentsOfType(DamageOnTouch.name);
    for (let i = 0; i < componentsS.length; i++) {
      const c = componentsS[i];
      c.update(deltaTime);
    }

    // Spikes
    const componentsTu = <Turret[]>this.room.getComponentsOfType(Turret.name);
    for (let i = 0; i < componentsTu.length; i++) {
      const c = componentsTu[i];
      c.update(deltaTime);
    }

    // Spikes
    const componentsPr = <Projectile[]>this.room.getComponentsOfType(Projectile.name);
    for (let i = 0; i < componentsPr.length; i++) {
      const c = componentsPr[i];
      c.update(deltaTime);
    }

    // Decay
    const componentsDe = <DecayOnOwnerLeave[]>this.room.getComponentsOfType(DecayOnOwnerLeave.name);
    for (let i = 0; i < componentsDe.length; i++) {
      const c = componentsDe[i];
      c.update(deltaTime);
    }

    // Animations
    const componentsA = <Animation[]>this.room.getComponentsOfType(Animation.name);
    for (let i = 0; i < componentsA.length; i++) {
      const c = componentsA[i];
      if (c.isDirty) {
        c.entity.dirtyTick = this.room.currentTick;
        c.entity.componentBuffers[Animation.name] = { t: this.room.currentTick, buffer: c.serialize() };
      }
    }

    // NameTag
    const componentsNT = <NameTag[]>this.room.getComponentsOfType(NameTag.name);
    for (let i = 0; i < componentsNT.length; i++) {
      const c = componentsNT[i];
      if (c.isDirty) {
        c.entity.dirtyTick = this.room.currentTick;
        c.entity.componentBuffers[NameTag.name] = { t: this.room.currentTick, buffer: c.serialize() };
      }
    }

    // PhysicsBody
    const componentsPB = <PhysicsBody[]>this.room.getComponentsOfType(PhysicsBody.name);
    for (let i = 0; i < componentsPB.length; i++) {
      const c = componentsPB[i];
      c.update(deltaTime);
    }

    // Miner
    const componentsM = <Miner[]>this.room.getComponentsOfType(Miner.name);
    for (let i = 0; i < componentsM.length; i++) {
      const c = componentsM[i];
      c.update(deltaTime);
    }

    // Position
    const componentsP = <Position[]>this.room.getComponentsOfType(Position.name);
    for (let i = 0; i < componentsP.length; i++) {
      const c = componentsP[i];
      if (c.isDirty) {
        c.entity.dirtyTick = this.room.currentTick;
        c.entity.componentBuffers[Position.name] = { t: this.room.currentTick, buffer: c.serialize() };
      }
    }

    // Rotation
    const componentsR = <Rotation[]>this.room.getComponentsOfType(Rotation.name);
    for (let i = 0; i < componentsR.length; i++) {
      const c = componentsR[i];
      if (c.isDirty) {
        c.entity.dirtyTick = this.room.currentTick;
        c.entity.componentBuffers[Rotation.name] = { t: this.room.currentTick, buffer: c.serialize() };
      }
    }

    // Tier
    const componentsT = <Tier[]>this.room.getComponentsOfType(Tier.name);
    for (let i = 0; i < componentsT.length; i++) {
      const c = componentsT[i];
      if (c.isDirty) {
        c.entity.dirtyTick = this.room.currentTick;
        c.entity.componentBuffers[Tier.name] = { t: this.room.currentTick, buffer: c.serialize() };
      }
    }

    // Equipment
    const componentsE = <Equipment[]>this.room.getComponentsOfType(Equipment.name);
    for (let i = 0; i < componentsE.length; i++) {
      const c = componentsE[i];
      c.update(deltaTime);
      if (c.isDirty) {
        c.entity.dirtyTick = this.room.currentTick;
        c.entity.componentBuffers[Equipment.name] = { t: this.room.currentTick, buffer: c.serialize() };
      }
    }

    // Speed Boost
    const componentsSB = <SpeedBoost[]>this.room.getComponentsOfType(SpeedBoost.name);
    for (let i = 0; i < componentsSB.length; i++) {
      const c = componentsSB[i];
      c.update(deltaTime);
    }

    // Minimap
    const componentsMM = <Minimap[]>this.room.getComponentsOfType(Minimap.name);
    for (let i = 0; i < componentsMM.length; i++) {
      const c = componentsMM[i];
      if (c.isDirty) {
        c.entity.dirtyTick = this.room.currentTick;
        c.entity.componentBuffers[Minimap.name] = { t: this.room.currentTick, buffer: c.serialize() };
      }
    }
    // Zone
    const componentsZ = <Zone[]>this.room.getComponentsOfType(Zone.name);
    for (let i = 0; i < componentsZ.length; i++) {
      const c = componentsZ[i];
      if (c.isDirty) {
        c.entity.dirtyTick = this.room.currentTick;
        c.entity.componentBuffers[Zone.name] = { t: this.room.currentTick, buffer: c.serialize() };
      }
    }

    // Construction
    const componentsC = <Construction[]>this.room.getComponentsOfType(Construction.name);
    for (let i = 0; i < componentsC.length; i++) {
      const c = componentsC[i];
      c.update(deltaTime);
      if (c.isDirty) {
        c.entity.dirtyTick = this.room.currentTick;
        c.entity.componentBuffers[Construction.name] = { t: this.room.currentTick, buffer: c.serialize() };
      }
    }
  }
}
