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
  public constructor(attackSpeed: number, damageToPlayers: number, damageToZombies: number) {
    super();
    this.attackSpeed = attackSpeed;
    this.damageToPlayers = damageToPlayers;
    this.damageToZombies = damageToZombies;
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

    if (this._fireTick < 0.2) {
      return;
    }
    this._fireTick = 0;

    const projectile = new Projectile(16, 10, 8, 8, 10, 20);
    projectile.setDir(this.body.getWorldVector(Vec2(1, 0)).clone());
    createProjectile(
      EntityId.TurretArrowBasic,
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
