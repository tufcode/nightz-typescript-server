import { Component } from './component';
import { Entity } from '../entity';
import { PhysicsBody } from './physics-body';
import { Circle, Fixture, Vec2 } from 'planck-js';
import { PositionAndRotation } from './position-and-rotation';
import { Health } from './health';
import { EntityCategory } from '../protocol';

export class AIController extends Component {
  public entity: Entity;

  private bodyComponent: PhysicsBody;
  private syncComponent: PositionAndRotation;

  private speed = 40;
  private targets: Entity[] = [];
  private activeTarget: Entity;

  public init(): void {
    this.syncComponent = <PositionAndRotation>this.entity.getComponent(PositionAndRotation);
    this.bodyComponent = <PhysicsBody>this.entity.getComponent(PhysicsBody);
    if (this.bodyComponent == null || this.syncComponent == null) {
      console.error('CharacterController requires PhysicsBody and PositionAndRotation components.');
    }

    const body = this.bodyComponent.getBody();
    body.createFixture({
      shape: Circle(5),
      filterCategoryBits: body.getFixtureList().getFilterCategoryBits(),
      filterMaskBits: EntityCategory.PLAYER | EntityCategory.STRUCTURE,
      isSensor: true,
    });
  }

  public onTriggerEnter(me: Fixture, other: Fixture): void {
    // Add as a potential target
    const entity = <Entity>other.getBody().getUserData();
    if (entity.getComponent(Health) != null) this.addTarget(<Entity>other.getBody().getUserData());
  }

  public onTriggerExit(me: Fixture, other: Fixture): void {
    // Remove as a potential target
    this.removeTarget(<Entity>other.getBody().getUserData());
  }

  public onCollisionEnter(me: Fixture, other: Fixture): void {
    // Get entity health component
    const healthComponent = <Health>(<Entity>other.getBody().getUserData()).getComponent(Health);

    if (healthComponent != null) {
      // There is a health component, we can damage this entity.
      healthComponent.currentHealth -= 10;
    }
  }

  public update(): void {
    const body = this.bodyComponent.getBody();
    const targetVelocity = Vec2.zero();

    const hasMoveInput = this.activeTarget != null;

    if (hasMoveInput) {
      const angle = body.getAngle();
      targetVelocity.x = Math.cos(angle);
      targetVelocity.y = Math.sin(angle);

      targetVelocity.normalize();
      targetVelocity.mul(this.speed);

      const currentVelocity = body.getLinearVelocity();
      const velocityChange = Vec2.sub(targetVelocity, currentVelocity);

      body.applyLinearImpulse(velocityChange, body.getWorldCenter(), true);

      // Set angle
      const myPosition = body.getPosition();
      const targetPosition = (<PositionAndRotation>this.activeTarget.getComponent(PositionAndRotation)).position;
      const targetAngle = Math.atan2(targetPosition.y - myPosition.y, targetPosition.x - myPosition.x);
      if (targetAngle.toFixed(2) != body.getAngle().toFixed(2)) {
        body.setAngle(targetAngle);
        this.syncComponent.angle = body.getAngle();
      }
    }

    if (body.isAwake()) {
      this.syncComponent.position = body.getPosition();
    }
  }

  public addTarget(entity: Entity): void {
    this.targets.push(entity);
    this.activeTarget = entity;
  }

  public removeTarget(entity: Entity): void {
    return;
  }
}
