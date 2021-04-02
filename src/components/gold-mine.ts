import { Component } from './component';
import { Health } from './health';
import { Entity } from '../entity';
import { Inventory } from './inventory';
import { Experience } from './experience';

export class GoldMine extends Component {
  public init(): void {
    const healthComponent = <Health>this.entity.getComponent(Health);
    healthComponent.isUnkillable = true;
    healthComponent.maxHealth = 4294967295;
    healthComponent.currentHealth = 4294967295;
    healthComponent.on('damage', this.OnDamage.bind(this));
  }

  public OnDamage(amount: number, source: Entity): void {
    const sourceInventory = <Inventory>source.getComponent(Inventory);
    const sourceExp = <Experience>source.getComponent(Experience);
    if (sourceInventory != null) {
      sourceInventory.gold += Math.ceil(amount / 2);
    }
    if (sourceExp != null) {
      sourceExp.points += 4 + amount * 0.1;
    }
  }
}
