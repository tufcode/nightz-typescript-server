import { Component } from './component';
import { Health } from './health';
import { Entity } from '../entity';
import { Inventory } from './inventory';

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
    if (sourceInventory != null) {
      sourceInventory.gold += amount * 5;
    }
  }
}
