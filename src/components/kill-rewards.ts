import { Component } from './component';
import { Entity } from '../entity';
import { Body } from 'planck-js';
import { Position } from './position';
import { Health } from './health';
import { Inventory } from './inventory';
import { Level } from './level';
import { Gold } from './gold';
import { GameClient } from '../game-client';

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
        let actualSource = source;
        if (source.owner != null) {
          // todo maybe make it so it returns if owner is null
          if (source.owner.controlling) {
            actualSource = source.owner.controlling;
          }
        }
        // Give gold and exp to the killer
        const enemyGold = <Gold>actualSource.getComponent(Gold);
        if (enemyGold != null) enemyGold.amount += this.gold;

        const enemyExperience = <Level>actualSource.getComponent(Level);
        if (enemyExperience != null) enemyExperience.points += this.exp;
      }
    });
  }
}
