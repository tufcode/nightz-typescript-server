import { Component } from './component';
import { Entity } from '../entity';
import { Body } from 'planck-js';
import { PositionAndRotation } from './position-and-rotation';

export class Team extends Component {
  public team: number;

  public constructor(team: number) {
    super();
    this.team = team;
  }
}
