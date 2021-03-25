import { Component } from './component';
import { Entity } from '../entity';
import { Body } from '../systems/physics2/body';

export class PhysicsBody extends Component {
  public entity: Entity;
  private readonly body: Body;

  public constructor(body: Body) {
    super();
    this.body = body;
  }

  public init(): void {
    //this.body.setUserData(this.entity);
  }

  public getBody(): Body {
    return this.body;
  }
}
