import { Component } from './component';
import { Entity } from '../entity';
import { Body } from 'planck-js';

export class PhysicsBody extends Component {
  public entity: Entity;
  private readonly body: Body;

  public constructor(body: Body) {
    super();
    this.body = body;
  }

  public getBody(): Body {
    return this.body;
  }
}
