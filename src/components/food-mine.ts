import { Component } from './component';
import { Health } from './health';
import { Entity } from '../entity';
import { Level } from './level';
import { Gold } from './gold';
import { Inventory, ItemSlot } from './inventory';
import { Food } from './items/food';

export class FoodMine extends Component {
  public init(): void {
    const healthComponent = <Health>this.entity.getComponent(Health);
    healthComponent.isUnkillable = true;
    healthComponent.on('damage', this.OnDamage.bind(this));
  }

  public OnDamage(amount: number, source: Entity): void {
    const sourceFood = <Food>(<Inventory>source.getComponent(Inventory)).getItem(Food);
    const sourceExp = <Level>source.getComponent(Level);

    if (sourceFood != null) {
      sourceFood.amount += amount;
    }
    if (sourceExp != null) {
      sourceExp.points += 4 + amount * 0.2;
    }
  }
}
