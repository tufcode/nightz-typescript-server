import { Client, Room } from 'elsa';
import * as debugModule from 'debug';
import * as http from 'http';
import { Entity } from './entity';
import { ClientProtocol, EntityCategory, getBytes, Protocol } from './protocol';
import { ClientData } from './game-client';
import { PhysicsBody } from './components/physics-body';
import { CharacterController } from './components/character-controller';
import { NameTag } from './components/name-tag';
import { Equipped } from './components/equipped';
import { Inventory } from './components/inventory';
import { World } from './systems/world';
import { BuildingBlock } from './components/items/building-block';
import { Gold } from './components/gold';
import { PositionAndRotation } from './components/position-and-rotation';
import { Health } from './components/health';
import { Body, BodyType } from './systems/physics2/body';
import { Vector2 } from './systems/physics2/vector2';
import { AIController } from './components/ai-controller';
import { Circle, Vec2 } from 'planck-js';

const debug = debugModule('GameRoom');

export default class GameRoom extends Room {
  public startTime: number;
  private gameWorld: World;
  private observerUpdateTick = 0;
  private playableArea: [number, number] = [200, 200];
  public clientData: { [key: number]: ClientData } = {};

  public onCreate(options: any) {
    debug(
      'Room created! :) joinOptions: ' + JSON.stringify(options) + ', handlerOptions: ' + JSON.stringify(this.options),
    );
    this.startTime = Date.now();
    this.gameWorld = new World(
      this,
      {
        gravity: Vec2.zero(),
      },
      { positionIterations: 2, timeStep: 1 / 10, velocityIterations: 4 },
    );

    // Create boundaries
    this.gameWorld.updateBounds(this.playableArea);

    for (let i = 0; i < 5; i++) {
      const body = this.gameWorld.getPhysicsWorld().createBody({
        type: 'dynamic',
        position: Vec2(10, i),
        fixedRotation: true,
        linearDamping: 10,
      });
      body.createFixture({
        shape: Circle(0.5),
        density: 20.0,
        friction: 0,
        filterCategoryBits: EntityCategory.NPC,
        filterMaskBits:
          EntityCategory.PLAYER |
          EntityCategory.BOUNDARY |
          EntityCategory.BULLET |
          EntityCategory.NPC |
          EntityCategory.STRUCTURE,
      });
      // Create AI entity
      const entity = new Entity('Player', this.gameWorld);
      entity.addComponent(new PositionAndRotation(body.getPosition(), body.getAngle()));
      entity.addComponent(new PhysicsBody(body));
      entity.addComponent(new Health(null));
      //const equipped = <Equipped>entity.addComponent(new Equipped());
      //const inventory = <Inventory>entity.addComponent(new Inventory());
      entity.addComponent(new AIController());
      (<NameTag>entity.addComponent(new NameTag())).setName('Test AI' + i);
      this.gameWorld.addEntity(entity);
    }

    // Add test AI
    /*for (let x = 0; x < 10; x++) {
      for (let y = -x; y < x + 1; y++) {
        const mass = x == 9 ? 5000 : (x + 1) * 2;
        const body = new Body(new Vector2(x, y), new Vector2(0, 0), 0.5, Number.MAX_VALUE);
        body.type = BodyType.Static;
        body.restitution = 0.25;
        body.linearDamping = 0.025;
        this.gameWorld.getPhysicsWorld().addBody(body);

        // Create player entity
        const entity = new Entity('Player', this.gameWorld);
        entity.addComponent(new PositionAndRotation(body.position, body.angle));
        entity.addComponent(new PhysicsBody(body));
        entity.addComponent(new Health(null));
        //const equipped = <Equipped>entity.addComponent(new Equipped());
        //const inventory = <Inventory>entity.addComponent(new Inventory());
        entity.addComponent(new CharacterController());
        (<NameTag>entity.addComponent(new NameTag())).setName('Static');

        this.gameWorld.addEntity(entity);
      }
    }*/

    // Add test AI

    /*{
      const body = new Body(new Vector2(1.5, 1.5), new Vector2(0, 0), 0.5, 1);
      body.restitution = 0.75;
      body.linearDamping = 0.2;
      body.collisionCategory = EntityCategory.NPC;
      body.collisionMask = EntityCategory.PLAYER;
      this.gameWorld.getPhysicsWorld().addBody(body);

      // Create player entity
      const entity = new Entity('Player', this.gameWorld);
      entity.addComponent(new PositionAndRotation(body.position, body.angle));
      entity.addComponent(new PhysicsBody(body));
      //entity.addComponent(new Health(null));
      //const equipped = <Equipped>entity.addComponent(new Equipped());
      //const inventory = <Inventory>entity.addComponent(new Inventory());
      entity.addComponent(new CharacterController());
      (<NameTag>entity.addComponent(new NameTag())).setName('DifferentCollisionMask');

      this.gameWorld.addEntity(entity);
    }

    // Add big ball
    {
      const body = new Body(new Vector2(20, 0), new Vector2(0, 0), 8, Number.MAX_VALUE);
      body.type = BodyType.Static;
      body.restitution = 1;
      body.linearDamping = 5;
      body.collisionCategory = EntityCategory.STRUCTURE;
      body.collisionMask = EntityCategory.PLAYER | EntityCategory.BULLET;
      this.gameWorld.getPhysicsWorld().addBody(body);

      // Create player entity
      const entity = new Entity('Big', this.gameWorld);
      entity.addComponent(new PositionAndRotation(body.position, body.angle));
      entity.addComponent(new PhysicsBody(body));
      //const equipped = <Equipped>entity.addComponent(new Equipped());
      //const inventory = <Inventory>entity.addComponent(new Inventory());
      entity.addComponent(new CharacterController());
      (<NameTag>entity.addComponent(new NameTag())).setName('Big static');

      this.gameWorld.addEntity(entity);
    }*/

    // Add timers
    //this.addSimulationInterval(this.gameWorld.step.bind(this.gameWorld), 1000 / 10);
    this.addSimulationInterval(this.update.bind(this), 1000 / 10);
  }

  public update(deltaTime: number) {
    const now = Date.now();

    this.gameWorld.update(deltaTime);
    this.gameWorld.step(deltaTime);

    // Only update observers every 100ms
    this.observerUpdateTick++;
    const isObserverUpdate = this.observerUpdateTick == 1;
    // Send positions and update observers if necessary
    for (let i = 0; i < this.clients.length; i++) {
      const client = this.clients[i];
      const clientData = this.clientData[client.id];
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

  public onMessage(client: Client, message: Buffer) {
    const clientData = this.clientData[client.id];
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
    }
  }

  public onAuth(client: Client, auth: string, request: http.IncomingMessage): any {
    debug('onAuth with auth string: ' + auth);
    return true;
  }

  public onJoin(client: Client, auth: any) {
    // Create a ClientData object for this client
    this.clientData[client.id] = new ClientData();

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
        EntityCategory.PLAYER |
        EntityCategory.BOUNDARY |
        EntityCategory.BULLET |
        EntityCategory.NPC |
        EntityCategory.STRUCTURE,
    });

    // Create player entity
    const entity = new Entity('Player', this.gameWorld, client);
    entity.addComponent(new PositionAndRotation(body.getPosition(), body.getAngle()));
    const physicsBody = <PhysicsBody>entity.addComponent(new PhysicsBody(body));
    entity.addComponent(new Gold());
    entity.addComponent(new Health(null));
    const equipped = <Equipped>entity.addComponent(new Equipped());
    const inventory = <Inventory>entity.addComponent(new Inventory());
    const controller = <CharacterController>entity.addComponent(new CharacterController());
    (<NameTag>entity.addComponent(new NameTag())).setName('Player ' + client.id);

    this.gameWorld.addEntity(entity); // TODO Components not initialized after addEntity

    // Set controlling entity to created entity
    this.clientData[client.id].controlling = controller;

    // Create basic equipment
    /*const axeEntity = new Entity('Axe', this.gameWorld);
    const axe = <Axe>axeEntity.addComponent(new Axe());
    this.gameWorld.addEntity(axeEntity);
    // Equip the axe
    if (inventory.addItem(axe)) equipped.equip(axe);*/
    const axeEntity = new Entity('Box', this.gameWorld);
    const axe = <BuildingBlock>axeEntity.addComponent(new BuildingBlock());
    this.gameWorld.addEntity(axeEntity);

    // Equip the axe
    if (inventory.addItem(axe)) equipped.equip(axe);

    // Update observing entities and set player entity for client
    this.updateObserverCache(client);
    client.send(getBytes[Protocol.SetPlayerEntity](entity.objectId));
  }

  private updateObserverCache(client: Client): Entity[] {
    const clientData = this.clientData[client.id];
    const newEntities = [];
    const existingEntities = [];
    const cache = clientData.observing || [];
    clientData.observing = this.gameWorld.entities.filter((e) => {
      if (e.onCheckObserver(clientData)) {
        if (!cache.includes(e)) {
          e.observingClients.push(client);
          newEntities.push(e);
        } else existingEntities.push(e);
        return true;
      }
    });
    // Add new entities
    if (newEntities.length > 0) client.send(getBytes[Protocol.Entities](client, newEntities));

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
