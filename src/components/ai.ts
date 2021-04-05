import { Component } from './component';
import { Team } from './team';
import { Entity } from '../entity';
import { Circle, Fixture, Shape, Vec2 } from 'planck-js';
import { Health } from './health';
import { EntityCategory } from '../protocol';
import { Position } from './position';
import { clamp, randomRange } from '../utils';
import { PhysicsBody } from './physics-body';

export class AI extends Component {
  protected detectionShape: Shape;
  protected targets: Entity[] = [];
  protected activeTarget: Entity;
  protected bodyComponent: PhysicsBody;
  protected teamComponent: Team;

  public init(): void {
    super.init();

    this.teamComponent = <Team>this.entity.getComponent(Team);
    this.bodyComponent = <PhysicsBody>this.entity.getComponent(PhysicsBody);
    if (this.bodyComponent == null) {
      console.error('Movement requires PhysicsBody component.');
    }

    const body = this.bodyComponent.getBody();
    body.createFixture({
      shape: this.detectionShape,
      filterCategoryBits: EntityCategory.SENSOR,
      filterMaskBits: EntityCategory.STRUCTURE | EntityCategory.PLAYER,
      isSensor: true,
    });
  }

  public onTriggerEnter(me: Fixture, other: Fixture): void {
    // Check entity team
    const teamComponent = <Team>(<Entity>other.getBody().getUserData()).getComponent(Team);
    if (teamComponent == null || !this.teamComponent.isHostileTowards(teamComponent)) return;
    // Add as a potential target
    const entity = <Entity>other.getBody().getUserData();
    if (entity.getComponent(Health) != null) this.addTarget(<Entity>other.getBody().getUserData());
  }

  public onTriggerExit(me: Fixture, other: Fixture): void {
    // Remove as a potential target
    this.removeTarget(<Entity>other.getBody().getUserData());
  }

  public addTarget(entity: Entity): void {
    this.targets.push(entity);
  }

  public removeTarget(entity: Entity): void {
    if (this.activeTarget != null && entity.objectId == this.activeTarget.objectId) {
      this.activeTarget = null;
    }

    const i = this.targets.indexOf(entity);

    if (i != -1) this.targets.splice(i, 1);
  }

  public updateTargets(deltaTime: number): void {}

  public executeActions(deltaTime: number): void {}
}
