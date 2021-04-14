import { Component } from './component';
import { Entity } from '../entity';
import { Body } from 'planck-js';
import { Position } from './position';
import { BehaviourTree } from '../ai/behaviour-tree';
import { BehaviourNode } from '../ai/nodes/behaviour-node';

export class BetterAI extends Component {
  private nodes: BehaviourNode[] = [];

  public addNode(node: BehaviourNode): this {
    this.nodes.push(node);
    return this;
  }

  public update(deltaTime: number): void {
    for (let i = 0; i < this.nodes.length; i++) {
      this.nodes[i].execute(deltaTime);
    }
  }
}
