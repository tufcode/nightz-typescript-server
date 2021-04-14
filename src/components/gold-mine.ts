import { Component } from './component';
import { Health } from './health';
import { Entity } from '../entity';
import { Level } from './level';
import { Gold } from './gold';

export class GoldMine extends Component {
  public init(): void {
    const healthComponent = <Health>this.entity.getComponent(Health);
    healthComponent.isUnkillable = true;
    healthComponent.on('damage', this.OnDamage.bind(this));
  }

  public OnDamage(amount: number, source: Entity): void {
    const sourceGold = <Gold>source.getComponent(Gold);
    const sourceExp = <Level>source.getComponent(Level);

    if (sourceGold != null) {
      sourceGold.amount += amount;
    }
    if (sourceExp != null) {
      sourceExp.points += 4 + amount * 0.2;
    }
  }
}
