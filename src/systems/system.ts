import { Component } from '../components/component';

export class System {
  public start() {}
  public stop() {}
  public tick(deltaTime: number): void {}

  public register(component: Component) {}

  public unregister(component: Component) {}
}
