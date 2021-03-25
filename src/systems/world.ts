import { System } from './system';
import { Body, BodyDef, Box, Vec2, WorldDef } from 'planck-js';
import * as planck from 'planck-js';
import { Entity } from '../entity';
import { EntityCategory, getBytes, Protocol } from '../protocol';
import { Room } from 'elsa';
import * as debugModule from 'debug';
import { performance } from 'perf_hooks';
import { AIController } from '../components/ai-controller';
const debug = debugModule('Physics');

import { World as pWorld } from './physics2/world';

// eslint-disable-next-line no-var
const filterStrength = 20;

let frameTime;
let lastLoop;
let thisLoop;
frameTime = 0;
lastLoop = performance.now();

export class World extends System {
  public entities: Entity[] = [];

  private readonly _world: pWorld;
  private lastEntityId = 1;
  private bounds: Body;
  private simulation: { timeStep: number; velocityIterations: number; positionIterations: number };
  public room: Room;

  public constructor(
    room: Room,
    physicsOptions: WorldDef | Vec2,
    simulation: {
      timeStep: number;
      velocityIterations: number;
      positionIterations: number;
    },
  ) {
    super();
    this.room = room;
    this.simulation = simulation;
    this._world = new pWorld();
  }

  public update(deltaTime: number) {
    // Update entities
    for (let i = 0; i < this.entities.length; i++) {
      this.entities[i].update(deltaTime);
    }
  }

  public updateBounds(size: number[]) {}

  public getPhysicsWorld() {
    return this._world;
  }

  public addEntity(entity: Entity) {
    this.entities.push(entity);
  }

  public removeEntity(entity: Entity) {
    this.entities.splice(this.entities.indexOf(entity), 1);
    this.room.broadcast(getBytes[Protocol.RemoveEntities]([entity]));
  }

  public getEntityId() {
    return this.lastEntityId++;
  }

  public step(deltaTime: number) {
    this._world.update(deltaTime);
    const thisFrameTime = (thisLoop = performance.now()) - lastLoop;
    frameTime += (thisFrameTime - frameTime) / filterStrength;
    lastLoop = thisLoop;

    // broken console.log('TPS', (1000 / frameTime).toFixed(2));
  }
}

const fps = {
  startTime: 0,
  frameNumber: 0,
  getFPS: function () {
    this.frameNumber++;
    const d = performance.now(),
      currentTime = (d - this.startTime) / 1000,
      result = (this.frameNumber / currentTime).toFixed(2);
    if (currentTime > 1) {
      this.startTime = performance.now();
      this.frameNumber = 0;
    }
    return result;
  },
};
