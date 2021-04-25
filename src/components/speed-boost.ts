import { Entity } from '../entity';
import { Body, Fixture, Vec2 } from 'planck-js';
import { EntityCategory } from '../protocol';
import { Team } from './team';
import { Health } from './health';
import { EntityId } from '../data/entity-id';
import { Component } from './component';
import { PhysicsBody } from './physics-body';

export class SpeedBoost extends Component {
  private myTeam: Team;
  private _bodiesToBoost: Body[] = [];
  private myBody: Body;

  public init(): void {
    super.init();
    this.myTeam = <Team>this.entity.getComponent(Team);
    this.myBody = (<PhysicsBody>this.entity.getComponent(PhysicsBody)).getBody();
  }

  public onTriggerEnter(me: Fixture, other: Fixture): void {
    if (other.isSensor()) return;
    // Add to list
    this._bodiesToBoost.push(other.getBody());
  }

  public onTriggerExit(me: Fixture, other: Fixture): void {
    if (other.isSensor()) return;
    // Remove from list
    const index = this._bodiesToBoost.indexOf(other.getBody());
    if (index != -1) this._bodiesToBoost.splice(index, 1);
  }

  public update(deltaTime: number) {
    for (let i = 0; i < this._bodiesToBoost.length; i++) {
      this._bodiesToBoost[i].applyLinearImpulse(
        this.myBody.getWorldVector(Vec2(1, 0)).mul(80),
        this._bodiesToBoost[i].getWorldCenter(),
        true,
      );
    }
  }
}
