import { BehaviourTree } from './behaviour-tree';

export class Action {
  private tree: BehaviourTree;
  public constructor(tree: BehaviourTree) {
    this.tree = tree;
  }
  public execute(): void {}
  public _execute(): void {
    this.execute();
  }
}

// Pseudo-code time
/*
const detectionTree = new BehaviourTree({ executionCondition: RepeatingExecCondition(1000) });
detectionTree.addAction(queryNearbyPlayers)
const tree = new BehaviourTree({ executionCondition: (deltaTime) => true });
tree.addAction(findNearbyPlayers)
tree.addCondition(hasNearbyPlayers)
  .yes((childTree) => {
    childTree.addCondition(playerInRange)
      .yes((childTree) => childTree.addAction(attackPlayer))
      .no((childTree) => childTree.addAction(chasePlayer))
  })
  .no((childTree) => {})
*/
