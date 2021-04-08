import { Item } from './item';
import { Entity } from '../../entity';
import { Box, Fixture, Vec2 } from 'planck-js';
import { EntityCategory } from '../../protocol';
import { PhysicsBody } from '../physics-body';
import { ItemSlot } from '../inventory';
import { Team } from '../team';
import { Health } from '../health';
import { randomRange } from '../../utils';
import { Animation } from '../animation';
import { EntityId } from '../../data/entity-id';
import { Component } from '../component';
import { Movement } from '../movement';

export class Spike extends Component {
  private fixture: Fixture;
  private _entitiesToDamage: Health[] = [];
  private _damageTick = 0;
  private myTeam: Team;
  private attackSpeed = 2;
  private ownerEntity: Entity;
  private animationComponent: Animation;
  private bodyComponent: PhysicsBody;

  public init() {
    super.init();
    this.entity.id = EntityId.WoodenSpike;
    this.myTeam = <Team>this.entity.getComponent(Team);
  }

  public onTriggerEnter(me: Fixture, other: Fixture): void {
    if (other.isSensor()) return;
    // Get teams
    const teamComponent = <Team>(<Entity>other.getBody().getUserData()).getComponent(Team);
    // Compare teams
    if (teamComponent == null || teamComponent.id == this.myTeam.id) return;
    // Get entity health component
    const healthComponent = <Health>(<Entity>other.getBody().getUserData()).getComponent(Health);

    if (healthComponent != null) {
      // There is a health component, we can damage this entity.
      this._entitiesToDamage.push(healthComponent);
    }
  }

  public onTriggerExit(me: Fixture, other: Fixture): void {
    const healthComponent = <Health>(<Entity>other.getBody().getUserData()).getComponent(Health);

    if (healthComponent != null) {
      this._entitiesToDamage.splice(this._entitiesToDamage.indexOf(healthComponent), 1);
    }
  }

  public update(deltaTime: number) {
    // Damage colliding entities every 0.5 second
    this._damageTick += deltaTime;
    if (this._damageTick >= 1 / this.attackSpeed) {
      this._damageTick = 0;
      for (let i = 0; i < this._entitiesToDamage.length; i++) {
        const h = this._entitiesToDamage[i];
        h.damage(randomRange(10, 25), this.entity);
      }
    }
  }
}
