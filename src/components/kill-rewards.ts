import { Component } from './component';
import { Entity } from '../entity';
import { Body } from 'planck-js';
import { PositionAndRotation } from './position-and-rotation';
import { Health } from './health';
import { Inventory } from './inventory';
import { Experience } from './experience';

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
        const enemyInventory = <Inventory>source.getComponent(Inventory);
        if (enemyInventory != null) enemyInventory.gold += this.gold;

        const enemyExperience = <Experience>source.getComponent(Experience);
        if (enemyExperience != null) enemyExperience.points += this.exp;
      }
    });
  }
}
