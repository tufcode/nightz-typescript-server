import { Item } from './item';
import { Entity } from '../entity';
import { Body, Box, Fixture, Shape, Vec2 } from 'planck-js';
import { EntityCategory } from '../protocol';
import { PhysicsBody } from '../components/physics-body';
import { ItemType } from '../components/inventory';
import { Team } from '../components/team';
import { Health } from '../components/health';
import { randomRange } from '../utils';
import { Animation } from '../components/animation';
import { EntityId } from '../data/entity-id';
import { NameTag } from '../components/name-tag';
import { Shield } from './shield';

export enum DamageSourceType {
  MELEE,
  RANGED,
  TOUCH,
}

export interface DamageEffect {
  damage: number;
  knockbackForce: number;
}

export interface DamageTarget {
  source: DamageSource;
  body: Body;
  health: Health;
  amount: number;
  knockbackForce: number;
  data: { [key: string]: any };
  effects: { [key: string]: (damage: number, knockbackForce: number) => DamageEffect };
}

export class DamageSource {
  public targets: { [key: number]: DamageTarget } = {};
  public fixture: Fixture;
  public entity: Entity;
  public type: DamageSourceType;

  public constructor(fixture: Fixture, entity: Entity, type: DamageSourceType) {
    this.fixture = fixture;
    this.entity = entity;
    this.type = type;
  }
}

export class MeleeWeapon extends Item {
  private fixture: Fixture;
  private _entitiesToDamage: { [key: number]: { type: number; health: Health; body: Body } } = {};
  private _damageTick = 0;
  private myTeam: Team;
  private attackSpeed = 1;
  private animationComponent: Animation;
  private damageToPlayers: number;
  private damageToStructures: number;
  private damageToResources: number;
  private damageToZombies: number;
  private hitShape: Shape;
  private mass: number;
  private animationId: number;
  private parentBody: Body;
  private knockbackForce: number;
  private source: DamageSource;

  public constructor(
    entityId: EntityId,
    movementSpeedMultiplier: number,
    attackSpeed: number,
    damageToPlayers: number,
    damageToStructures: number,
    damageToResources: number,
    damageToZombies: number,
    knockbackForce: number,
    hitShape: Shape,
    animationId = 2,
  ) {
    super(entityId, ItemType.Hand, movementSpeedMultiplier);
    this.attackSpeed = attackSpeed;
    this.damageToPlayers = damageToPlayers;
    this.damageToStructures = damageToStructures;
    this.damageToResources = damageToResources;
    this.damageToZombies = damageToZombies;
    this.knockbackForce = knockbackForce;
    this.hitShape = hitShape;
    this.animationId = animationId;
  }

  public onEquip(): void {
    super.onEquip();

    this.parentBody = (<PhysicsBody>this.parent.getComponent(PhysicsBody)).getBody();
    this.fixture = this.parentBody.createFixture({
      shape: this.hitShape,
      filterCategoryBits: EntityCategory.MELEE,
      filterMaskBits: EntityCategory.STRUCTURE | EntityCategory.RESOURCE | EntityCategory.PLAYER | EntityCategory.NPC,
      isSensor: true,
    });

    if (!this.source) {
      this.source = new DamageSource(this.fixture, this.parent, DamageSourceType.MELEE);
    } else {
      this.source.fixture = this.fixture;
      this.source.entity = this.parent;
    }

    this.fixture.setUserData(this.source);
    this.parentBody.setAwake(true);
    this.myTeam = <Team>this.parent.getComponent(Team);
    this.animationComponent = <Animation>this.parent.getComponent(Animation);
  }

  public onUnequip(): void {
    this.source.fixture = null;
    this.parentBody.destroyFixture(this.fixture);
    this.animationComponent.setAnimation(0, 0);
  }

  public onTriggerEnter(me: Fixture, other: Fixture): void {
    const myData = me.getUserData();
    if (!(myData instanceof DamageSource) || (<DamageSource>myData).entity.objectId != this.parent.objectId) return;

    const entity = <Entity>other.getBody().getUserData();
    // Get teams
    const teamComponent = <Team>entity.getComponent(Team);
    // Compare teams
    if (teamComponent == null || teamComponent.id == this.myTeam.id) return;
    // Get entity health component
    const healthComponent = <Health>entity.getComponent(Health);

    if (healthComponent != null) {
      // There is a health component, we can damage this entity.
      // Get damage
      const categoryInfo = this.getCategoryDamage(other);

      if (categoryInfo[0] == 0) {
        return;
      }

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

  public onTriggerExit(me: Fixture, other: Fixture): void {
    const myData = me.getUserData();
    if (!(myData instanceof DamageSource) || (<DamageSource>myData).entity.objectId != this.parent.objectId) return;
    const entity = <Entity>other.getBody().getUserData();
    delete this.source.targets[entity.objectId];
  }

  public setPrimary(b: boolean) {
    if (!this._primary && b) {
      this.animationComponent.setAnimation(this.animationId, this.attackSpeed);
    } else if (this._primary && !b) {
      this.animationComponent.setAnimation(0, 0);
    }
    super.setPrimary(b);
  }

  public update(deltaTime: number) {
    // Damage colliding entities every 0.5 second
    if (!this._primary) {
      this._damageTick = 0;
      return;
    }

    this._damageTick += deltaTime;
    if (this._damageTick >= 1 / this.attackSpeed) {
      this._damageTick = 0;
      for (const key in this.source.targets) {
        const target = this.source.targets[key];

        let amount = target.amount;
        let knockbackForce = target.knockbackForce;
        for (const key in target.effects) {
          const effect = target.effects[key](amount, knockbackForce);
          amount = effect.damage;
          knockbackForce = effect.knockbackForce;
        }

        target.health.damage(amount, this.parent);
        // Apply knockback
        target.body.applyLinearImpulse(
          Vec2.sub(target.body.getPosition(), this.parentBody.getPosition()).mul(knockbackForce),
          target.body.getWorldCenter(),
          true,
        );
      }
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
      case EntityCategory.RESOURCE:
        return [this.damageToResources, 0, effects];
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
