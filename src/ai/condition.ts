import { BehaviourTree } from './behaviour-tree';

export class Condition {
  private tree: BehaviourTree;
  public yes: BehaviourTree;
  public no: BehaviourTree;

  public constructor(tree: BehaviourTree) {
    this.tree = tree;
    this.yes = new BehaviourTree();
    this.no = new BehaviourTree();
  }

  public execute(deltaTime: number): boolean {
    return true;
  }
  public _execute(deltaTime: number): void {
    if (this.execute(deltaTime)) {
      this.yes.tick(deltaTime);
    } else {
      this.no.tick(deltaTime);
    }
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
