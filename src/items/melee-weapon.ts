import { Item } from './item';
import { Entity } from '../entity';
import { Body, Fixture, Shape, Vec2 } from 'planck-js';
import { EntityCategory } from '../protocol';
import { PhysicsBody } from '../components/physics-body';
import { ItemType } from '../components/inventory';
import { Team } from '../components/team';
import { Health } from '../components/health';
import { Animation } from '../components/animation';
import { EntityId } from '../data/entity-id';
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
  shieldEffect?: (damage: number, knockbackForce: number) => DamageEffect;
  source: DamageSource;
  body: Body;
  health: Health;
  team: Team;
  amount: number;
  knockbackForce: number;
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
    const otherCategory = <EntityCategory>other.getFilterCategoryBits();
    const myData = me.getUserData();
    if (!(myData instanceof DamageSource) || (<DamageSource>myData).entity.objectId != this.parent.objectId) return;
    if (
      other.getFilterCategoryBits() != EntityCategory.PLAYER &&
      other.getFilterCategoryBits() != EntityCategory.STRUCTURE &&
      other.getFilterCategoryBits() != EntityCategory.NPC &&
      other.getFilterCategoryBits() != EntityCategory.RESOURCE &&
      other.getFilterCategoryBits() != EntityCategory.SHIELD
    )
      return;

    const entity = <Entity>other.getBody().getUserData();
    // Get teams
    const teamComponent = <Team>entity.getComponent(Team);
    // Compare teams
    if (teamComponent == null) return;
    if (teamComponent.id == this.myTeam.id) {
      if (otherCategory != EntityCategory.STRUCTURE) {
        return;
      }
    }
    // Get entity health component
    const healthComponent = <Health>entity.getComponent(Health);

    if (healthComponent != null) {
      // There is a health component, we can damage this entity.

      // Add shieldEffect if it is a shield
      if (other.getFilterCategoryBits() == EntityCategory.SHIELD) {
        const shield = <Shield>other.getUserData();
        if (this.source.targets[entity.objectId]) {
          this.source.targets[entity.objectId].shieldEffect = shield.effect;
        } else {
          this.source.targets[entity.objectId] = {
            team: undefined,
            amount: 0,
            body: undefined,
            health: undefined,
            knockbackForce: 0,
            source: undefined,
            shieldEffect: shield.effect,
          };
        }
        return;
      }

      // Get damage
      const categoryInfo = this.getCategoryDamage(other);

      if (categoryInfo[0] == 0) {
        return;
      }

      // Add target
      if (this.source.targets[entity.objectId]) {
        // A shield effect(?) already exists, overwrite other data
        this.source.targets[entity.objectId].amount = categoryInfo[0];
        this.source.targets[entity.objectId].knockbackForce = categoryInfo[1];
        this.source.targets[entity.objectId].source = this.source;
        this.source.targets[entity.objectId].health = healthComponent;
        this.source.targets[entity.objectId].body = other.getBody();
      } else {
        // No shield effect here.
        this.source.targets[entity.objectId] = {
          amount: categoryInfo[0],
          knockbackForce: categoryInfo[1],
          source: this.source,
          health: healthComponent,
          body: other.getBody(),
          team: teamComponent,
        };
      }
    }
  }

  public onTriggerExit(me: Fixture, other: Fixture): void {
    const myData = me.getUserData();
    if (!(myData instanceof DamageSource) || (<DamageSource>myData).entity.objectId != this.parent.objectId) return;
    if (
      other.getFilterCategoryBits() != EntityCategory.PLAYER &&
      other.getFilterCategoryBits() != EntityCategory.STRUCTURE &&
      other.getFilterCategoryBits() != EntityCategory.NPC &&
      other.getFilterCategoryBits() != EntityCategory.RESOURCE &&
      other.getFilterCategoryBits() != EntityCategory.SHIELD
    )
      return;

    const entity = <Entity>other.getBody().getUserData();
    if (!this.source.targets[entity.objectId]) return;

    if (other.getFilterCategoryBits() == EntityCategory.SHIELD) {
      this.source.targets[entity.objectId].shieldEffect = undefined;
      // Return only if health is not null. We never collided with player so we can delete the target only if health is null.
      if (this.source.targets[entity.objectId].health != null) return;
    }

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
        if (target.amount == 0) continue;

        let damage = target.amount;
        let knockbackForce = target.knockbackForce;
        if (
          target.team.id == this.myTeam.id &&
          target.body.getFixtureList().getFilterCategoryBits() == EntityCategory.STRUCTURE
        ) {
          damage = target.health.maxHealth / 5;
        } else if (target.shieldEffect) ({ damage, knockbackForce } = target.shieldEffect(damage, knockbackForce));

        target.health.damage(damage, this.parent);
        // Apply knockback
        target.body.applyLinearImpulse(
          Vec2.sub(target.body.getPosition(), this.parentBody.getPosition()).mul(knockbackForce),
          target.body.getWorldCenter(),
          true,
        );
      }
    }
  }

  private getCategoryDamage(fixture: Fixture): [number, number] {
    switch (fixture.getFilterCategoryBits()) {
      case EntityCategory.PLAYER:
        return [this.damageToPlayers, this.knockbackForce];
      case EntityCategory.STRUCTURE:
        return [this.damageToStructures, 0];
      case EntityCategory.RESOURCE:
        return [this.damageToResources, 0];
      case EntityCategory.NPC:
        return [this.damageToZombies, this.knockbackForce];
      default:
        return [0, 0];
    }
  }
}
