import { Component } from './component';
import { Entity } from '../entity';
import { Body } from 'planck-js';
import { Position } from './position';
import { BehaviourTree } from '../ai/behaviour-tree';

export class BetterAI extends Component {
  private trees: BehaviourTree[] = [];

  public addTree(tree: BehaviourTree): void {
    this.trees.push(tree);
  }

  public update(deltaTime: number): void {
    for (let i = 0; i < this.trees.length; i++) {
      this.trees[i].tick(deltaTime);
    }
  }
}
