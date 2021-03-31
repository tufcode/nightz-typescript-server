import { System } from './system';
import { Entity } from '../entity';
import { World } from './world';
import { Type } from '../types';
import { Vec2 } from 'planck-js';

export class Spawner extends System {
  private maximum: number;
  private minimum: number;
  private spawnFrequency: number;
  private spawnChance: number;
  private spawnAmount: number;
  private spawnCallback: () => Entity;
  private spawned: Entity[] = [];

  private _spawnTick = 0;

  public constructor(
    maximum: number,
    minimum: number,
    spawnFrequency: number,
    spawnChance: number,
    spawnAmount: number,
    spawnCallback: () => Entity,
  ) {
    super();
    this.maximum = maximum;
    this.minimum = minimum;
    this.spawnFrequency = spawnFrequency;
    this.spawnChance = spawnChance;
    this.spawnAmount = spawnAmount;
    this.spawnCallback = spawnCallback;
  }
  public stop(): void {}

  public update(deltaTime: number): void {
    this._spawnTick += deltaTime;
    if (this._spawnTick >= this.spawnFrequency) {
      this._spawnTick = 0;
      if (Math.random() <= this.spawnChance) {
        const amountToSpawn = Math.min(this.spawnAmount, this.maximum - this.spawned.length);
        for (let i = 0; i < amountToSpawn; i++) {
          const entity = this.spawnCallback();
          this.spawned.push(entity);
          entity.on('destroy', () => {
            this.spawned.splice(this.spawned.indexOf(entity), 1);
          });
        }
      }
    }
  }
}
