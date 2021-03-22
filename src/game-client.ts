import { Client } from 'elsa';
import { Entity } from './entity';
import { CharacterController } from './components/character-controller';

export interface InputState {
  angle: number;
  primary: boolean;
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
}
export class ClientData {
  public observing: Entity[] = null;
  public score: number;
  public controlling: CharacterController;
  public input: InputState = { down: false, left: false, right: false, up: false, angle: 0, primary: false };
}
