import { System } from './system';
import { Body, BodyDef, Box, Vec2, WorldDef } from 'planck-js';
import * as planck from 'planck-js';
import { Entity } from '../entity';
import { EntityCategory, getBytes, Protocol } from '../protocol';
import { Room } from 'elsa';
import * as debugModule from 'debug';
const debug = debugModule('Physics');

export class World extends System {
  public bounds: Vec2;

  private readonly _world: planck.World;
  private lastEntityId = 1;
  private _bounds: Body;
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
    this._world = planck.World(physicsOptions);

    this._world.on('begin-contact', (contact) => {
      const fixtureA = contact.getFixtureA();
      const fixtureB = contact.getFixtureB();

      const AEntity = <Entity>fixtureA.getBody().getUserData();
      const BEntity = <Entity>fixtureB.getBody().getUserData();
      if (!AEntity || !BEntity) return;
      if (fixtureA.isSensor() || fixtureB.isSensor()) {
        AEntity.onTriggerEnter(fixtureA, fixtureB);
        BEntity.onTriggerEnter(fixtureB, fixtureA);
      } else {
        AEntity.onCollisionEnter(fixtureA, fixtureB);
        BEntity.onCollisionEnter(fixtureB, fixtureA);
      }
    });
    this._world.on('end-contact', (contact) => {
      const fixtureA = contact.getFixtureA();
      const fixtureB = contact.getFixtureB();

      const AEntity = <Entity>fixtureA.getBody().getUserData();
      const BEntity = <Entity>fixtureB.getBody().getUserData();
      if (!AEntity || !BEntity) return;
      if (fixtureA.isSensor() || fixtureB.isSensor()) {
        AEntity.onTriggerExit(fixtureA, fixtureB);
        BEntity.onTriggerExit(fixtureB, fixtureA);
      } else {
        AEntity.onCollisionExit(fixtureA, fixtureB);
        BEntity.onCollisionExit(fixtureB, fixtureA);
      }
    });
  }

  public tick(deltaTime: number) {
    this._world.step(this.simulation.timeStep, this.simulation.velocityIterations, this.simulation.positionIterations);
  }

  public updateBounds(size: Vec2) {
    this.bounds = size;
    if (this._bounds != null) {
      this._bounds.destroyFixture(this._bounds.getFixtureList());
    }

    // Create boundaries
    this._bounds = this._world.createBody({
      type: 'static',
      position: Vec2.zero(),
    });
    this._bounds.createFixture({
      shape: Box(0.5, size.y, Vec2(size.x, 0), 0),
      density: 50.0,
      filterCategoryBits: EntityCategory.BOUNDARY,
      filterMaskBits: EntityCategory.PLAYER | EntityCategory.NPC | EntityCategory.STRUCTURE,
    });
    this._bounds.createFixture({
      shape: Box(0.5, size.y, Vec2(-size.x, 0), 0),
      density: 50.0,
      filterCategoryBits: EntityCategory.BOUNDARY,
      filterMaskBits: EntityCategory.PLAYER | EntityCategory.NPC | EntityCategory.STRUCTURE,
    });
    this._bounds.createFixture({
      shape: Box(size.x, 0.5, Vec2(0, size.y), 0),
      density: 50.0,
      filterCategoryBits: EntityCategory.BOUNDARY,
      filterMaskBits: EntityCategory.PLAYER | EntityCategory.NPC | EntityCategory.STRUCTURE,
    });
    this._bounds.createFixture({
      shape: Box(size.x, 0.5, Vec2(0, -size.y), 0),
      density: 50.0,
      filterCategoryBits: EntityCategory.BOUNDARY,
      filterMaskBits: EntityCategory.PLAYER | EntityCategory.NPC | EntityCategory.STRUCTURE,
    });
  }

  public getPhysicsWorld() {
    return this._world;
  }

  public getEntityId() {
    return this.lastEntityId++;
  }
}
