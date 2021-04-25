import { System } from './system';
import { performance } from 'perf_hooks';
import { getBytes, Protocol } from '../protocol';
import GameRoom from '../game-room';
import { Entity } from '../entity';
import { Observable } from '../components/observable';
import { Client } from 'elsa';
import { GameClient } from '../game-client';
import { Component } from '../components/component';
import { Level } from '../components/level';
import { AI } from '../components/ai';
import { ChatMessage } from '../components/chat-message';
import { Gold } from '../components/gold';
import { Wood } from '../components/wood';
import { Stone } from '../components/stone';
import { FoodBag } from '../components/food-bag';
import { Health } from '../components/health';

export class ChatSystem extends System {
  private room: GameRoom;

  public constructor(room: GameRoom) {
    super();
    this.room = room;
  }

  public tick(deltaTime: number): void {
    const componentsCM = <ChatMessage[]>this.room.getComponentsOfType(ChatMessage.name);
    for (let i = 0; i < componentsCM.length; i++) {
      const c = componentsCM[i];
      c.update(deltaTime);

      if (c.text != '') {
        if (c.clearTick == 0) {
          this.handleChatMessage(deltaTime, c);
        } else {
          c.clearTick += deltaTime;
          if (c.clearTick >= 3) {
            c.text = '';
            c.clearTick = 0;

            c.entity.dirtyTick = this.room.currentTick;
            c.entity.componentBuffers[ChatMessage.name] = { t: this.room.currentTick, buffer: c.serialize() };
          }
        }
      }
    }
  }

  private handleChatMessage(deltaTime: number, c: ChatMessage): void {
    if (c.text.startsWith('/')) {
      const split = c.text.split('/')[1].split(' ');
      this.handleChatCommand(c.entity.owner, split[0], split);
      c.text = '';
    } else {
      c.clearTick += deltaTime;

      c.entity.dirtyTick = this.room.currentTick;
      c.entity.componentBuffers[ChatMessage.name] = { t: this.room.currentTick, buffer: c.serialize() };
    }
  }

  private handleChatCommand(gameClient: GameClient, command: string, split: string[]): void {
    if (!gameClient) return;
    switch (command) {
      case 'exp': {
        const amount = Number.parseInt(split[1], 10);
        if (isNaN(amount) || !gameClient.controlling) return;
        const level = <Level>gameClient.controlling.getComponent(Level);

        if (!level) return;
        level.points += amount;
        break;
      }
      case 'resources': {
        const wood = <Wood>gameClient.controlling.getComponent(Wood);
        if (wood != null) wood.amount = 100000;
        const stone = <Wood>gameClient.controlling.getComponent(Stone);
        if (stone != null) stone.amount = 100000;
        const food = <FoodBag>gameClient.controlling.getComponent(FoodBag);
        if (food != null) food.amount = 100000;
        break;
      }
      case 'toggleImmune': {
        if (!gameClient.controlling) return;
        const health = <Health>gameClient.controlling.getComponent(Health);
        if (health != null) health.isImmune = !health.isImmune;
      }
    }
  }
}
