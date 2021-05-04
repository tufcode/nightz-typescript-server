import { Entity } from '../entity';
import { Body, Fixture, Vec2 } from 'planck-js';
import { EntityCategory } from '../protocol';
import { Team } from './team';
import { Health } from './health';
import { EntityId } from '../data/entity-id';
import { Component } from './component';
import { PhysicsBody } from './physics-body';

export class DecayOnOwnerLeave extends Component {
  private health: Health;

  public init(): void {
    this.health = <Health>this.entity.getComponent(Health);
  }

  public update(deltaTime: number): void {
    if (!this.entity.owner) return;
    if (!this.entity.owner.client.isConnected) {
      this.health.damage(this.health.maxHealth * 0.1 * deltaTime, null);
    }
  }
}
