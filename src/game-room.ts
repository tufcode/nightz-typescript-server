import { Client, Room, WSCloseCode } from 'elsa';
import * as debugModule from 'debug';
import * as http from 'http';
import { Entity } from './entity';
import { ClientProtocol, EntityCategory, getBytes, Protocol } from './protocol';
import { GameClient } from './game-client';
import { PhysicsBody } from './components/physics-body';
import { NameTag } from './components/name-tag';
import { Inventory, ItemType } from './components/inventory';
import { World } from './systems/world';
import { BuildingBlock } from './components/items/building-block';
import { Position } from './components/position';
import { Health } from './components/health';
import { AABB, Box, Circle, Vec2 } from 'planck-js';
import { Team } from './components/team';
import { createWoodenBlock, createWoodenSpike } from './components/items/util/create-object';
import { Tiers } from './data/tiers';
import { Spawner, SpawnerData } from './systems/spawner';
import { randomRange, randomRangeFloat } from './utils';
import { Mine } from './components/mine';
import { Observable } from './components/observable';
import { Level } from './components/level';
import { Rotation } from './components/rotation';
import { performance } from 'perf_hooks';
import { System } from './systems/system';
import { VisibilitySystem } from './systems/visibility-system';
import { Component } from './components/component';
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
import { ItemUpgrade } from './components/item-upgrade';
import { LeaderboardEntry } from './components/leaderboard-entry';
import { LeaderboardSystem } from './systems/leaderboard-system';
import { ChatMessage } from './components/chat-message';
import { Minimap } from './components/minimap';
import { Zone } from './components/zone';
import { ObservableByAll } from './components/observable-by-all';
import { Regeneration } from './components/regeneration';
import { CreateZombie } from './prefabs/zombie';
import { Stone } from './components/stone';
import { Wood } from './components/wood';
import { createMinerWooden } from './prefabs/miner-wooden';
import { FoodBag } from './components/food-bag';
import { ChatSystem } from './systems/chat-system';
import { createSpeedBoost } from './prefabs/speed-boost';
import { createPlayer } from './prefabs/player';

const debug = debugModule('GameRoom');

export default class GameRoom extends Room {
  public startTime: number;
  public currentTick = 0;
  public systems: { [key: string]: System } = {};
  public componentCache: { [key: string]: Component[] } = {};

  private _gameWorld: World;
  private _playableArea: Vec2 = Vec2(200, 200);
  private _systemsArray: System[] = [];
  private _sendTick = 0;
  private _sendRate = 1 / 15;
  private _lastSend = 0;
  private _dayNightCycleTick = 0;
  private _isNight = false;
  private _zombieSpawner: SpawnerData;

  public onCreate(options: any) {
    debug(
      'Room created! :) joinOptions: ' + JSON.stringify(options) + ', handlerOptions: ' + JSON.stringify(this.options),
    );
    this.startTime = performance.now();
    this._gameWorld = new World(
      this,
      {
        gravity: Vec2.zero(),
      },
      { positionIterations: 4, timeStep: 1 / 30, velocityIterations: 6 },
    );

    // Create boundaries
    this._gameWorld.updateBounds(this._playableArea);

    this.addSystem(new HealthSystem(this));
    this.addSystem(new LevelSystem(this));
    this.addSystem(new MovementSystem(this));
    this.addSystem(new SimpleSystems(this));
    this.addSystem(new AISystem(this));
    this.addSystem(new VisibilitySystem(this));
    this.addSystem(new LeaderboardSystem(this));
    this.addSystem(new ChatSystem(this));
    this.addSystem(new Spawner());
    this.addSystem(this._gameWorld);
    /*
    {
      const entity = new Entity(EntityId.Zone, this._gameWorld);
      entity.addComponent(new Position(Vec2.zero(), Vec2.zero()));
      entity.addComponent(new Minimap());
      entity.addComponent(new ObservableByAll());
      const zone = <Zone>entity.addComponent(new Zone());
      zone.setData('Ground Zero', Vec2(3000, 3000), 102, 0, 0);
    }*/

    const spawner = <Spawner>this.systems[Spawner.name];
    // Zombie spawner
    this._zombieSpawner = spawner.addSpawn(this._playableArea.length() / 4, 3, 0.55, 0, () => {
      let pos: Vec2 = null;
      while (true) {
        let canSpawn = true;
        pos = Vec2(
          /*randomRange(-(this._playableArea.x / 2), this._playableArea.x / 2),
          randomRange(-(this._playableArea.y / 2), this._playableArea.y / 2),*/
          randomRange(-20, 20),
          randomRange(-20, 20),
        );

        const aabbLower = pos.clone().sub(Vec2(1, 1));
        const aabbUpper = pos.clone().add(Vec2(1, 1));
        const aabb = new AABB(aabbLower, aabbUpper);
        this._gameWorld.getPhysicsWorld().queryAABB(aabb, (f) => {
          canSpawn = !(
            (f.getFilterCategoryBits() & EntityCategory.STRUCTURE) == EntityCategory.STRUCTURE ||
            (f.getFilterCategoryBits() & EntityCategory.RESOURCE) == EntityCategory.RESOURCE ||
            (f.getFilterCategoryBits() & EntityCategory.BOUNDARY) == EntityCategory.BOUNDARY
          );
          return canSpawn;
        });

        if (canSpawn) break;
      }
      return CreateZombie(this._gameWorld, pos, Math.random() * Math.PI * 2);
    });

    // Tree spawner
    spawner.addSpawn(this._playableArea.length() / 3, 2, 1, 500, () => {
      // Get unoccupied pos
      let pos: Vec2 = null;
      while (true) {
        let canSpawn = true;
        pos = Vec2(
          randomRange(-(this._playableArea.x / 2), this._playableArea.x / 2),
          randomRange(-(this._playableArea.y / 2), this._playableArea.y / 2),
        );

        const aabbLower = pos.clone().sub(Vec2(1, 1));
        const aabbUpper = pos.clone().add(Vec2(1, 1));
        const aabb = new AABB(aabbLower, aabbUpper);
        this._gameWorld.getPhysicsWorld().queryAABB(aabb, (f) => {
          canSpawn = !(
            (f.getFilterCategoryBits() & EntityCategory.STRUCTURE) == EntityCategory.STRUCTURE ||
            (f.getFilterCategoryBits() & EntityCategory.RESOURCE) == EntityCategory.RESOURCE ||
            (f.getFilterCategoryBits() & EntityCategory.BOUNDARY) == EntityCategory.BOUNDARY
          );
          return canSpawn;
        });

        if (canSpawn) break;
      }
      // Create
      const angle = Math.random() * Math.PI * 2;
      const body = this._gameWorld.getPhysicsWorld().createBody({
        type: 'static',
        position: Vec2(
          randomRangeFloat(-(this._playableArea.x / 2), this._playableArea.x / 2),
          randomRangeFloat(-(this._playableArea.y / 2), this._playableArea.y / 2),
        ),
        angle,
      });
      body.createFixture({
        shape: Circle(1.25),
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

      const entity = new Entity(EntityId.WoodMine, this._gameWorld);
      entity.addComponent(new Position(body.getPosition(), body.getLinearVelocity()));
      entity.addComponent(new Rotation(body.getAngle()));
      entity.addComponent(new PhysicsBody(body));
      entity.addComponent(new Health(800));
      entity.addComponent(new Team(1));
      entity.addComponent(new Mine(false, true, false, false));
      entity.addComponent(new Minimap());
      entity.addComponent(new Observable());

      return entity;
    });
    // Stone spawner
    spawner.addSpawn(this._playableArea.length() / 3, 2, 1, 500, () => {
      // Get unoccupied pos
      let pos: Vec2 = null;
      while (true) {
        let canSpawn = true;
        pos = Vec2(
          randomRange(-(this._playableArea.x / 2), this._playableArea.x / 2),
          randomRange(-(this._playableArea.y / 2), this._playableArea.y / 2),
        );

        const aabbLower = pos.clone().sub(Vec2(1, 1));
        const aabbUpper = pos.clone().add(Vec2(1, 1));
        const aabb = new AABB(aabbLower, aabbUpper);
        this._gameWorld.getPhysicsWorld().queryAABB(aabb, (f) => {
          canSpawn = !(
            (f.getFilterCategoryBits() & EntityCategory.STRUCTURE) == EntityCategory.STRUCTURE ||
            (f.getFilterCategoryBits() & EntityCategory.RESOURCE) == EntityCategory.RESOURCE ||
            (f.getFilterCategoryBits() & EntityCategory.BOUNDARY) == EntityCategory.BOUNDARY
          );
          return canSpawn;
        });

        if (canSpawn) break;
      }
      // Create
      const angle = Math.random() * Math.PI * 2;
      const body = this._gameWorld.getPhysicsWorld().createBody({
        type: 'static',
        position: Vec2(
          randomRangeFloat(-(this._playableArea.x / 2), this._playableArea.x / 2),
          randomRangeFloat(-(this._playableArea.y / 2), this._playableArea.y / 2),
        ),
        angle,
      });
      body.createFixture({
        shape: Circle(1.25),
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

      const entity = new Entity(EntityId.StoneMine, this._gameWorld);
      entity.addComponent(new Position(body.getPosition(), body.getLinearVelocity()));
      entity.addComponent(new Rotation(body.getAngle()));
      entity.addComponent(new PhysicsBody(body));
      entity.addComponent(new Health(800));
      entity.addComponent(new Team(1));
      entity.addComponent(new Mine(false, false, true, false));
      entity.addComponent(new Minimap());
      entity.addComponent(new Observable());

      return entity;
    });
    // FoodBush spawner
    spawner.addSpawn(this._playableArea.length() / 4, 2, 1, 500, () => {
      // Get unoccupied pos
      let pos: Vec2 = null;
      while (true) {
        let canSpawn = true;
        pos = Vec2(
          randomRange(-(this._playableArea.x / 2), this._playableArea.x / 2),
          randomRange(-(this._playableArea.y / 2), this._playableArea.y / 2),
        );

        const aabbLower = pos.clone().sub(Vec2(1, 1));
        const aabbUpper = pos.clone().add(Vec2(1, 1));
        const aabb = new AABB(aabbLower, aabbUpper);
        this._gameWorld.getPhysicsWorld().queryAABB(aabb, (f) => {
          canSpawn = !(
            (f.getFilterCategoryBits() & EntityCategory.STRUCTURE) == EntityCategory.STRUCTURE ||
            (f.getFilterCategoryBits() & EntityCategory.RESOURCE) == EntityCategory.RESOURCE ||
            (f.getFilterCategoryBits() & EntityCategory.BOUNDARY) == EntityCategory.BOUNDARY
          );
          return canSpawn;
        });

        if (canSpawn) break;
      }
      // Create
      const angle = Math.random() * Math.PI * 2;
      const body = this._gameWorld.getPhysicsWorld().createBody({
        type: 'static',
        position: Vec2(
          randomRangeFloat(-(this._playableArea.x / 2), this._playableArea.x / 2),
          randomRangeFloat(-(this._playableArea.y / 2), this._playableArea.y / 2),
        ),
        angle,
      });
      body.createFixture({
        shape: Circle(0.95),
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

      const entity = new Entity(EntityId.FoodMine, this._gameWorld);
      entity.addComponent(new Position(body.getPosition(), body.getLinearVelocity()));
      entity.addComponent(new Rotation(body.getAngle()));
      entity.addComponent(new PhysicsBody(body));
      entity.addComponent(new Health(800));
      entity.addComponent(new Team(1));
      entity.addComponent(new Mine(false, false, false, true));
      entity.addComponent(new Minimap());
      entity.addComponent(new Observable());

      return entity;
    });

    // Add timers
    //this.addSimulationInterval(this.systems[World.name].tick.bind(this.systems[World.name]), 1000 / 30);
    //this.addSimulationInterval(this.systems[Visibility.name].tick.bind(this.systems[Visibility.name]), 1000 / 10);
    this.addSimulationInterval(this.update.bind(this), 1000 / 30);
    //this.addSimulationInterval(this.gameWorld.step.bind(this.gameWorld), 1000 / 10);
  }

  public update(deltaTime: number): void {
    const t = performance.now();
    this.currentTick++;
    this._dayNightCycleTick += deltaTime;
    this._sendTick += deltaTime;
    // Tick systems
    for (let i = 0; i < this._systemsArray.length; i++) {
      this._systemsArray[i].tick(deltaTime);
    }
    const duration = this._isNight ? 60 : 120;
    // Day-night cycle
    if (this._dayNightCycleTick >= duration) {
      this._dayNightCycleTick = 0;
      this._isNight = true; //!this._isNight;
      if (true /*this._isNight*/) {
        this._zombieSpawner.spawnChance = 1;
        this._zombieSpawner.maximum = 300;
        this._zombieSpawner.spawnFrequency = 1;
      } else {
        this._zombieSpawner.spawnChance = 0.55;
        this._zombieSpawner.maximum = this._playableArea.length() / 4;
        this._zombieSpawner.spawnFrequency = 3;
      }
    }

    // Send updates if necessary
    if (this._sendTick >= this._sendRate) {
      this._sendTick = 0;

      this.broadcast(getBytes[Protocol.DayNightCycle](this._isNight, this._dayNightCycleTick / duration));
      const now = performance.now();

      // Send updates to every client
      for (let i = 0; i < this.clients.length; i++) {
        const client = this.clients[i];
        const clientData = <GameClient>client.getUserData();
        if (clientData == undefined || clientData.observing == null) continue;

        // Send update for dirty entities if there are any
        const dirty = clientData.observing.filter((e: Entity) => e.dirtyTick > this._lastSend);
        if (dirty.length > 0) {
          client.send(getBytes[Protocol.EntityUpdate](client, dirty, now - this.startTime, this._lastSend));
        }

        // Send queued messages like inventory and gold updates
        let queued;
        while ((queued = clientData.takeMessageFromQueue()) != null) {
          client.send(queued);
        }
      }

      this._lastSend = this.currentTick;
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
    const gameClient = <GameClient>client.getUserData();
    if (!gameClient) {
      debug('WARNING: Client ' + client.id + ' has no gameClient but sent a message!');
      return;
    }
    const packetId = message.readUInt8(0);
    switch (packetId) {
      case ClientProtocol.InputAngle:
        gameClient.input.angle = message.readFloatLE(1);
        break;
      case ClientProtocol.InputPrimary:
        gameClient.input.primary = message.readUInt8(1) == 1;
        gameClient.input.up = message.readUInt8(2) == 1;
        gameClient.input.down = message.readUInt8(3) == 1;
        gameClient.input.left = message.readUInt8(4) == 1;
        gameClient.input.right = message.readUInt8(5) == 1;
        break;
      case ClientProtocol.SelectItem:
        if (gameClient.controlling == null) break;
        const equipment = <Equipment>gameClient.controlling.getComponent(Equipment);
        const inventory = <Inventory>gameClient.controlling.getComponent(Inventory);
        if (!inventory || !equipment) break;

        const item = inventory.getItemById(message.readUInt32LE(1));
        if (!item) break;

        if (item.type == ItemType.Hand) equipment.hand = item;
        else if (item.type == ItemType.Hat) equipment.hat = item;

        break;
      case ClientProtocol.SelectUpgrade:
        if (gameClient.controlling == null) break;
        const upgrade = <ItemUpgrade>gameClient.controlling.getComponent(ItemUpgrade);
        upgrade.upgrade(message.readUInt16LE(1));
        break;
      case ClientProtocol.ChatMessage:
        if (gameClient.controlling == null) break;

        let t = '';
        const len = message.readUInt16LE(1);
        for (let i = 0; i < len; i++) {
          t += String.fromCharCode(message.readUInt16LE(3 + i * 2));
        }

        const chatMessage = <ChatMessage>gameClient.controlling.getComponent(ChatMessage);
        chatMessage.text = t; // todo check if theres ChatMessage component?
        break;
      case ClientProtocol.Respawn: {
        if (gameClient.controlling != null) return;
        this.spawnPlayer(gameClient);
        break;
      }
      case ClientProtocol.RespawnWithReward: {
        if (gameClient.controlling != null) return;
        this.spawnPlayer(gameClient);
        // noinspection JSObjectNullOrUndefined
        (<Level>gameClient.controlling.getComponent(Level)).points = gameClient.respawnRewardExp;
        break;
      }
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

    gameClient.queueMessage('size', getBytes[Protocol.WorldSize](this._playableArea));

    this.spawnPlayer(gameClient);
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

  private spawnPlayer(gameClient: GameClient): void {
    const entity = createPlayer(this._gameWorld, Vec2.zero(), 0, gameClient);
    const health = <Health>entity.getComponent(Health);
    health.on('damage', (amount: number, source: Entity) => {
      if (health.isDead) {
        gameClient.controlling = null;
        const levelComponent = <Level>entity.getComponent(Level);
        gameClient.respawnRewardExp = levelComponent.totalPoints / 2;

        gameClient.queueMessage(
          'death',
          getBytes[Protocol.Death](EntityId[source.id], Level.calculateLevel(gameClient.respawnRewardExp)),
        );
      }
    });

    gameClient.queueMessage('alive', getBytes[Protocol.Alive]());
    gameClient.controlling = entity;
    gameClient.cameraFollow(entity);
  }

  private addSystem(system: System) {
    this.systems[system.constructor.name] = system;
    this._systemsArray.push(system);
  }

  public getComponentsOfType(c: string): Component[] {
    return this.componentCache[c] || [];
  }
}
