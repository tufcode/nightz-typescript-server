import { Entity } from '../entity';
import { Fixture } from 'planck-js';
import { EntityCategory } from '../protocol';
import { Team } from './team';
import { Health } from './health';
import { EntityId } from '../data/entity-id';
import { Component } from './component';

export class DamageOnTouch extends Component {
  private _entitiesToDamage: { type: number; health: Health }[] = [];
  private _damageTick = 0;
  private myTeam: Team;
  private attackSpeed = 2;

  public init(): void {
    super.init();
    this.entity.id = EntityId.SpikeWooden;
    this.myTeam = <Team>this.entity.getComponent(Team);
  }

  public onCollisionEnter(me: Fixture, other: Fixture): void {
    if (other.isSensor()) return;
    const entity = <Entity>other.getBody().getUserData();
    // Get teams
    const teamComponent = <Team>entity.getComponent(Team);
    // Compare teams
    if (teamComponent == null || teamComponent.id == this.myTeam.id) return; // todo id of undefined
    // Get entity health component
    const healthComponent = <Health>entity.getComponent(Health);

    if (healthComponent != null) {
      // There is a health component, we can damage this entity.
      this._entitiesToDamage[entity.objectId] = { type: other.getFilterCategoryBits(), health: healthComponent };
    }
  }

  public onCollisionExit(me: Fixture, other: Fixture): void {
    if (other.isSensor()) return;
    const entity = <Entity>other.getBody().getUserData();
    delete this._entitiesToDamage[entity.objectId];
  }

  public update(deltaTime: number): void {
    this._damageTick += deltaTime;
    if (this._damageTick >= 1 / this.attackSpeed) {
      this._damageTick = 0;
      for (const key in this._entitiesToDamage) {
        const entityData = this._entitiesToDamage[key];
        switch (entityData.type) {
          case EntityCategory.PLAYER:
            entityData.health.damage(10, this.entity);
            break;
          case EntityCategory.STRUCTURE:
            entityData.health.damage(10, this.entity);
            break;
          case EntityCategory.NPC:
            entityData.health.damage(10, this.entity);
            break;
          default:
            break;
        }
      }
    }
  }
}
