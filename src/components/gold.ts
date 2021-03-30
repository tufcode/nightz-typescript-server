import { Component } from './component';
import { Item } from '../items/item';
import { ComponentIds, getBytes, Protocol } from '../protocol';
import { Client } from 'elsa/src/index';
import { BuildingBlock } from '../items/building-block';

export class Gold extends Component {
  public get amount(): number {
    return this._amount;
  }

  public set amount(value: number) {
    this._amount = value;
    if (this.entity.owner != null) {
      console.log('sendgold');
      this.entity.owner.send(getBytes[Protocol.GoldInfo](this.amount));
    }
  }
  private _amount = 0;
}
