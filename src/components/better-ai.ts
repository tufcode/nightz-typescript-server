import { Component } from './component';
import { Entity } from '../entity';
import { Body } from 'planck-js';
import { Position } from './position';
import { BehaviourTree } from '../ai/behaviour-tree';

export class BetterAI extends Component {
  private trees: { tree: BehaviourTree; executeIf: () => boolean }[] = [];

  public addTree(tree: BehaviourTree, executeIf: () => boolean): void {
    this.trees.push({ tree, executeIf });
  }

  public update(deltaTime: number) {
    for (let i = 0; i < this.trees.length; i++) {
      const t = this.trees[i];
    }
  }
}
