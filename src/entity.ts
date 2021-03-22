import { Client } from 'elsa';
import * as Matter from 'matter-js';
import * as planck from 'planck-js';
import { ClientData, InputState } from './game-client';
import { Component } from './components/component';
import { Type } from './types';
import GameRoom from './game-room';
import { World } from './systems/world';

export class Entity {
  public id: string;
  public owner: Client;
  public world: World;
  public objectId: number;
  public input: InputState = { down: false, left: false, right: false, up: false, angle: 0, primary: false };
  public observingClients: Client[] = [];
  public components: Component[] = [];

  public _isDirty: boolean;

  constructor(id: string = 'Entity', world: World, owner?: Client) {
    this.id = id;
    this.world = world;
    this.owner = owner;

    this.objectId = world.getEntityId();
  }

  public destroy() {
    this.world.removeEntity(this);
    for (let i = 0; i < this.components.length; i++) {
      this.components[i].onDestroy();
    }
  }

  public getComponent(componentType: Type<Component>): Component {
    for (let i = 0; i < this.components.length; i++) {
      const component = this.components[i];
      if (component instanceof componentType) return component;
    }
    return null;
  }

  public addComponent(component: Component): Component {
    component.entity = this;
    this.components.push(component);
    component.init();
    return component;
  }

  public onCheckObserver(candidate: ClientData) {
    return true;
  }

  public update(deltaTime: number) {
    // Components
    for (let i = 0; i < this.components.length; i++) {
      this.components[i].update(deltaTime);
    }
  }

  public serialize(client: Client, initialization: boolean = false) {
    // Components
    const buffers = [];
    for (let i = 0; i < this.components.length; i++) {
      const componentBuf = this.components[i].serialize(client, initialization);
      if (componentBuf != null) buffers.push(componentBuf);
    }

    return buffers;
  }
}
