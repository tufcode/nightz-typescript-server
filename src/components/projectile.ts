import { Component } from './component';
import { Health } from './health';
import { Entity } from '../entity';
import { Level } from './level';
import { Gold } from './gold';
import { Inventory, ItemType } from './inventory';
import { Food } from '../items/food';
import { Animation } from './animation';
import { Body, Fixture, Vec2 } from 'planck-js';
import { PhysicsBody } from './physics-body';
import { Team } from './team';
import { EntityCategory } from '../protocol';
import { EntityId } from '../data/entity-id';
import { DamageEffect, DamageSource, DamageSourceType } from '../items/melee-weapon';
import { Shield } from '../items/shield';

export class Projectile extends Component {
  private readonly damageToPlayers: number = 1;
  private readonly damageToZombies: number = 1;
  private readonly speed: number = 1;
  public dir: Vec2;
  private body: Body;
  private myTeam: Team;
  private startPos: Vec2;
  private maxTravelDistance: number;
  private source: DamageSource;
  private knockbackForce: number;
  private damageToStructures: number;
  private hit: boolean;
  private force: Vec2;
  public constructor(
    speed: number,
    maxTravelDistance: number,
    damageToPlayers: number,
    damageToZombies: number,
    damageToStructures: number,
    knockbackForce: number,
  ) {
    super();
    this.speed = speed;
    this.maxTravelDistance = maxTravelDistance;
    this.damageToPlayers = damageToPlayers;
    this.damageToZombies = damageToZombies;
    this.damageToStructures = damageToStructures;
    this.knockbackForce = knockbackForce;
  }

  public setDir(dir: Vec2): void {
    this.dir = dir.clone();
    this.force = this.dir.clone().mul(this.speed);
  }

  public init(): void {
    this.body = (<PhysicsBody>this.entity.getComponent(PhysicsBody)).getBody();
    this.myTeam = <Team>this.entity.getComponent(Team);
    this.startPos = this.body.getPosition().clone();

    this.source = new DamageSource(null, this.entity, DamageSourceType.RANGED);

    this.body.getFixtureList().setUserData(this.source);
    this.body.setLinearVelocity(this.force);
  }

  public update(deltaTime: number): void {
    // noinspection LoopStatementThatDoesntLoopJS
    for (const key in this.source.targets) {
      const target = this.source.targets[key];

      let amount = target.amount;
      let knockbackForce = target.knockbackForce;
      for (const key in target.effects) {
        const effect = target.effects[key](amount, knockbackForce);
        amount = effect.damage;
        knockbackForce = effect.knockbackForce;
      }

      target.health.damage(amount, this.entity);
      // Apply knockback
      target.body.applyLinearImpulse(this.dir.clone().mul(knockbackForce), target.body.getWorldCenter(), true);
      this.entity.destroy();
      return;
    }
    if (Vec2.distance(this.startPos, this.body.getPosition()) >= this.maxTravelDistance) this.entity.destroy();
  }

  public onTriggerEnter(me: Fixture, other: Fixture): void {
    if (this.hit) return;
    const entity = <Entity>other.getBody().getUserData();
    // Get teams
    const teamComponent = <Team>entity.getComponent(Team);
    // Compare teams
    if (teamComponent == null || !this.myTeam.isHostileTowards(teamComponent)) return;
    // Get entity health component
    const healthComponent = <Health>entity.getComponent(Health);

    if (healthComponent != null) {
      // There is a health component, we can damage this entity.
      // Get damage
      const categoryInfo = this.getCategoryDamage(other);

      if (categoryInfo[0] == 0) {
        return;
      }
      this.hit = true;

      this.source.targets[entity.objectId] = {
        amount: categoryInfo[0],
        knockbackForce: categoryInfo[1],
        source: this.source,
        health: healthComponent,
        body: other.getBody(),
        data: {},
        effects: categoryInfo[2],
      };
    }
  }

  private getCategoryDamage(
    fixture: Fixture,
    effects: { [key: string]: (damage: number, knockbackForce: number) => DamageEffect } = {},
  ): [number, number, { [key: string]: (damage: number, knockbackForce: number) => DamageEffect }] {
    switch (fixture.getFilterCategoryBits()) {
      case EntityCategory.PLAYER:
        return [this.damageToPlayers, this.knockbackForce, effects];
      case EntityCategory.STRUCTURE:
        return [this.damageToStructures, 0, effects];
      case EntityCategory.NPC:
        return [this.damageToZombies, this.knockbackForce, effects];
      case EntityCategory.SHIELD:
        const shield = <Shield>fixture.getUserData();
        effects['SH' + shield.parent.objectId] = shield.effect;
        return this.getCategoryDamage(fixture.getNext(), effects);
      default:
        return [0, 0, effects];
    }
  }
}
