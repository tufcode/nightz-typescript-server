import { Box, Circle, Vec2 } from 'planck-js';
import { EntityCategory } from '../protocol';
import { Entity } from '../entity';
import { EntityId } from '../data/entity-id';
import { Animation } from '../components/animation';
import { Position } from '../components/position';
import { Rotation } from '../components/rotation';
import { PhysicsBody } from '../components/physics-body';
import { Team } from '../components/team';
import { Health } from '../components/health';
import { Regeneration } from '../components/regeneration';
import { Movement } from '../components/movement';
import { Inventory, ItemType } from '../components/inventory';
import { Equipment } from '../components/equipment';
import { Minimap } from '../components/minimap';
import { MeleeWeapon } from '../components/items/melee-weapon';
import { Observable } from '../components/observable';
import { NameTag } from '../components/name-tag';
import { World } from '../systems/world';
import { GameClient } from '../game-client';
import { Gold } from '../components/gold';
import { Stone } from '../components/stone';
import { Wood } from '../components/wood';
import { Level } from '../components/level';
import { PlayerInput } from '../components/player-input';
import { ChatMessage } from '../components/chat-message';
import { LeaderboardEntry } from '../components/leaderboard-entry';
import { FoodBag } from '../components/food-bag';
import { Food } from '../components/items/food';
import { BuildingBlock } from '../components/items/building-block';
import { createWoodenBlock, createWoodenSpike } from '../components/items/util/create-object';
import { createMinerWooden } from './miner-wooden';
import { createSpeedBoost } from './speed-boost';
import { ItemUpgrade } from '../components/item-upgrade';
import { createWoodenTurret } from './turret-wooden';

export const createPlayer = (gameWorld: World, position: Vec2, angle: number, owner: GameClient): Entity => {
  const body = gameWorld.getPhysicsWorld().createBody({
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
  const entity = new Entity(EntityId.Player, gameWorld, owner);
  entity.addComponent(new Gold());
  entity.addComponent(new Stone());
  entity.addComponent(new Wood());
  const equipment = <Equipment>entity.addComponent(new Equipment());
  entity.addComponent(new Animation());
  entity.addComponent(new Level());
  entity.addComponent(new Team(100 + owner.client.id));
  entity.addComponent(new Position(body.getPosition(), body.getLinearVelocity()));
  entity.addComponent(new Rotation(body.getAngle()));
  entity.addComponent(new PhysicsBody(body));
  entity.addComponent(new Health(10000));
  entity.addComponent(new Regeneration(0.25));
  entity.addComponent(new Movement(1000));
  entity.addComponent(new PlayerInput());
  (<NameTag>entity.addComponent(new NameTag())).setName('Player ' + owner.client.id);
  entity.addComponent(new ChatMessage());
  entity.addComponent(new LeaderboardEntry(owner.client.id));
  entity.addComponent(new Minimap());
  entity.addComponent(new FoodBag());
  entity.addComponent(new Observable());

  owner?.addOwnedEntity(entity);

  // Add items and inventory
  const inventory = <Inventory>entity.addComponent(new Inventory());

  inventory.addItem(new Food(EntityId.Food, ItemType.Hand, 0, 0, 1));
  inventory.addItem(
    new BuildingBlock(
      EntityId.WallWooden,
      ItemType.Hand,
      0.25,
      10,
      3,
      0,
      createWoodenBlock(owner, new Team(100 + owner.client.id)),
    ),
  );
  inventory.addItem(
    new BuildingBlock(
      EntityId.SpikeWooden,
      ItemType.Hand,
      0.25,
      20,
      10,
      3,
      createWoodenSpike(owner, new Team(100 + owner.client.id)),
    ),
  );
  inventory.addItem(
    new BuildingBlock(
      EntityId.MinerWooden,
      ItemType.Hand,
      0.25,
      10,
      3,
      0,
      (world: World, position: Vec2, angle: number) => {
        return createMinerWooden(world, position, angle, owner);
      },
    ),
  );
  inventory.addItem(
    new BuildingBlock(
      EntityId.TurretWooden,
      ItemType.Hand,
      0.25,
      0,
      0,
      0,
      (world: World, position: Vec2, angle: number) => {
        return createWoodenTurret(world, position, angle, owner);
      },
    ),
  );

  const defaultHand = new MeleeWeapon(EntityId.Stick, 0, 1.5, 2, 2, 1, 4, Box(0.4, 0.5, Vec2(0.9, 0)), 1);
  const upgradeComponent = <ItemUpgrade>entity.addComponent(new ItemUpgrade());
  upgradeComponent.addPointsWhen('weapon', [2, 3, 4, 5, 6]);

  const weaponRoot = upgradeComponent.addDefaultUpgrade('weapon', 'weapon', defaultHand.entityId, () => defaultHand, 1);

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
      () => new MeleeWeapon(EntityId.SpearNormal, 1.8, 1.5, 24, 6, 3, 18, Box(0.875, 0.5, Vec2(1.4, 0)), 3),
      3,
    )
    .addUpgrade(
      EntityId.SpearGreat,
      () => new MeleeWeapon(EntityId.SpearGreat, 2, 1.75, 32, 11, 5.71428571, 31, Box(0.875, 0.5, Vec2(1.4, 0)), 3),
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

  return entity;
};
