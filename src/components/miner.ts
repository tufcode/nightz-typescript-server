import { Component } from './component';
import { Health } from './health';
import { Entity } from '../entity';
import { Level } from './level';
import { Gold } from './gold';
import { Inventory, ItemSlot } from './inventory';
import { Food } from './items/food';

export class Miner extends Component {
  public update(deltaTime: number) {
    (<Gold>this.entity.owner.cameraFollowing.getComponent(Gold)).amount += 10 * deltaTime; // todo crashes on death, also add speed etc etc
  }
}
