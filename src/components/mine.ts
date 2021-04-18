import { Component } from './component';
import { Health } from './health';
import { Entity } from '../entity';
import { Level } from './level';
import { Gold } from './gold';
import { Wood } from './wood';
import { Stone } from './stone';
import { Food } from './items/food';
import { Inventory } from './inventory';

export class Mine extends Component {
  private enableGold: boolean;
  private enableWood: boolean;
  private enableStone: boolean;
  private enableFood: boolean;
  public constructor(enableGold: boolean, enableWood: boolean, enableStone: boolean, enableFood: boolean) {
    super();
    this.enableGold = enableGold;
    this.enableWood = enableWood;
    this.enableStone = enableStone;
    this.enableFood = enableFood;
  }
  public init(): void {
    const healthComponent = <Health>this.entity.getComponent(Health);
    healthComponent.on('damage', this.OnDamage.bind(this));
  }

  public OnDamage(amount: number, source: Entity): void {
    if (this.enableGold) {
      const s = <Gold>source.getComponent(Gold);

      if (s != null) {
        s.amount += amount;
      }
    }
    if (this.enableWood) {
      const s = <Wood>source.getComponent(Wood);

      if (s != null) {
        s.amount += amount;
      }
    }
    if (this.enableStone) {
      const s = <Stone>source.getComponent(Stone);

      if (s != null) {
        s.amount += amount;
      }
    }
    if (this.enableFood) {
      const s = <Food>(<Inventory>source.getComponent(Inventory)).getItem(Food);

      if (s != null) {
        s.amount += amount;
      }
    }

    const sourceExp = <Level>source.getComponent(Level);
    if (sourceExp != null) {
      sourceExp.points += 4 + amount * 0.2;
    }
  }
}
