import { Item } from './item';
import { Entity } from '../../entity';
import { Box, Fixture, Shape, Vec2 } from 'planck-js';
import { EntityCategory } from '../../protocol';
import { PhysicsBody } from '../physics-body';
import { ItemSlot } from '../inventory';
import { Team } from '../team';
import { Health } from '../health';
import { randomRange } from '../../utils';
import { Animation } from '../animation';
import { EntityId } from '../../data/entity-id';
import { NameTag } from '../name-tag';

export class MeleeWeapon extends Item {
  private fixture: Fixture;
  private _entitiesToDamage: { [key: number]: { type: number; health: Health } } = {};
  private _damageTick = 0;
  private myTeam: Team;
  private attackSpeed = 2.1; // todo cant be more than 10
  private animationComponent: Animation;
  private damageToPlayers: number;
  private damageToStructures: number;
  private damageToResources: number;
  private damageToZombies: number;
  private hitShape: Shape;
  private mass: number;
  private animationId: number;

  public constructor(
    mass: number,
    attackSpeed: number,
    damageToPlayers: number,
    damageToStructures: number,
    damageToResources: number,
    damageToZombies: number,
    hitShape: Shape,
    animationId = 2,
  ) {
    super(ItemSlot.Slot1);
    this.mass = mass;
    this.attackSpeed = attackSpeed;
    this.damageToPlayers = damageToPlayers;
    this.damageToStructures = damageToStructures;
    this.damageToResources = damageToResources;
    this.damageToZombies = damageToZombies;
    this.hitShape = hitShape;
    this.animationId = animationId;
  }

  public onEquip(): void {
    super.onEquip();

    const body = (<PhysicsBody>this.parent.getComponent(PhysicsBody)).getBody();
    this.fixture = body.createFixture({
      shape: this.hitShape,
      filterCategoryBits: EntityCategory.MELEE,
      filterMaskBits: EntityCategory.STRUCTURE | EntityCategory.RESOURCE | EntityCategory.PLAYER | EntityCategory.NPC,
      isSensor: true,
    });
    this.fixture.setUserData(this.entity.objectId);
    body.setAwake(true);
    this.myTeam = <Team>this.parent.getComponent(Team);
    this.animationComponent = <Animation>this.parent.getComponent(Animation);
  }

  public onUnequip() {
    this.fixture.getBody().destroyFixture(this.fixture);
    this.animationComponent.setAnimation(0, 0);
  }

  public onTriggerEnter(me: Fixture, other: Fixture): void {
    if (me.getUserData() != this.entity.objectId || other.isSensor()) return;
    const entity = <Entity>other.getBody().getUserData();
    // Get teams
    const teamComponent = <Team>entity.getComponent(Team);
    // Compare teams
    if (teamComponent == null || teamComponent.id == this.myTeam.id) return;
    // Get entity health component
    const healthComponent = <Health>entity.getComponent(Health);

    if (healthComponent != null) {
      // There is a health component, we can damage this entity.
      this._entitiesToDamage[entity.objectId] = { type: other.getFilterCategoryBits(), health: healthComponent };
    }
  }

  public onTriggerExit(me: Fixture, other: Fixture): void {
    if (me.getUserData() != this.entity.objectId || other.isSensor()) return;
    const entity = <Entity>other.getBody().getUserData();
    delete this._entitiesToDamage[entity.objectId];
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
      for (const key in this._entitiesToDamage) {
        const entityData = this._entitiesToDamage[key];
        switch (entityData.type) {
          case EntityCategory.PLAYER:
            entityData.health.damage(this.damageToPlayers, this.parent);
            break;
          case EntityCategory.STRUCTURE:
            entityData.health.damage(this.damageToStructures, this.parent);
            break;
          case EntityCategory.RESOURCE:
            entityData.health.damage(this.damageToResources, this.parent);
            break;
          case EntityCategory.NPC:
            entityData.health.damage(this.damageToZombies, this.parent);
            break;
          default:
            break;
        }
      }
    }
  }
}
