import { BehaviourNode, Status } from './behaviour-node';
import { Body, Fixture, Vec2 } from 'planck-js';
import { BehaviourTree } from '../behaviour-tree';
import { Movement } from '../../components/movement';
import { Equipment } from '../../components/equipment';

export class GetCurrentHand extends BehaviourNode {
  private equipment: Equipment;

  public constructor(tree: BehaviourTree, equipment: Equipment) {
    super(tree);
    this.equipment = equipment;
  }

  public execute(deltaTime: number): Status {
    this.tree.data['currentHand'] = this.equipment.hand;

    return Status.SUCCESS;
  }
}
