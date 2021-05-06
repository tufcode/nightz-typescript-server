import { Component } from './component';
import { Body, Vec2 } from 'planck-js';
import { createProjectile } from '../prefabs/projectile';
import { EntityId } from '../data/entity-id';
import { Projectile } from './projectile';
import { PhysicsBody } from './physics-body';
import { Team } from './team';
import * as planck from 'planck-js';

export class Turret extends Component {
  private readonly damageToPlayers: number = 1;
  private readonly damageToZombies: number = 1;
  private readonly attackSpeed: number = 1;
  private body: Body;
  private _fireTick = 0;
  private myTeam: Team;
  private damageToStructures: number;
  private knockbackForce: number;
  private projectileEntity: EntityId;
  private projectileSpeed: number;
  private projectileRange: number;
  public constructor(
    attackSpeed: number,
    damageToPlayers: number,
    damageToZombies: number,
    damageToStructures: number,
    knockbackForce: number,
    projectileSpeed: number,
    projectileRange: number,
    projectileEntity: EntityId,
  ) {
    super();
    this.attackSpeed = attackSpeed;
    this.damageToPlayers = damageToPlayers;
    this.damageToZombies = damageToZombies;
    this.damageToStructures = damageToStructures;
    this.knockbackForce = knockbackForce;
    this.projectileSpeed = projectileSpeed;
    this.projectileRange = projectileRange;
    this.projectileEntity = projectileEntity;
  }

  public init(): void {
    this.body = (<PhysicsBody>this.entity.getComponent(PhysicsBody)).getBody();
    this.myTeam = <Team>this.entity.getComponent(Team);
  }

  public update(deltaTime: number) {
    this._fireTick += deltaTime;
  }

  public fireAt(pos: Vec2): void {
    const targetAngle = Math.atan2(pos.y - this.body.getWorldCenter().y, pos.x - this.body.getWorldCenter().x);
    this.body.setAngle(targetAngle);

    if (this._fireTick < 1 / this.attackSpeed) {
      return;
    }
    this._fireTick = 0;

    const projectile = new Projectile(
      this.projectileSpeed,
      this.projectileRange,
      this.damageToPlayers,
      this.damageToZombies,
      this.damageToStructures,
      this.knockbackForce,
    );
    projectile.setDir(this.body.getWorldVector(Vec2(1, 0)).clone());
    createProjectile(
      this.projectileEntity,
      projectile,
      this.entity.world,
      this.body
        .getWorldCenter()
        .clone()
        .add(this.body.getWorldVector(Vec2(0.75, 0))),
      this.body.getAngle(),
      planck.Box(0.275, 0.15),
      this.myTeam.id,
      this.entity.owner,
    );
  }
}
