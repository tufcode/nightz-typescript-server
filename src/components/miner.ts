import { Component } from './component';
import { Health } from './health';
import { Entity } from '../entity';
import { Level } from './level';
import { Gold } from './gold';
import { Inventory, ItemType } from './inventory';
import { Food } from './items/food';
import { Animation } from './animation';

export class Miner extends Component {
  private readonly goldPerSecond: number = 1;
  private readonly animationSpeed: number = 1;
  public constructor(goldPerSecond: number, animationSpeed: number) {
    super();
    this.goldPerSecond = goldPerSecond;
    this.animationSpeed = animationSpeed;
  }

  public init(): void {
    super.init();
    (<Animation>this.entity.getComponent(Animation)).setAnimation(6, this.animationSpeed); // todo stop animation on owner death
  }

  public update(deltaTime: number): void {
    if (this.entity.owner.controlling == null) return; // Can't mine when owner is dead

    const goldComponent = <Gold>this.entity.owner.controlling.getComponent(Gold);

    goldComponent.amount += this.goldPerSecond * deltaTime;
  }
}
