import { Action } from './action';
import { Condition } from './condition';
import { Type } from '../types';

export class BehaviourTree {
  private children: (Action | Condition)[] = [];

  public tick(deltaTime: number): void {
    for (let i = 0; i < this.children.length; i++) {
      this.children[i]._execute(deltaTime);
    }
  }

  public addCondition(condition: Type<Condition>): Condition {
    const c = new condition();
    this.children.push(c);
    return c;
  }

  public addAction(action: Type<Action>): BehaviourTree {
    const a = new action();
    this.children.push(a);
    return this;
  }
}
