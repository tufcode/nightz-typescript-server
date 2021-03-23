import { System } from './system';
import { Body, BodyDef, Box, Vec2, WorldDef } from 'planck-js';
import * as planck from 'planck-js';
import { Entity } from '../entity';
import { EntityCategory, getBytes, Protocol } from '../protocol';
import { Room } from 'elsa';
import * as debugModule from 'debug';
import { performance } from 'perf_hooks';
const debug = debugModule('Physics');

// eslint-disable-next-line no-var
const filterStrength = 20;

let frameTime;
let lastLoop;
let thisLoop;
frameTime = 0;
lastLoop = performance.now();

export class World extends System {
  public entities: Entity[] = [];

  private readonly _world: planck.World;
  private lastEntityId = 1;
  private bounds: Body;
  private simulation: { timeStep: number; velocityIterations: number; positionIterations: number };
  public room: Room;

  constructor(
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
    this._world = planck.World(physicsOptions);
  }

  public update(deltaTime: number) {
    // Update entities
    for (let i = 0; i < this.entities.length; i++) {
      this.entities[i].update(deltaTime);
    }
  }

  public updateBounds(size: number[]) {
    if (this.bounds != null) {
      this.bounds.destroyFixture(this.bounds.getFixtureList());
    }

    // Create boundaries
    this.bounds = this._world.createBody({
      type: 'static',
      position: Vec2.zero(),
    });
    this.bounds.createFixture({
      shape: Box(0.5, size[1], Vec2(size[0], 0), 0),
      density: 50.0,
      filterCategoryBits: EntityCategory.BOUNDARY,
      filterMaskBits: EntityCategory.PLAYER | EntityCategory.NPC | EntityCategory.STRUCTURE,
    });
    this.bounds.createFixture({
      shape: Box(0.5, size[1], Vec2(-size[0], 0), 0),
      density: 50.0,
      filterCategoryBits: EntityCategory.BOUNDARY,
      filterMaskBits: EntityCategory.PLAYER | EntityCategory.NPC | EntityCategory.STRUCTURE,
    });
    this.bounds.createFixture({
      shape: Box(size[0], 0.5, Vec2(0, size[1]), 0),
      density: 50.0,
      filterCategoryBits: EntityCategory.BOUNDARY,
      filterMaskBits: EntityCategory.PLAYER | EntityCategory.NPC | EntityCategory.STRUCTURE,
    });
    this.bounds.createFixture({
      shape: Box(size[0], 0.5, Vec2(0, -size[1]), 0),
      density: 50.0,
      filterCategoryBits: EntityCategory.BOUNDARY,
      filterMaskBits: EntityCategory.PLAYER | EntityCategory.NPC | EntityCategory.STRUCTURE,
    });
  }

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
    this._world.step(this.simulation.timeStep, this.simulation.velocityIterations, this.simulation.positionIterations);
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
