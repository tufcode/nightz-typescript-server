import { Client } from 'elsa';
import { Entity } from './entity';
import { Component } from './components/component';
import { ITier } from './client-data';
import { Vec2 } from 'planck-js';

export enum Protocol {
  Entities = 0,
  EntityUpdate = 1,
  RemoveEntities = 2,
  AddComponent = 3,
  RemoveComponent = 4,

  WorldSize = 10,
  Leaderboard = 11,

  // Player-related (50-99)
  SetPlayerEntity = 50,
  TierInfo = 60,
  GoldInfo = 61,
  LevelInfo = 62,
  TemporaryMessage = 70,
}

export enum ClientProtocol {
  InputAngle = 0,
  InputPrimary = 1,
  SelectItem = 2,
}

export enum ComponentIds {
  NameTag = 0,
  PositionAndRotation = 1,
  InventoryActiveOnly = 2,
  InventoryFull = 3,
  Gold = 4,
  Health = 5,
  Scale = 6,
  Animation = 7,
  Tier = 8,
  Experience = 9,
  Level = 10,
  Rotation = 11,
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
      const serialized = entity.serialize(client, true);
      const entityBuf = Buffer.allocUnsafe(7 + entity.id.length * 2);

      let index = 0;
      // Object id
      entityBuf.writeUInt32LE(entity.objectId, index);
      index += 4;
      // Entity id
      entityBuf.writeUInt16LE(entity.id.length, index);
      index += 2;
      for (let j = 0; j < entity.id.length; j++) {
        entityBuf.writeUInt16LE(entity.id.charCodeAt(j), index);
        index += 2;
      }
      // Serialized component count
      entityBuf.writeUInt8(serialized.length, index);
      index += 1;

      // Merge buffers
      let serializedByteLength = 0;
      for (let j = 0; j < serialized.length; j++) {
        serializedByteLength += serialized[j].length;
      }
      buf = Buffer.concat([buf, entityBuf, ...serialized], buf.length + entityBuf.length + serializedByteLength);
    }

    return buf;
  },
  [Protocol.EntityUpdate]: (client: Client, entities: Entity[], time: number) => {
    const buffers = [];
    let totalLength = 7;
    let totalEntities = 0;
    for (let i = 0; i < entities.length; i++) {
      const entity = entities[i];
      const serialized = entity.serialize(client);

      // Check if this entity actually had any updates to save some traffic
      if (serialized.length == 0) continue;

      const entityBuf = Buffer.allocUnsafe(5);
      let index = 0;
      // Object id
      entityBuf.writeUInt32LE(entity.objectId, index);
      index += 4;
      // Serialized component count
      entityBuf.writeUInt8(serialized.length, index);
      index += 1;
      // Merge buffers
      let serializedByteLength = 0;
      for (let j = 0; j < serialized.length; j++) {
        serializedByteLength += serialized[j].length;
      }
      totalLength += entityBuf.length + serializedByteLength;
      totalEntities++;

      buffers.push(entityBuf, ...serialized);
    }
    // Check if this patch actually had any updates to save some more traffic
    if (totalEntities == 0) return null;

    const buf = Buffer.allocUnsafe(7);
    buf.writeUInt8(Protocol.EntityUpdate, 0);
    buf.writeUInt16LE(totalEntities, 1);
    buf.writeUInt32LE(time, 3);

    return Buffer.concat([buf, ...buffers], totalLength);
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

    const serialized = component.serialize(client, true);
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
  [Protocol.SetPlayerEntity]: (id: number) => {
    const buf = Buffer.allocUnsafe(1 + 4);

    buf.writeUInt8(Protocol.SetPlayerEntity, 0);
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
