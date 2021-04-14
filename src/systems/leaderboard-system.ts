import { System } from './system';
import { performance } from 'perf_hooks';
import { getBytes, Protocol } from '../protocol';
import GameRoom from '../game-room';
import { Entity } from '../entity';
import { Observable } from '../components/observable';
import { Client } from 'elsa';
import { GameClient } from '../game-client';
import { Component } from '../components/component';
import { LeaderboardEntry } from '../components/leaderboard-entry';

export class LeaderboardSystem extends System {
  private room: GameRoom;
  private leaderboardUpdateTick = 0;
  private leaderboard: LeaderboardEntry[];

  public constructor(room: GameRoom) {
    super();
    this.room = room;
  }

  public tick(deltaTime: number): void {
    // Ticks
    this.leaderboardUpdateTick += deltaTime;
    if (this.leaderboardUpdateTick >= 1) {
      // Update leaderboard
      this.leaderboardUpdateTick = 0;
      const entries = <LeaderboardEntry[]>this.room.getComponentsOfType(LeaderboardEntry.name);
      this.leaderboard = entries.sort((a, b) => b.getPoints() - a.getPoints()).slice(0, 9);
      this.room.broadcast(getBytes[Protocol.Leaderboard](this.leaderboard));
    }
  }
}
