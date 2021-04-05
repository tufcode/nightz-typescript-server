import { System } from './system';
import GameRoom from '../game-room';
import { AI } from '../components/ai';

export class AISystem extends System {
  private room: GameRoom;

  public constructor(room: GameRoom) {
    super();
    this.room = room;
  }

  public tick(deltaTime: number): void {
    const components = <AI[]>this.room.getComponentsOfType(AI.name);
    for (let i = 0; i < components.length; i++) {
      const c = components[i];

      c.updateTargets(deltaTime);
      c.executeActions(deltaTime);
    }
  }
}
