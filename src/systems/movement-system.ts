import { System } from './system';
import GameRoom from '../game-room';

export class MovementSystem extends System {
  private room: GameRoom;

  public constructor(room: GameRoom) {
    super();
    this.room = room;
  }

  public tick(deltaTime: number): void {
    //const components = <Movement[]>this.room.componentCache[Movement.name];
  }
}
