import { Client } from 'elsa';
import * as planck from 'planck-js';
import { GameClient, InputState } from './game-client';
import { Component } from './components/component';
import { Type } from './types';
import GameRoom from './game-room';
import { World } from './systems/world';
import { Fixture } from 'planck-js';
import * as EventEmitter from 'eventemitter3';
import { EntityId } from './data/entity-id';

export class Entity {
  public id: EntityId;
  public owner: GameClient;
  public world: World;
  public objectId: number;
  public input: InputState = { down: false, left: false, right: false, up: false, angle: 0, primary: false };
  public components: Component[] = [];

  private componentCache: { [key: string]: Component } = {};
  public dirtyTick = 0;
  private _eventEmitter: EventEmitter;
  public componentBuffers: { [key: string]: { t: number; buffer: Buffer } } = {};
  public _destroyed: boolean;

  public constructor(id: EntityId, world: World, owner?: GameClient) {
    this.id = id;
    this.world = world;
    this.owner = owner;

    this.objectId = world.getEntityId();
    this._eventEmitter = new EventEmitter();
  }

  public on(event: 'destroy', fn: (...args: any[]) => void): EventEmitter {
    return this._eventEmitter.on(event, fn);
  }

  public once(event: 'destroy', fn: (...args: any[]) => void): EventEmitter {
    return this._eventEmitter.once(event, fn);
  }

  public destroy() {
    if (this._destroyed) return;
    this._destroyed = true;
    this._eventEmitter.emit('destroy');
    this._eventEmitter.removeAllListeners();

    const room = <GameRoom>this.world.room;
    for (let i = 0; i < this.components.length; i++) {
      const c = this.components[i];

      // Remove component
      let parent = Object.getPrototypeOf(this.components[i]);
      while (parent.constructor.name != 'Component') {
        const idx = room.componentCache[parent.constructor.name].indexOf(c);
        if (idx == -1) {
          console.log(
            parent.constructor.name,
            'RoomComponentCache Index is -1. Entity:',
            EntityId[this.id],
            'Actual Component:',
            this.components[i].constructor.name,
            'Size:',
            room.componentCache[parent.constructor.name].length,
            'IsNull?',
            room.componentCache[parent.constructor.name] == null,
          );
        } else room.componentCache[parent.constructor.name].splice(idx, 1);

        parent = Object.getPrototypeOf(parent);
      }
      this.components[i].onDestroy();
    }
  }

  public getComponent(componentType: Type<Component>): Component {
    return this.componentCache[componentType.name];
  }

  public addComponent(component: Component): Component {
    component.entity = this;
    component.init();
    const room = <GameRoom>this.world.room;

    let parent = Object.getPrototypeOf(component);
    while (parent.constructor.name != 'Component') {
      if (room.componentCache[parent.constructor.name]) room.componentCache[parent.constructor.name].push(component);
      else {
        room.componentCache[parent.constructor.name] = [component];
      }
      this.componentCache[parent.constructor.name] = component;

      parent = Object.getPrototypeOf(parent);
    }
    // TODO Maybe make it better: Currently there can only be one component of Type
    this.components.push(component);

    return component;
  }

  public removeAllComponents(): void {
    const room = <GameRoom>this.world.room;
    for (let i = 0; i < this.components.length; i++) {
      const c = this.components[i];

      // Remove component with parent id
      let parent = Object.getPrototypeOf(this.components[i]);
      while (parent != 'Component') {
        room.componentCache[parent.constructor.name].splice(room.componentCache[parent.constructor.name].indexOf(c), 1);

        parent = Object.getPrototypeOf(parent);
      }

      // Remove component
      const n = this.components[i].constructor.name;
      room.componentCache[n].splice(room.componentCache[n].indexOf(c), 1);
      this.components[i].onDestroy();
    }

    this.componentCache = {};
    this.componentBuffers = {};
    this.components = [];
  }

  public onCollisionEnter(me: Fixture, other: Fixture): void {
    if (this._destroyed) return;
    // Components
    for (let i = 0; i < this.components.length; i++) {
      this.components[i].onCollisionEnter(me, other);
    }
  }
  public onCollisionExit(me: Fixture, other: Fixture): void {
    if (this._destroyed) return;
    // Components
    for (let i = 0; i < this.components.length; i++) {
      this.components[i].onCollisionExit(me, other);
    }
  }

  public onTriggerEnter(me: Fixture, other: Fixture): void {
    if (this._destroyed) return;
    // Components
    for (let i = 0; i < this.components.length; i++) {
      this.components[i].onTriggerEnter(me, other);
    }
  }
  public onTriggerExit(me: Fixture, other: Fixture): void {
    if (this._destroyed) return;
    // Components
    for (let i = 0; i < this.components.length; i++) {
      this.components[i].onTriggerExit(me, other);
    }
  }
}
