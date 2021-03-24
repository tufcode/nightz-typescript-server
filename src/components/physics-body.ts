import { Component } from './component';
import { Entity } from '../entity';
import { Body, Shape } from 'planck-js';
import { EntityCategory } from '../protocol';
import { AIController } from './ai-controller';

export class PhysicsBody extends Component {
  public entity: Entity;
  private readonly body: Body;

  public constructor(body: Body) {
    super();
    this.body = body;
  }

  public init(): void {
    this.body.setUserData(this.entity);
  }

  public getBody(): Body {
    return this.body;
  }
}
