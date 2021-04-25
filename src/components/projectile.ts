import { Component } from './component';
import { Health } from './health';
import { Entity } from '../entity';
import { Level } from './level';
import { Gold } from './gold';
import { Inventory, ItemType } from './inventory';
import { Food } from './items/food';
import { Animation } from './animation';
import { Body, Fixture, Vec2 } from 'planck-js';
import { PhysicsBody } from './physics-body';
import { Team } from './team';
import { EntityCategory } from '../protocol';
import { EntityId } from '../data/entity-id';

export class Projectile extends Component {
  private readonly damageToPlayers: number = 1;
  private readonly damageToZombies: number = 1;
  private readonly speed: number = 1;
  public dir: Vec2;
  private body: Body;
  private myTeam: Team;
  private startPos: Vec2;
  private maxTravelDistance: number;
  public constructor(speed: number, maxTravelDistance: number, damageToPlayers: number, damageToZombies: number) {
    super();
    this.speed = speed;
    this.maxTravelDistance = maxTravelDistance;
    this.damageToPlayers = damageToPlayers;
    this.damageToZombies = damageToZombies;
  }

  public setDir(dir: Vec2): void {
    this.dir = dir.clone().mul(this.speed);
  }

  public init(): void {
    this.body = (<PhysicsBody>this.entity.getComponent(PhysicsBody)).getBody();
    this.myTeam = <Team>this.entity.getComponent(Team);
    this.startPos = this.body.getPosition().clone();
  }

  public update(deltaTime: number): void {
    this.body.applyLinearImpulse(this.dir, this.body.getWorldCenter(), true);
    if (Vec2.distance(this.startPos, this.body.getPosition()) >= this.maxTravelDistance) this.entity.destroy();
  }

  public onTriggerEnter(me: Fixture, other: Fixture): void {
    const entity = <Entity>other.getBody().getUserData();
    // Get teams
    const teamComponent = <Team>entity.getComponent(Team);
    // Compare teams
    if (teamComponent == null || !this.myTeam.isHostileTowards(teamComponent)) return;
    // Get entity health component
    const healthComponent = <Health>entity.getComponent(Health);

    if (healthComponent != null) {
      // There is a health component, we can damage this entity.
      switch (other.getFilterCategoryBits()) {
        case EntityCategory.PLAYER:
          healthComponent.damage(this.damageToPlayers, this.entity);
          this.entity.destroy();
          break;
        case EntityCategory.NPC:
          healthComponent.damage(this.damageToZombies, this.entity);
          this.entity.destroy();
          break;
        default:
          break;
      }
    }
  }
}
