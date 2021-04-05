import { Component } from './component';
import { Entity } from '../entity';
import { Body } from 'planck-js';
import { Position } from './position';

export class Team extends Component {
  public id: number;

  public constructor(team: number) {
    super();
    this.id = team;
  }

  public isHostileTowards(other: Team): boolean {
    return this.id != other.id;
  }
}
