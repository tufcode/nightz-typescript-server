import { Client, Room, WSCloseCode } from 'elsa';
import * as debugModule from 'debug';
import * as http from 'http';
import { Entity } from './entity';
import { ClientProtocol, EntityCategory, getBytes, Protocol } from './protocol';
import { ClientData } from './client-data';
import { PhysicsBody } from './components/physics-body';
import { CharacterController } from './components/character-controller';
import { NameTag } from './components/name-tag';
import { Inventory, ItemSlot } from './components/inventory';
import { World } from './systems/world';
import { BuildingBlock } from './items/building-block';
import { Gold } from './components/gold';
import { PositionAndRotation } from './components/position-and-rotation';
import { Health } from './components/health';
import { AIController } from './components/ai-controller';
import { Circle, Vec2 } from 'planck-js';
import { Team } from './components/team';
import { createAxe, createBlock, createItem } from './items/util/create-object';
import { Tiers } from './data/tiers';
import { Axe } from './items/axe';
import { requireGold } from './items/util/callbacks';
import { Animation } from './components/animation';
import { Spawner } from './systems/spawner';
import { randomRange } from './utils';
import { GoldMine } from './components/gold-mine';
import { Observable } from './components/observable';
import { Experience } from './components/experience';
import { KillRewards } from './components/kill-rewards';
import { Rotation } from './components/rotation';
import { performance } from 'perf_hooks';
const debug = debugModule('GameRoom');

export default class GameRoom extends Room {
  public startTime: number;
  private gameWorld: World;
  private observerUpdateTick = 0;
  private playableArea: Vec2 = Vec2(200, 200);

  public onCreate(options: any) {
    debug(
      'Room created! :) joinOptions: ' + JSON.stringify(options) + ', handlerOptions: ' + JSON.stringify(this.options),
    );
    this.startTime = performance.now();
    this.gameWorld = new World(
      this,
      {
        gravity: Vec2.zero(),
      },
      { positionIterations: 2, timeStep: 1 / 30, velocityIterations: 4 },
    );

    // Create boundaries
    this.gameWorld.updateBounds(this.playableArea);

    // Create mines
    const mineCount = 0; ///*average area*/ (this.playableArea.x + this.playableArea.y) / 2;
    for (let i = 0; i < mineCount; i++) {
      const body = this.gameWorld.getPhysicsWorld().createBody({
        type: 'static',
        position: Vec2(
          randomRange(-(this.playableArea.x / 2), this.playableArea.x / 2),
          randomRange(-(this.playableArea.y / 2), this.playableArea.y / 2),
        ),
      });
      body.createFixture({
        shape: Circle(1),
        friction: 0,
        filterCategoryBits: EntityCategory.RESOURCE,
        filterMaskBits:
          EntityCategory.BOUNDARY |
          EntityCategory.STRUCTURE |
          EntityCategory.RESOURCE |
          EntityCategory.PLAYER |
          EntityCategory.NPC |
          EntityCategory.BULLET |
          EntityCategory.MELEE,
      });
      // Create AI entity
      const entity = new Entity('GoldMine', this.gameWorld);
      entity.addComponent(new PhysicsBody(body));
      entity.addComponent(new PositionAndRotation(body.getPosition(), body.getLinearVelocity(), body.getAngle()));
      entity.addComponent(new Health(0, 0, null));
      entity.addComponent(new Team(1));
      entity.addComponent(new GoldMine());
      entity.addComponent(new Observable());

      this.gameWorld.addEntity(entity);
    }

    const zombieSpawner = new Spawner((this.playableArea.x + this.playableArea.y) / 2, 4, 1, 0.7, 0, () => {
      const body = this.gameWorld.getPhysicsWorld().createBody({
        type: 'dynamic',
        position: Vec2(
          randomRange(-(this.playableArea.x / 2), this.playableArea.x / 2),
          randomRange(-(this.playableArea.y / 2), this.playableArea.y / 2),
        ),
        fixedRotation: true,
        linearDamping: 10,
      });
      body.createFixture({
        shape: Circle(0.375),
        density: 25.0,
        friction: 0,
        filterCategoryBits: EntityCategory.NPC,
        filterMaskBits:
          EntityCategory.BOUNDARY |
          EntityCategory.STRUCTURE |
          EntityCategory.RESOURCE |
          EntityCategory.PLAYER |
          EntityCategory.NPC |
          EntityCategory.BULLET |
          EntityCategory.MELEE |
          EntityCategory.SENSOR,
      });
      // Create AI entity
      const entity = new Entity('Zombie', this.gameWorld);
      entity.addComponent(new Animation());
      entity.addComponent(new PositionAndRotation(body.getPosition(), body.getLinearVelocity(), body.getAngle()));
      entity.addComponent(new PhysicsBody(body));
      entity.addComponent(new Team(1));
      entity.addComponent(new Health(40, 5, () => entity.destroy()));
      entity.addComponent(new Observable());
      entity.addComponent(new KillRewards(20, 10));

      const controller = <AIController>entity.addComponent(new AIController());
      controller.speed = 20;

      (<NameTag>entity.addComponent(new NameTag())).setName('Young Zombie');

      this.gameWorld.addEntity(entity);

      return entity;
    });
    this.addSimulationInterval(zombieSpawner.update.bind(zombieSpawner), 1000 / 10);
    // Add timers
    this.addSimulationInterval(this.update.bind(this), 1000 / 30);
    this.addSimulationInterval(this.observerUpdate.bind(this), 1000 / 20);
    //this.addSimulationInterval(this.gameWorld.step.bind(this.gameWorld), 1000 / 10);
  }

  public observerUpdate(deltaTime: number): void {
    const now = performance.now();
    // Only update observers every 100ms
    this.observerUpdateTick += deltaTime;
    const isObserverUpdate = this.observerUpdateTick >= 0.1;
    // Send positions and update observers if necessary
    for (let i = 0; i < this.clients.length; i++) {
      const client = this.clients[i];
      const clientData = client.getUserData();
      if (clientData == undefined) continue;

      if (isObserverUpdate || clientData.observing == null) {
        // Only send update for existing entities when we already had a observer
        // update because observer updates send add/remove packets
        const existing = this.updateObserverCache(client).filter((e) => {
          if (e._isDirty) {
            e._isDirty = false;
            return e;
          }
        });
        if (existing.length > 0) client.send(getBytes[Protocol.EntityUpdate](client, existing, now - this.startTime));
      } else {
        // Send update for dirty entities if there are any
        const dirty = clientData.observing.filter((e) => {
          if (e._isDirty) {
            e._isDirty = false;
            return e;
          }
        });
        if (dirty.length > 0) client.send(getBytes[Protocol.EntityUpdate](client, dirty, now - this.startTime));
      }
    }
    if (isObserverUpdate) this.observerUpdateTick = 0;
  }

  public update(deltaTime: number): void {
    this.gameWorld.update(deltaTime);
    this.gameWorld.step(deltaTime);
  }

  public onMessage(client: Client, message: Buffer) {
    const clientData = <ClientData>client.getUserData();
    if (!clientData) {
      debug('WARNING: Client ' + client.id + ' has no clientData but sent a message!');
      return;
    }
    const packetId = message.readUInt8(0);
    switch (packetId) {
      case ClientProtocol.InputAngle:
        clientData.input.angle = message.readFloatLE(1);
        clientData.controlling.entity.input = clientData.input;
        break;
      case ClientProtocol.InputPrimary:
        clientData.input.primary = message.readUInt8(1) == 1;
        clientData.input.up = message.readUInt8(2) == 1;
        clientData.input.down = message.readUInt8(3) == 1;
        clientData.input.left = message.readUInt8(4) == 1;
        clientData.input.right = message.readUInt8(5) == 1;
        clientData.controlling.entity.input = clientData.input;
        break;
      case ClientProtocol.SelectItem:
        if (!clientData.controlling) break;
        const inventory = <Inventory>clientData.controlling.entity.getComponent(Inventory);
        if (!inventory) break;

        inventory.selectItem(message.readUInt32LE(1));

        break;
    }
  }

  public onAuth(client: Client, auth: string, request: http.IncomingMessage): any {
    debug('onAuth with auth string: ' + auth);
    return true;
  }

  public onJoin(client: Client, auth: any): void {
    // Create a ClientData object for this client
    client.setUserData(new ClientData(client));

    const body = this.gameWorld.getPhysicsWorld().createBody({
      type: 'dynamic',
      position: Vec2(0, 0),
      fixedRotation: true,
      linearDamping: 10,
    });
    body.createFixture({
      shape: Circle(0.5),
      density: 20.0,
      filterCategoryBits: EntityCategory.PLAYER,
      filterMaskBits:
        EntityCategory.BOUNDARY |
        EntityCategory.STRUCTURE |
        EntityCategory.PLAYER |
        EntityCategory.NPC |
        EntityCategory.BULLET |
        EntityCategory.MELEE |
        EntityCategory.SENSOR,
    });

    // Create player entity
    const entity = new Entity('Player', this.gameWorld, client);
    entity.addComponent(new Experience());
    entity.addComponent(new Animation());
    entity.addComponent(new Team(100 + client.id));
    entity.addComponent(new PositionAndRotation(body.getPosition(), body.getLinearVelocity(), body.getAngle()));
    entity.addComponent(new Rotation(body.getAngle()));
    <PhysicsBody>entity.addComponent(new PhysicsBody(body));
    entity.addComponent(new Health(100, 2, null));
    const controller = <CharacterController>entity.addComponent(new CharacterController());
    (<NameTag>entity.addComponent(new NameTag())).setName('Player ' + client.id);
    entity.addComponent(new Observable());

    // Add items and inventory
    const inventory = <Inventory>entity.addComponent(new Inventory());

    // Update observing entities and set player entity for client
    client.getUserData().controlling = controller;
    this.gameWorld.addEntity(entity);

    (<ClientData>client.getUserData()).addOwnedEntity(entity);

    inventory.addItem(createAxe(this.gameWorld, client));
    inventory.addItem(
      createItem(
        new BuildingBlock(
          'WoodenBlock',
          ItemSlot.Slot2,
          Vec2(1, 1),
          Circle(0.5),
          () => requireGold(inventory, 20),
          () => {
            inventory.gold += 20;
            client.send(getBytes[Protocol.TemporaryMessage]('NoRest,' + entity.objectId, 2));
          },
          createBlock(client, new Team(100 + client.id)),
        ),
        this.gameWorld,
        client,
      ),
    );

    this.updateObserverCache(client);
    client.send(getBytes[Protocol.SetPlayerEntity](entity.objectId));
    client.send(getBytes[Protocol.WorldSize](this.playableArea));

    client.getUserData().setTier(Tiers.Wood);
  }

  public onLeave(client: Client, closeReason: WSCloseCode): void {
    const c = <ClientData>client.getUserData();
    for (let i = 0; i < c.ownedEntities.length; i++) {
      c.ownedEntities[i].destroy();
    }
  }

  public onDispose() {
    console.log('dispose the room');
  }

  private updateObserverCache(client: Client): Entity[] {
    const clientData = client.getUserData();
    const newEntities = [];
    const existingEntities = [];
    const cache = clientData.observing || [];
    clientData.observing = this.gameWorld.entities.filter((e) => {
      const observable = <Observable>e.getComponent(Observable);
      if (observable == null) return false; // Can't show without observable component

      // Check observer
      if (observable.onCheckObserver(client)) {
        if (!cache.includes(e)) {
          e.observingClients.push(client);
          newEntities.push(e);
        } else existingEntities.push(e);
        return true;
      }
      // Client can't see this entity.
      return false;
    });

    // Add new entities
    if (newEntities.length > 0)
      client.send(getBytes[Protocol.Entities](client, newEntities, performance.now() - this.startTime));

    // Destroy out-of-view entities
    const noLongerObserving = cache.filter((e) => {
      const isNoLongerObserving = !clientData.observing.includes(e);
      // Remove client from observingClients
      if (isNoLongerObserving) e.observingClients.slice(e.observingClients.indexOf(client), 1);
      return isNoLongerObserving;
    });
    // Send remove packet
    if (noLongerObserving.length > 0) client.send(getBytes[Protocol.RemoveEntities](noLongerObserving));

    // Return existing entities
    return existingEntities;
  }
}
