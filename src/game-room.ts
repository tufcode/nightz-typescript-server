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
import { AABB, Box, Circle, Vec2 } from 'planck-js';
import { Team } from './components/team';
import { createWoodenBlock, createWoodenSpike } from './components/items/util/create-object';
import { Tiers } from './data/tiers';
import { Spawner, SpawnerData } from './systems/spawner';
import { randomRange, randomRangeFloat } from './utils';
import { Mine } from './components/mine';
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
import { LeaderboardEntry } from './components/leaderboard-entry';
import { LeaderboardSystem } from './systems/leaderboard-system';
import { ChatMessage } from './components/chat-message';
import { Minimap } from './components/minimap';
import { Zone } from './components/zone';
import { ObservableByAll } from './components/observable-by-all';
import { BehaviourTree } from './ai/behaviour-tree';
import { Sequence } from './ai/nodes/sequence';
import { GetObjectsInRadius } from './ai/nodes/get-objects-in-radius';
import { GetClosestObject } from './ai/nodes/get-closest-object';
import { GetPosition } from './ai/nodes/get-position';
import { InRange } from './ai/nodes/in-range';
import { Inverted } from './ai/nodes/inverted';
import { Chase } from './ai/nodes/chase';
import { RotateTowards } from './ai/nodes/rotate-towards';
import { BetterAI } from './components/better-ai';
import { Selector } from './ai/nodes/selector';
import { Flee } from './ai/nodes/flee';
import { RotateAway } from './ai/nodes/rotate-away';
import { WaitSeconds } from './ai/nodes/wait-seconds';
import { GetCurrentHand } from './ai/nodes/get-current-hand';
import { ActivateHandItem } from './ai/nodes/activate-hand-item';
import { Regeneration } from './components/regeneration';
import { CreateZombie } from './entities/zombie';
import { Stone } from './components/stone';
import { Wood } from './components/wood';
import { createMinerWooden } from './entities/miner-wooden';
import { FoodBag } from './components/food-bag';

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
    this.addSystem(new Spawner());
    this.addSystem(this._gameWorld);

    {
      const entity = new Entity(EntityId.Zone, this._gameWorld);
      entity.addComponent(new Position(Vec2.zero(), Vec2.zero()));
      entity.addComponent(new Minimap());
      entity.addComponent(new ObservableByAll());
      const zone = <Zone>entity.addComponent(new Zone());
      zone.setData('Ground Zero', Vec2(3000, 3000), 102, 0, 0);
    }

    const spawner = <Spawner>this.systems[Spawner.name];
    // Zombie spawner
    this._zombieSpawner = spawner.addSpawn(this._playableArea.length() / 4, 3, 0.55, 10, () => {
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
    // Day-night cycle
    if (this._dayNightCycleTick >= 1) {
      this._dayNightCycleTick = 0;
      this._isNight = true; //!this._isNight;
      if (/*this._isNight*/ false) {
        this._zombieSpawner.spawnChance = 0.9;
        this._zombieSpawner.maximum = this._playableArea.length() / 2;
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

      this.broadcast(getBytes[Protocol.DayNightCycle](this._isNight, this._dayNightCycleTick / 60));
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

    const body = this._gameWorld.getPhysicsWorld().createBody({
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
    const entity = new Entity(EntityId.Player, this._gameWorld, gameClient);
    entity.addComponent(new Gold());
    entity.addComponent(new Stone());
    entity.addComponent(new Wood());
    const equipment = <Equipment>entity.addComponent(new Equipment());
    entity.addComponent(new Animation());
    entity.addComponent(new Inventory());
    entity.addComponent(new Level());
    entity.addComponent(new Team(100 + client.id));
    entity.addComponent(new Position(body.getPosition(), body.getLinearVelocity()));
    entity.addComponent(new Rotation(body.getAngle()));
    entity.addComponent(new PhysicsBody(body));
    entity.addComponent(new Health(100000));
    entity.addComponent(new Regeneration(0.25));
    entity.addComponent(new Movement(1000));
    entity.addComponent(new PlayerInput());
    (<NameTag>entity.addComponent(new NameTag())).setName('Player ' + client.id);
    entity.addComponent(new ChatMessage());
    entity.addComponent(new LeaderboardEntry(client.id));
    entity.addComponent(new Minimap());
    entity.addComponent(new FoodBag());
    entity.addComponent(new Observable());

    // Add items and inventory
    const inventory = <Inventory>entity.addComponent(new Inventory());

    (<GameClient>client.getUserData()).addOwnedEntity(entity); // todo add for items
    (<GameClient>client.getUserData()).cameraFollowing = entity;

    inventory.addItem(new Food(EntityId.Food, ItemSlot.Slot2, 0, 0, 1));
    inventory.addItem(
      new BuildingBlock(
        EntityId.WallWooden,
        ItemSlot.Slot3,
        0.25,
        10,
        3,
        0,
        createWoodenBlock(gameClient, new Team(100 + client.id)),
      ),
    );
    inventory.addItem(
      new BuildingBlock(
        EntityId.SpikeWooden,
        ItemSlot.Slot2,
        0.25,
        20,
        10,
        3,
        createWoodenSpike(gameClient, new Team(100 + client.id)),
      ),
    );
    inventory.addItem(
      new BuildingBlock(
        EntityId.MinerWooden,
        ItemSlot.Slot2,
        0.25,
        10,
        3,
        0,
        (world: World, position: Vec2, angle: number) => {
          return createMinerWooden(world, position, angle, gameClient);
        },
      ),
    );

    const defaultHand = new MeleeWeapon(EntityId.Stick, 0, 1.5, 2, 2, 1, 4, Box(0.4, 0.5, Vec2(0.9, 0)), 1);
    const upgradeComponent = <ItemUpgrade>entity.addComponent(new ItemUpgrade());
    upgradeComponent.addPointsWhen('weapon', [2, 3, 4, 5, 6]);

    const weaponRoot = upgradeComponent.addDefaultUpgrade(
      'weapon',
      'weapon',
      defaultHand.entityId,
      () => defaultHand,
      1,
    );

    // Sword upgrade tree
    weaponRoot
      .addUpgrade(
        EntityId.SwordBasic,
        () => new MeleeWeapon(EntityId.SwordBasic, 0.5, 2, 6, 3, 1, 12, Box(0.65, 0.75, Vec2(1.15, 0.5)), 4),
        2,
      )
      .addUpgrade(
        EntityId.SwordNormal,
        () => new MeleeWeapon(EntityId.SwordNormal, 0.5, 2.25, 10, 6, 2, 18, Box(0.65, 0.75, Vec2(1.15, 0.5)), 4),
        3,
      )
      .addUpgrade(
        EntityId.SwordGreat,
        () => new MeleeWeapon(EntityId.SwordGreat, 0.5, 2.5, 15, 11, 4, 36, Box(0.65, 0.75, Vec2(1.15, 0.5)), 4),

        4,
      );

    // Axe upgrade tree
    weaponRoot
      .addUpgrade(
        EntityId.AxeBasic,
        () => new MeleeWeapon(EntityId.AxeBasic, 1.6, 1.5, 4, 8, 4, 8, Box(0.5, 0.75, Vec2(1, -0.2)), 1),
        2,
      )
      .addUpgrade(
        EntityId.AxeNormal,
        () => new MeleeWeapon(EntityId.AxeNormal, 1.8, 1.75, 8, 12, 8, 12, Box(0.5, 0.75, Vec2(1, -0.2)), 1),
        3,
      )
      .addUpgrade(
        EntityId.AxeGreat,
        () => new MeleeWeapon(EntityId.AxeGreat, 2, 2, 16, 24, 16, 24, Box(0.625, 0.875, Vec2(1.25, -0.1)), 1),
        4,
      );

    // Spear upgrade tree
    weaponRoot
      .addUpgrade(
        EntityId.SpearBasic,
        () => new MeleeWeapon(EntityId.SpearBasic, 1.6, 1.25, 16, 3, 1.6, 12, Box(0.875, 0.5, Vec2(1.4, 0)), 3),
        2,
      )
      .addUpgrade(
        EntityId.SpearNormal,
        () => new MeleeWeapon(EntityId.SwordNormal, 1.8, 1.5, 24, 6, 3, 18, Box(0.875, 0.5, Vec2(1.4, 0)), 3),
        3,
      )
      .addUpgrade(
        EntityId.SpearGreat,
        () => new MeleeWeapon(EntityId.SwordGreat, 2, 1.75, 32, 11, 5.71428571, 31, Box(0.875, 0.5, Vec2(1.4, 0)), 3),
        4,
      );

    // Dagger upgrade tree
    weaponRoot
      .addUpgrade(
        EntityId.DaggerBasic,
        () => new MeleeWeapon(EntityId.DaggerBasic, 0, 3, 5, 1.8, 0.8, 6, Box(0.55, 0.5, Vec2(1.05, 0)), 2),
        2,
      )
      .addUpgrade(
        EntityId.DaggerNormal,
        () => new MeleeWeapon(EntityId.DaggerNormal, 0, 3.25, 8.5, 3.5, 1.6, 10, Box(0.55, 0.5, Vec2(1.05, 0)), 2),
        3,
      )
      .addUpgrade(
        EntityId.DaggerGreat,
        () => new MeleeWeapon(EntityId.DaggerGreat, 0, 3.5, 12, 8.75, 4, 16.5, Box(0.55, 0.5, Vec2(1.05, 0)), 2),
        4,
      );

    equipment.hand = defaultHand;

    gameClient.queueMessage('size', getBytes[Protocol.WorldSize](this._playableArea));
    gameClient.queueMessage('follow', getBytes[Protocol.CameraFollow](entity.objectId));

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
    this._systemsArray.push(system);
  }

  public getComponentsOfType(c: string): Component[] {
    return this.componentCache[c] || [];
  }
}
