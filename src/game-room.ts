import { Client, Room, WSCloseCode } from 'elsa';
import * as debugModule from 'debug';
import * as http from 'http';
import { Entity } from './entity';
import { ClientProtocol, EntityCategory, getBytes, Protocol } from './protocol';
import { GameClient } from './game-client';
import { PhysicsBody } from './components/physics-body';
import { NameTag } from './components/name-tag';
import { Inventory, ItemSlot } from './components/inventory';
import { World } from './systems/world';
import { BuildingBlock } from './components/items/building-block';
import { Position } from './components/position';
import { Health } from './components/health';
import { Box, Circle, Vec2 } from 'planck-js';
import { Team } from './components/team';
import { createItem, createWoodenBlock, createWoodenSpike } from './components/items/util/create-object';
import { Tiers } from './data/tiers';
import { Spawner } from './systems/spawner';
import { randomRange, randomRangeFloat } from './utils';
import { GoldMine } from './components/gold-mine';
import { Observable } from './components/observable';
import { Level } from './components/level';
import { KillRewards } from './components/kill-rewards';
import { Rotation } from './components/rotation';
import { performance } from 'perf_hooks';
import { System } from './systems/system';
import { VisibilitySystem } from './systems/visibility-system';
import { Component } from './components/component';
import { ZombieAI } from './components/zombie-ai';
import { Movement } from './components/movement';
import { Equipment } from './components/equipment';
import { Gold } from './components/gold';
import { SimpleSystems } from './systems/simple-systems';
import { MovementSystem } from './systems/movement-system';
import { LevelSystem } from './systems/level-system';
import { HealthSystem } from './systems/health-system';
import { AISystem } from './systems/ai-system';
import { PlayerInput } from './components/player-input';
import { Animation } from './components/animation';
import { EntityId } from './data/entity-id';
import { MeleeWeapon } from './components/items/melee-weapon';
import { Food } from './components/items/food';
import { FoodMine } from './components/food-mine';
import { ItemUpgrade } from './components/item-upgrade';
import { Tool } from './components/items/tool';
import { LeaderboardEntry } from './components/leaderboard-entry';
import { LeaderboardSystem } from './systems/leaderboard-system';
import { ChatMessage } from './components/chat-message';
import { Minimap } from './components/minimap';
import { Zone } from './components/zone';
import { ObservableByAll } from './components/observable-by-all';

const debug = debugModule('GameRoom');

export default class GameRoom extends Room {
  public startTime: number;
  public systems: { [key: string]: System } = {};

  private gameWorld: World;
  private observerUpdateTick = 0;
  private playableArea: Vec2 = Vec2(200, 200);
  private systemsArray: System[] = [];
  private _i = 0;
  public currentTick = 0;
  private _sendTick = 0;
  private sendRate = 1 / 15;
  public componentCache: { [key: string]: Component[] } = {};
  private lastSend = 0;

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
      { positionIterations: 4, timeStep: 1 / 30, velocityIterations: 6 },
    );

    // Create boundaries
    this.gameWorld.updateBounds(this.playableArea);

    this.addSystem(new HealthSystem(this));
    this.addSystem(new LevelSystem(this));
    this.addSystem(new MovementSystem(this));
    this.addSystem(new SimpleSystems(this));
    this.addSystem(new AISystem(this));
    this.addSystem(new VisibilitySystem(this));
    this.addSystem(new LeaderboardSystem(this));
    this.addSystem(this.gameWorld);

    {
      const entity = new Entity(EntityId.Zone, this.gameWorld);
      entity.addComponent(new Position(Vec2.zero(), Vec2.zero()));
      entity.addComponent(new Minimap());
      entity.addComponent(new ObservableByAll());
      const zone = <Zone>entity.addComponent(new Zone());
      zone.setData('Ground Zero', Vec2(3000, 3000), 102, 0, 0);
    }

    // Create mines
    const mineCount = Math.round(this.playableArea.length() / 2);
    console.log(mineCount);
    for (let i = 0; i < mineCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const body = this.gameWorld.getPhysicsWorld().createBody({
        type: 'static',
        position: Vec2(
          randomRangeFloat(-(this.playableArea.x / 2), this.playableArea.x / 2),
          randomRangeFloat(-(this.playableArea.y / 2), this.playableArea.y / 2),
        ),
        angle,
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
      const entity = new Entity(EntityId.GoldMine, this.gameWorld);
      entity.addComponent(new Position(body.getPosition(), body.getLinearVelocity()));
      entity.addComponent(new Rotation(body.getAngle()));
      entity.addComponent(new PhysicsBody(body));
      entity.addComponent(new Health(1, 1));
      entity.addComponent(new Team(1));
      entity.addComponent(new GoldMine());
      entity.addComponent(new Minimap());
      entity.addComponent(new Observable());
    }

    for (let i = 0; i < mineCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const body = this.gameWorld.getPhysicsWorld().createBody({
        type: 'static',
        position: Vec2(
          randomRangeFloat(-(this.playableArea.x / 2), this.playableArea.x / 2),
          randomRangeFloat(-(this.playableArea.y / 2), this.playableArea.y / 2),
        ),
        angle,
      });
      body.createFixture({
        shape: Circle(0.75),
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
      const entity = new Entity(EntityId.FoodBush, this.gameWorld);
      entity.addComponent(new Position(body.getPosition(), body.getLinearVelocity()));
      entity.addComponent(new Rotation(body.getAngle()));
      entity.addComponent(new PhysicsBody(body));
      entity.addComponent(new Health(1, 1));
      entity.addComponent(new Team(1));
      entity.addComponent(new FoodMine());
      entity.addComponent(new Minimap());
      entity.addComponent(new Observable());
    }
    const zombieSpawner = new Spawner(this.playableArea.length(), 4, 1, 1, 10, () => {
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
      const entity = new Entity(EntityId.YoungZombie, this.gameWorld);
      entity.addComponent(new Animation());
      entity.addComponent(new Position(body.getPosition(), body.getLinearVelocity()));
      entity.addComponent(new Rotation(body.getAngle()));
      entity.addComponent(new PhysicsBody(body));
      entity.addComponent(new Team(1));
      entity.addComponent(new Health(40, 5));
      entity.addComponent(new KillRewards(20, randomRange(0, 10)));
      entity.addComponent(new Movement(500));
      entity.addComponent(new Minimap());

      entity.addComponent(new ZombieAI());
      entity.addComponent(new Observable());

      (<NameTag>entity.addComponent(new NameTag())).setName('Young Zombie ');

      return entity;
    });
    this.addSimulationInterval(zombieSpawner.update.bind(zombieSpawner), 1000 / 10);
    // Add timers
    //this.addSimulationInterval(this.systems[World.name].tick.bind(this.systems[World.name]), 1000 / 30);
    //this.addSimulationInterval(this.systems[Visibility.name].tick.bind(this.systems[Visibility.name]), 1000 / 10);
    this.addSimulationInterval(this.update.bind(this), 1000 / 30);
    //this.addSimulationInterval(this.gameWorld.step.bind(this.gameWorld), 1000 / 10);
  }

  public update(deltaTime: number): void {
    const t = performance.now();
    this.currentTick++;
    this._sendTick += deltaTime;
    // Tick systems
    for (let i = 0; i < this.systemsArray.length; i++) {
      this.systemsArray[i].tick(deltaTime);
    }
    // Send updates if necessary
    if (this._sendTick >= this.sendRate) {
      this._sendTick = 0;

      const now = performance.now();

      // Send updates to every client
      for (let i = 0; i < this.clients.length; i++) {
        const client = this.clients[i];
        const clientData = <GameClient>client.getUserData();
        if (clientData == undefined || clientData.observing == null) continue;

        // Send update for dirty entities if there are any
        const dirty = clientData.observing.filter((e: Entity) => {
          if (e.isDirty) {
            e.isDirty = false;
            return e;
          }
        });
        if (dirty.length > 0) {
          client.send(getBytes[Protocol.EntityUpdate](client, dirty, now - this.startTime, this.lastSend));
        }

        // Send queued messages like inventory and gold updates
        for (let j = 0; j < clientData.queuedMessages.length; j++) {
          client.send(clientData.queuedMessages[j]);
        }
        clientData.queuedMessages = [];
        //client.flush(); // Send all queued messages
      }
      this.lastSend = this.currentTick;
    }

    /*console.log(
      'tick took',
      (performance.now() - t).toFixed(2),
      'ms',
      ' | ',
      'zombies on map',
      this.getComponentsOfType(ZombieAI.name).length,
      ' | ',
      'bodies on world',
      this.gameWorld.getPhysicsWorld().getBodyCount(),
    );*/
  }

  public onMessage(client: Client, message: Buffer) {
    const clientData = <GameClient>client.getUserData();
    if (!clientData) {
      debug('WARNING: Client ' + client.id + ' has no clientData but sent a message!');
      return;
    }
    const packetId = message.readUInt8(0);
    switch (packetId) {
      case ClientProtocol.InputAngle:
        clientData.input.angle = message.readFloatLE(1);
        break;
      case ClientProtocol.InputPrimary:
        clientData.input.primary = message.readUInt8(1) == 1;
        clientData.input.up = message.readUInt8(2) == 1;
        clientData.input.down = message.readUInt8(3) == 1;
        clientData.input.left = message.readUInt8(4) == 1;
        clientData.input.right = message.readUInt8(5) == 1;
        break;
      case ClientProtocol.SelectItem:
        if (!clientData.cameraFollowing) break;
        const equipment = <Equipment>clientData.cameraFollowing.getComponent(Equipment);
        const inventory = <Inventory>clientData.cameraFollowing.getComponent(Inventory);
        if (!inventory || !equipment) break;

        const item = inventory.getItemById(message.readUInt32LE(1));
        if (!item) break;

        equipment.hand = item; // todo what if it is hat

        break;
      case ClientProtocol.SelectUpgrade:
        if (!clientData.cameraFollowing) break;
        const upgrade = <ItemUpgrade>clientData.cameraFollowing.getComponent(ItemUpgrade); // TODO EXPLOIT: CAMERAFOLLOWING MIGHT NOT BE OWNED BY CLIENT!
        upgrade.upgrade(message.readUInt16LE(1));
        break;
      case ClientProtocol.ChatMessage:
        if (!clientData.cameraFollowing) break;
        let t = '';
        const len = message.readUInt16LE(1);
        for (let i = 0; i < len; i++) {
          t += String.fromCharCode(message.readUInt16LE(3 + i * 2));
        }

        if (t.startsWith('/exp')) {
          (<Level>clientData.cameraFollowing.getComponent(Level)).points += Number.parseInt(t.split(' ')[1], 10);
          return;
        }

        const chatMessage = <ChatMessage>clientData.cameraFollowing.getComponent(ChatMessage); // TODO EXPLOIT
        chatMessage.text = t;
        break;
      default:
        console.log('unknown packet:', packetId);
        break;
    }
  }

  public onAuth(client: Client, auth: string, request: http.IncomingMessage): any {
    debug('onAuth with auth string: ' + auth);
    return true;
  }

  public onJoin(client: Client, auth: any): void {
    // Create a ClientData object for this client
    const gameClient = new GameClient(client);
    client.setUserData(gameClient);

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
        EntityCategory.RESOURCE |
        EntityCategory.PLAYER |
        EntityCategory.NPC |
        EntityCategory.BULLET |
        EntityCategory.MELEE |
        EntityCategory.SENSOR,
    });

    // Create player entity
    const entity = new Entity(EntityId.Player, this.gameWorld, client);
    const goldComponent = <Gold>entity.addComponent(new Gold());
    const equipment = <Equipment>entity.addComponent(new Equipment());
    entity.addComponent(new Animation());
    entity.addComponent(new Inventory());
    entity.addComponent(new Level());
    entity.addComponent(new Team(100 + client.id));
    entity.addComponent(new Position(body.getPosition(), body.getLinearVelocity()));
    entity.addComponent(new Rotation(body.getAngle()));
    entity.addComponent(new PhysicsBody(body));
    entity.addComponent(new Health(100, 2));
    entity.addComponent(new Movement(1000));
    entity.addComponent(new PlayerInput());
    (<NameTag>entity.addComponent(new NameTag())).setName('Player ' + client.id);
    entity.addComponent(new ChatMessage());
    entity.addComponent(new LeaderboardEntry(client.id));
    entity.addComponent(new Minimap());
    entity.addComponent(new Observable());

    // Add items and inventory
    const inventory = <Inventory>entity.addComponent(new Inventory());

    (<GameClient>client.getUserData()).addOwnedEntity(entity);
    (<GameClient>client.getUserData()).cameraFollowing = entity;

    inventory.addItem(createItem(EntityId.Food, new Food(ItemSlot.Slot2), this.gameWorld, client));
    inventory.addItem(
      createItem(
        EntityId.WoodenBlock,
        new BuildingBlock(ItemSlot.Slot3, 0.25, 20, createWoodenBlock(client, new Team(100 + client.id))),
        this.gameWorld,
        client,
      ),
    );
    inventory.addItem(
      createItem(
        EntityId.WoodenSpike,
        new BuildingBlock(ItemSlot.Slot2, 0.25, 20, createWoodenSpike(client, new Team(100 + client.id))),
        this.gameWorld,
        client,
      ),
    );

    const defaultHand = createItem(EntityId.Stick, new Tool(), this.gameWorld, client);
    const upgradeComponent = <ItemUpgrade>entity.addComponent(new ItemUpgrade());
    upgradeComponent.addDefault('weapon', 'weapon', () => defaultHand, 1);
    upgradeComponent.addPointsWhen('weapon', [2, 3, 4]);
    upgradeComponent.addUpgrade(
      'weapon',
      'weapon',
      EntityId.AxeBasic,
      () =>
        createItem(
          EntityId.AxeBasic,
          new MeleeWeapon(1.6, 1.4, 5, 8, 6, 10, Box(0.5, 0.75, Vec2(1, -0.2))),
          this.gameWorld,
          client,
        ),
      2,
    );
    upgradeComponent.addUpgrade(
      'weapon',
      'weapon',
      EntityId.AxeNormal,
      () =>
        createItem(
          EntityId.AxeNormal,
          new MeleeWeapon(1.8, 2, 10, 10, 8, 15, Box(0.5, 0.75, Vec2(1, -0.2))),
          this.gameWorld,
          client,
        ),
      3,
    );
    upgradeComponent.addUpgrade(
      'weapon',
      'weapon',
      EntityId.AxeGreat,
      () =>
        createItem(
          EntityId.AxeGreat,
          new MeleeWeapon(2, 2.75, 15, 20, 10, 40, Box(0.625, 0.875, Vec2(1.25, -0.1))),
          this.gameWorld,
          client,
        ),
      4,
    );

    equipment.hand = defaultHand;

    gameClient.queuedMessages.push(getBytes[Protocol.WorldSize](this.playableArea));
    gameClient.queuedMessages.push(getBytes[Protocol.CameraFollow](entity.objectId));

    client.getUserData().setTier(Tiers.Wood);
  }

  public onLeave(client: Client, closeReason: WSCloseCode): void {
    // TODO (elsa?) kick disconnectevent
    const c = <GameClient>client.getUserData();
    for (let i = 0; i < c.ownedEntities.length; i++) {
      c.ownedEntities[i].destroy();
    }
  }

  public onDispose() {
    console.log('dispose the room');
  }

  private addSystem(system: System) {
    this.systems[system.constructor.name] = system;
    this.systemsArray.push(system);
  }

  public getComponentsOfType(c: string): Component[] {
    return this.componentCache[c] || [];
  }
}
