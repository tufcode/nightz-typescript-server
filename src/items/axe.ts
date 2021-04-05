import { Item } from './item';
import { Entity } from '../entity';
import { Position } from '../components/position';
import { Box, Fixture, Vec2 } from 'planck-js';
import { EntityCategory } from '../protocol';
import { PhysicsBody } from '../components/physics-body';
import { Inventory, ItemSlot } from '../components/inventory';
import { Team } from '../components/team';
import { Health } from '../components/health';
import { Gold } from '../components/gold';
import { randomRange } from '../utils';
import { Level } from '../components/level';

export class Axe extends Item {
  private fixture: Fixture;
  private _entitiesToDamage: Health[] = [];
  private _isAttacking: boolean;
  private _damageTick = 0;
  private myTeam: Team;
  private attackSpeed = 20; // todo cant be more than 10
  private ownerEntity: Entity;

  public constructor() {
    super('WoodenAxe', ItemSlot.Slot1);
  }

  public onEquip(entity: Entity): void {
    this.ownerEntity = entity;
    const body = (<PhysicsBody>entity.getComponent(PhysicsBody)).getBody();
    this.fixture = body.createFixture({
      shape: Box(0.4, 0.5, Vec2(0.75, 0)),
      filterCategoryBits: EntityCategory.MELEE,
      filterMaskBits: EntityCategory.STRUCTURE | EntityCategory.RESOURCE | EntityCategory.PLAYER | EntityCategory.NPC,
      isSensor: true,
    });
    this.fixture.setUserData(this.entity.objectId);
    this.myTeam = <Team>entity.getComponent(Team);
  }

  public onUnequip() {
    //(<Animation>this.ownerEntity.getComponent(Animation)).setAnimation(0, 0);
  }

  public onTriggerEnter(me: Fixture, other: Fixture): void {
    if (me.getUserData() != this.entity.objectId) return;
    // Get teams
    const teamComponent = <Team>(<Entity>other.getBody().getUserData()).getComponent(Team);
    // Compare teams
    if (teamComponent == null || teamComponent.id == this.myTeam.id) return;
    // Get entity health component
    const healthComponent = <Health>(<Entity>other.getBody().getUserData()).getComponent(Health);

    if (healthComponent != null) {
      console.log('in axe radius');
      // There is a health component, we can damage this entity.
      this._entitiesToDamage.push(healthComponent);
    }
  }

  public onTriggerExit(me: Fixture, other: Fixture): void {
    if (me.getUserData() != this.entity.objectId) return;
    const healthComponent = <Health>(<Entity>other.getBody().getUserData()).getComponent(Health);

    if (healthComponent != null) {
      console.log('no longer in axe radius ' + this.fixture.getBody().isAwake());
      this._entitiesToDamage.splice(this._entitiesToDamage.indexOf(healthComponent), 1);
    }
  }

  public primaryStart(entity: Entity): void {
    this._isAttacking = true;
    // (<Animation>entity.getComponent(Animation)).setAnimation(2, this.attackSpeed);
  }

  public primaryEnd(entity: Entity) {
    this._isAttacking = false;
    // (<Animation>entity.getComponent(Animation)).setAnimation(0, 0);
  }

  public update(deltaTime: number) {
    // Damage colliding entities every 0.5 second
    if (!this._isAttacking) {
      this._damageTick = 0;
      return;
    }
    this._damageTick += deltaTime;
    if (this._damageTick >= 1 / this.attackSpeed) {
      this._damageTick = 0;
      for (let i = 0; i < this._entitiesToDamage.length; i++) {
        const h = this._entitiesToDamage[i];
        h.damage(randomRange(5, 20), this.ownerEntity);
      }
    }
  }
}
