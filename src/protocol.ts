import { Client } from 'elsa';
import { Entity } from './entity';
import { ClientData } from './game-client';
import GameRoom from './game-room';
import { Equipped } from './components/equipped';

export enum Protocol {
  Entities = 0,
  EntityUpdate = 1,
  RemoveEntities = 2,

  PlayerData = 10,
  Leaderboard = 11,

  // Player-related (50-99)
  SetPlayerEntity = 50,
  TemporaryMessage = 70,
}

export enum ClientProtocol {
  InputAngle = 0,
  InputPrimary = 1,
  InputUseItem = 6,
  InputCancel = 7,
}

export enum ComponentIds {
  NameTag = 0,
  PhysicsBody = 1,
  PositionAndRotation = 2,
  Equipped = 3,
  Inventory = 4,
  BuildingBlock,
}
export enum EntityCategory {
  BOUNDARY = 0x0001,
  PLAYER = 0x0002,
  STRUCTURE = 0x0004,
  BULLET = 0x0008,
  NPC = 0x0010,
}

export const getBytes = {
  [Protocol.Entities]: (client: Client, entities: Entity[]) => {
    let buf = Buffer.allocUnsafe(3);

    buf.writeUInt8(Protocol.Entities, 0);
    buf.writeUInt16LE(entities.length, 1);

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
    let buf = Buffer.allocUnsafe(7);
    buf.writeUInt8(Protocol.EntityUpdate, 0);
    buf.writeUInt16LE(entities.length, 1);
    buf.writeUInt32LE(time, 3);
    for (let i = 0; i < entities.length; i++) {
      const entity = entities[i];
      const serialized = entity.serialize(client);
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
      buf = Buffer.concat([buf, entityBuf, ...serialized], buf.length + entityBuf.length + serializedByteLength);
    }
    return buf;
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
  [Protocol.SetPlayerEntity]: (id: number) => {
    const buf = Buffer.allocUnsafe(1 + 4);

    buf.writeUInt8(Protocol.SetPlayerEntity, 0);
    buf.writeUInt32LE(id, 1);

    return buf;
  },
  [Protocol.TemporaryMessage]: (m: string, duration: number) => {
    const buf = Buffer.allocUnsafe(4 + 2 * m.length);
    let index = 0;
    buf.writeUInt8(Protocol.TemporaryMessage, index);
    index += 1;
    buf.writeUInt8(duration, index);
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
