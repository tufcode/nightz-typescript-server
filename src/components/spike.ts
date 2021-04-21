import { Item } from './items/item';
import { Entity } from '../entity';
import { Box, Fixture, Vec2 } from 'planck-js';
import { EntityCategory } from '../protocol';
import { PhysicsBody } from './physics-body';
import { ItemSlot } from './inventory';
import { Team } from './team';
import { Health } from './health';
import { randomRange } from '../utils';
import { Animation } from './animation';
import { EntityId } from '../data/entity-id';
import { Component } from './component';
import { Movement } from './movement';
import { GameClient } from '../game-client';
// todo zombies avoid taking danage, make this have some sort of trigger to make sure they get damaged, or make zombies less smart
export class Spike extends Component {
  private fixture: Fixture;
  private _entitiesToDamage: { type: number; health: Health }[] = [];
  private _damageTick = 0;
  private myTeam: Team;
  private attackSpeed = 2;
  private ownerEntity: Entity;
  private animationComponent: Animation;
  private bodyComponent: PhysicsBody;

  public init() {
    super.init();
    this.entity.id = EntityId.SpikeWooden;
    this.myTeam = <Team>this.entity.getComponent(Team);
    this.ownerEntity = this.entity.owner.cameraFollowing; // todo this will crash everything upon player death :)
  }

  public onCollisionEnter(me: Fixture, other: Fixture): void {
    if (other.isSensor()) return;
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

  public onCollisionExit(me: Fixture, other: Fixture): void {
    if (other.isSensor()) return;
    const entity = <Entity>other.getBody().getUserData();
    delete this._entitiesToDamage[entity.objectId];
  }

  public update(deltaTime: number) {
    this._damageTick += deltaTime;
    if (this._damageTick >= 1 / this.attackSpeed) {
      this._damageTick = 0;
      for (const key in this._entitiesToDamage) {
        const entityData = this._entitiesToDamage[key];
        switch (entityData.type) {
          case EntityCategory.PLAYER:
            entityData.health.damage(10, this.ownerEntity);
            break;
          case EntityCategory.STRUCTURE:
            entityData.health.damage(10, this.ownerEntity);
            break;
          case EntityCategory.NPC:
            entityData.health.damage(10, this.ownerEntity);
            break;
          default:
            break;
        }
      }
    }
  }
}
