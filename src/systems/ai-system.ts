import { System } from './system';
import GameRoom from '../game-room';
import { AI } from '../components/ai';
import { BetterAI } from '../components/better-ai';

export class AISystem extends System {
  private room: GameRoom;

  public constructor(room: GameRoom) {
    super();
    this.room = room;
  }

  public tick(deltaTime: number): void {
    const components = <BetterAI[]>this.room.getComponentsOfType(BetterAI.name);
    for (let i = 0; i < components.length; i++) {
      const c = components[i];

      c.update(deltaTime);
    }
  }
}
