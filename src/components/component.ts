import { Entity } from '../entity';
import { Client } from 'elsa';

export abstract class Component {
  public entity: Entity;

  public init() {}
  public update(deltaTime: number) {}
  public serialize(client: Client, initialization?: boolean): Buffer {
    return null;
  }
  public onDestroy() {}
}
