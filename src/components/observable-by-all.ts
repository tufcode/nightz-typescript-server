import { Client } from 'elsa';
import { Component } from './component';
import { Position } from './position';
import { GameClient } from '../game-client';
import { Item, ItemState } from './items/item';
import { Vec2 } from 'planck-js';
import GameRoom from '../game-room';
import { VisibilitySystem } from '../systems/visibility-system';
import { Observable } from './observable';

export class ObservableByAll extends Observable {
  public init(): void {}

  public onCheckObserver(client: Client): boolean {
    return true;
  }
}
