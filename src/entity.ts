import { Client } from 'elsa';
import * as planck from 'planck-js';
import { ClientData, InputState } from './client-data';
import { Component } from './components/component';
import { Type } from './types';
import GameRoom from './game-room';
import { World } from './systems/world';
import { Fixture } from 'planck-js';
import * as EventEmitter from 'eventemitter3';

export class Entity {
  public id: string;
  public owner: Client;
  public world: World;
  public objectId: number;
  public input: InputState = { down: false, left: false, right: false, up: false, angle: 0, primary: false };
  public components: Component[] = [];

  private componentCache: { [key: string]: Component } = {};
  public isDirty: boolean;
  private _eventEmitter: EventEmitter;
  public componentBuffers: { [key: string]: { t: number; buffer: Buffer } } = {};

  public constructor(id = 'Entity', world: World, owner?: Client) {
    this.id = id;
    this.world = world;
    this.owner = owner;

    this.objectId = world.getEntityId();
    this._eventEmitter = new EventEmitter();
  }

  public on(event: 'destroy', fn: (...args: any[]) => void): EventEmitter {
    return this._eventEmitter.on(event, fn);
  }

  public destroy() {
    this._eventEmitter.emit('destroy');
    const room = <GameRoom>this.world.room;
    for (let i = 0; i < this.components.length; i++) {
      delete room.componentCache[this.components[i].constructor.name];
      this.components[i].onDestroy();
    }
  }

  public getComponent(componentType: Type<Component>): Component {
    return this.componentCache[componentType.name];
  }

  public addComponent(component: Component): Component {
    component.entity = this;
    const parent = Object.getPrototypeOf(component.constructor).name;
    if (parent != 'Component') this.componentCache[parent] = component;

    this.componentCache[component.constructor.name] = component;
    this.components.push(component);
    const room = <GameRoom>this.world.room;
    if (room.componentCache[component.constructor.name])
      room.componentCache[component.constructor.name].push(component);
    else {
      room.componentCache[component.constructor.name] = [component];
    }
    component.init();

    return component;
  }

  public onCollisionEnter(me: Fixture, other: Fixture): void {
    // Components
    for (let i = 0; i < this.components.length; i++) {
      this.components[i].onCollisionEnter(me, other);
    }
  }
  public onCollisionExit(me: Fixture, other: Fixture): void {
    // Components
    for (let i = 0; i < this.components.length; i++) {
      this.components[i].onCollisionExit(me, other);
    }
  }

  public onTriggerEnter(me: Fixture, other: Fixture): void {
    // Components
    for (let i = 0; i < this.components.length; i++) {
      this.components[i].onTriggerEnter(me, other);
    }
  }
  public onTriggerExit(me: Fixture, other: Fixture): void {
    // Components
    for (let i = 0; i < this.components.length; i++) {
      this.components[i].onTriggerExit(me, other);
    }
  }
}
