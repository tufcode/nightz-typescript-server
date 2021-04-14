import { Client } from 'elsa';
import { Entity } from './entity';
import { Component } from './components/component';
import { ITier } from './game-client';
import { Vec2 } from 'planck-js';
import { LeaderboardEntry } from './components/leaderboard-entry';

export enum Protocol {
  Entities = 0,
  EntityUpdate = 1,
  RemoveEntities = 2,
  AddComponent = 3,
  RemoveComponent = 4,

  WorldSize = 10,
  Leaderboard = 11,

  // Player-related (50-99)
  CameraFollow = 50,
  TierInfo = 60,
  GoldInfo = 61,
  Experience = 62,
  Inventory = 63,
  FoodInfo = 64,
  Upgrade = 65,
  TemporaryMessage = 70,
}

export enum ClientProtocol {
  InputAngle = 0,
  InputPrimary = 1,
  SelectItem = 2,
  SelectUpgrade = 3,
  ChatMessage = 4,
}

export enum ComponentIds {
  NameTag = 0,
  PositionAndRotation = 1,
  Health = 2,
  Tier = 3,
  Experience = 4,
  Level = 5,
  Rotation = 6,
  Equipment = 7,
  Animation = 8,
  Construction = 9,
  ChatMessage = 10,
  Minimap = 11,
  Zone = 12,
}
export enum EntityCategory {
  BOUNDARY = 0x0001,
  STRUCTURE = 0x0002,
  RESOURCE = 0x0004,
  PLAYER = 0x0008,
  NPC = 0x0016,
  BULLET = 0x0032,
  MELEE = 0x0064,
  SENSOR = 0x0128,
}

export const getBytes = {
  [Protocol.Entities]: (client: Client, entities: Entity[], time: number) => {
    let buf = Buffer.allocUnsafe(7);

    buf.writeUInt8(Protocol.Entities, 0);
    buf.writeUInt16LE(entities.length, 1);
    buf.writeUInt32LE(time, 3);

    for (let i = 0; i < entities.length; i++) {
      const entity = entities[i];
      const entityBuf = Buffer.allocUnsafe(7);
      const componentBufferKeys = Object.keys(entity.componentBuffers);

      let index = 0;
      // Object id
      entityBuf.writeUInt32LE(entity.objectId, index);
      index += 4;
      // Entity id
      entityBuf.writeUInt16LE(entity.id, index);
      index += 2;
      // Serialized component count
      entityBuf.writeUInt8(componentBufferKeys.length, index);
      index += 1;

      // Merge buffers
      const buffers = [];
      let serializedByteLength = 0;
      for (let j = 0; j < componentBufferKeys.length; j++) {
        const b = entity.componentBuffers[componentBufferKeys[j]].buffer;
        buffers.push(b);
        serializedByteLength += b.length;
      }

      buf = Buffer.concat([buf, entityBuf, ...buffers], buf.length + entityBuf.length + serializedByteLength);
    }

    return buf;
  },
  [Protocol.EntityUpdate]: (client: Client, entities: Entity[], time: number, ticks: number) => {
    const finalBuffers = [];
    let totalLength = 7;
    let totalEntities = 0;
    for (let i = 0; i < entities.length; i++) {
      const entity = entities[i];
      const componentBufferKeys = Object.keys(entity.componentBuffers);

      const buffers = [];
      let serializedByteLength = 0;
      for (let j = 0; j < componentBufferKeys.length; j++) {
        const cb = entity.componentBuffers[componentBufferKeys[j]];
        if (cb.t < ticks) continue;

        buffers.push(cb.buffer);
        serializedByteLength += cb.buffer.length;
      }

      // Check if this entity actually had any updates to save some traffic
      if (buffers.length == 0) continue;

      const entityBuf = Buffer.allocUnsafe(5);
      let index = 0;
      // Object id
      entityBuf.writeUInt32LE(entity.objectId, index);
      index += 4;
      // Serialized component count
      entityBuf.writeUInt8(buffers.length, index);
      index += 1;
      // Merge buffers
      totalLength += entityBuf.length + serializedByteLength;
      totalEntities++;

      finalBuffers.push(entityBuf, ...buffers);
    }
    // Check if this patch actually had any updates to save some more traffic
    if (totalEntities == 0) return null;

    const buf = Buffer.allocUnsafe(7);
    buf.writeUInt8(Protocol.EntityUpdate, 0);
    buf.writeUInt16LE(totalEntities, 1);
    buf.writeUInt32LE(time, 3);

    return Buffer.concat([buf, ...finalBuffers], totalLength);
  },
  [Protocol.RemoveEntities]: (entities: Entity[]) => {
    const buf = Buffer.allocUnsafe(3 + 4 * entities.length);
    let index = 0;
    buf.writeUInt8(Protocol.RemoveEntities, index);
    index += 1;
    buf.writeUInt16LE(entities.length, index);
    index += 2;
    for (let i = 0; i < entities.length; i++) {
      // Object id
      buf.writeUInt32LE(entities[i].objectId, index);
      index += 4;
    }
    return buf;
  },
  [Protocol.AddComponent]: (client: Client, component: Component, entity: Entity) => {
    let buf = Buffer.allocUnsafe(5);
    buf.writeUInt8(Protocol.AddComponent, 0);

    const serialized = component.serialize();
    // Object id
    buf.writeUInt32LE(entity.objectId, 1);

    // Merge buffers
    buf = Buffer.concat([buf, serialized], buf.length + serialized.length);

    return buf;
  },
  [Protocol.RemoveComponent]: (component: ComponentIds, entity: Entity) => {
    const buf = Buffer.allocUnsafe(6);
    buf.writeUInt8(Protocol.RemoveComponent, 0);

    // Object id
    buf.writeUInt32LE(entity.objectId, 1);
    // Component id
    buf.writeUInt8(component, 5);

    return buf;
  },
  [Protocol.WorldSize]: (size: Vec2) => {
    const buf = Buffer.allocUnsafe(9);

    buf.writeUInt8(Protocol.WorldSize, 0);
    buf.writeFloatLE(size.x, 1);
    buf.writeFloatLE(size.y, 5);

    return buf;
  },
  [Protocol.Leaderboard]: (lb: LeaderboardEntry[]) => {
    let totalNameLen = 2;
    for (let i = 0; i < lb.length; i++) {
      totalNameLen += lb[i].getName().length * 2;
    }
    const buf = Buffer.allocUnsafe(2 + totalNameLen + (4 + 4) * lb.length);

    let index = 0;
    buf.writeUInt8(Protocol.Leaderboard, index);
    index += 1;
    buf.writeUInt8(lb.length, index);
    index += 1;
    for (let i = 0; i < lb.length; i++) {
      const entry = lb[i];
      const name = entry.getName();
      buf.writeUInt32LE(entry.getId(), index);
      index += 4;
      buf.writeUInt32LE(entry.getPoints(), index);
      index += 4;
      buf.writeUInt16LE(name.length, index);
      index += 2;
      for (let j = 0; j < name.length; j++) {
        buf.writeUInt16LE(name.charCodeAt(j), index);
        index += 2;
      }
    }

    return buf;
  },
  [Protocol.CameraFollow]: (id: number) => {
    const buf = Buffer.allocUnsafe(1 + 4);

    buf.writeUInt8(Protocol.CameraFollow, 0);
    buf.writeUInt32LE(id, 1);

    return buf;
  },
  [Protocol.TierInfo]: (tier: ITier) => {
    const buf = Buffer.allocUnsafe(1 + 1 + 4);

    buf.writeUInt8(Protocol.TierInfo, 0);
    buf.writeUInt8(tier.id, 1);
    buf.writeUInt32LE(tier.upgradeCost, 2);

    return buf;
  },
  [Protocol.GoldInfo]: (gold: number) => {
    const buf = Buffer.allocUnsafe(1 + 4);

    buf.writeUInt8(Protocol.GoldInfo, 0);
    buf.writeUInt32LE(gold, 1);

    return buf;
  },
  [Protocol.Experience]: (level: number, points: number, neededPoints: number) => {
    const buf = Buffer.allocUnsafe(10);

    buf.writeUInt8(Protocol.Experience, 0);
    buf.writeUInt8(level, 1);
    buf.writeUInt32LE(points, 2);
    buf.writeUInt32LE(neededPoints, 6);

    return buf;
  },
  [Protocol.TemporaryMessage]: (m: string, duration: number) => {
    const buf = Buffer.allocUnsafe(3 + 2 * m.length);
    let index = 0;
    buf.writeUInt8(Protocol.TemporaryMessage, index);
    index += 1;
    buf.writeUInt16LE(m.length, index);
    index += 2;
    for (let j = 0; j < m.length; j++) {
      buf.writeUInt16LE(m.charCodeAt(j), index);
      index += 2;
    }
    return buf;
  },
};
