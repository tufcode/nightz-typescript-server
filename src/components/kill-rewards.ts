import { Component } from './component';
import { Entity } from '../entity';
import { Body } from 'planck-js';
import { Position } from './position';
import { Health } from './health';
import { Inventory } from './inventory';
import { Level } from './level';
import { Gold } from './gold';

export class KillRewards extends Component {
  public exp = 0;
  public gold = 0;

  public constructor(exp: number, gold: number) {
    super();
    this.exp = exp;
    this.gold = gold;
  }

  public init(): void {
    const health = <Health>this.entity.getComponent(Health);
    health.on('damage', (amount: number, source: Entity) => {
      if (health.isDead) {
        // Give gold and exp to the killer
        const enemyGold = <Gold>source.getComponent(Gold);
        if (enemyGold != null) enemyGold.amount += this.gold;

        const enemyExperience = <Level>source.getComponent(Level);
        if (enemyExperience != null) enemyExperience.points += this.exp;
      }
    });
  }
}
