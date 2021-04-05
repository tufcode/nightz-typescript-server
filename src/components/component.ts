import { Entity } from '../entity';
import { Client } from 'elsa';
import { Fixture } from 'planck-js';

export abstract class Component {
  public entity: Entity;
  public isDirty: boolean;

  public init(): void {}
  public update(deltaTime: number): void {}
  public serialize(): Buffer {
    return null;
  }
  public onDestroy(): void {}
  public onCollisionEnter(me: Fixture, other: Fixture): void {}
  public onCollisionExit(me: Fixture, other: Fixture): void {}
  public onTriggerEnter(me: Fixture, other: Fixture): void {}
  public onTriggerExit(me: Fixture, other: Fixture): void {}
}
