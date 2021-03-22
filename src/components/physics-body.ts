import { Component } from './component';
import { Entity } from '../entity';
import { Body } from 'planck-js';
import { ComponentIds } from '../protocol';
import { Client } from 'elsa';

export class PhysicsBody extends Component {
  public entity: Entity;
  private readonly body: Body;

  constructor(body: Body) {
    super();
    this.body = body;
  }

  public update(deltaTime: number) {
    if (this.body.isAwake()) this.entity._isDirty = true;
  }

  public serialize(client: Client, initialization?: boolean): Buffer {
    const buf = Buffer.allocUnsafe(21);
    const pos = this.body.getPosition();
    const vel = this.body.getLinearVelocity();
    let index = 0;
    // Packet Id
    buf.writeUInt8(ComponentIds.PhysicsBody, index);
    index += 1;
    // Position
    buf.writeFloatLE(pos.x, index);
    index += 4;
    buf.writeFloatLE(pos.y, index);
    index += 4;
    // Velocity
    buf.writeFloatLE(vel.x, index);
    index += 4;
    buf.writeFloatLE(vel.y, index);
    index += 4;
    // Rotation
    buf.writeFloatLE(this.body.getAngle(), index);

    return buf;
  }

  public getBody(): Body {
    return this.body;
  }
}
