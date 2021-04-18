import { System } from './system';
import { Entity } from '../entity';
import { World } from './world';
import { Type } from '../types';
import { Vec2 } from 'planck-js';

export class SpawnerData {
  public maximum: number;
  public spawnFrequency: number;
  public spawnChance: number;
  public spawnAmount: number;
  public spawnCallback: () => Entity;
  public _spawned: Entity[] = [];
  public _spawnTick = 0;
}

export class Spawner extends System {
  private list: SpawnerData[] = [];
  public addSpawn(
    maximum: number,
    spawnFrequency: number,
    spawnChance: number,
    spawnAmount: number,
    spawnCallback: () => Entity,
  ): SpawnerData {
    const d = new SpawnerData();
    d.maximum = maximum;
    d.spawnAmount = spawnAmount;
    d.spawnCallback = spawnCallback;
    d.spawnChance = spawnChance;
    d.spawnFrequency = spawnFrequency;
    this.list.push(d);
    return d;
  }
  public stop(): void {}

  public tick(deltaTime: number): void {
    for (let i = 0; i < this.list.length; i++) {
      const data = this.list[i];

      data._spawnTick += deltaTime;
      if (data._spawnTick >= data.spawnFrequency) {
        data._spawnTick = 0;
        if (Math.random() <= data.spawnChance) {
          const amountToSpawn = Math.min(data.spawnAmount, data.maximum - data._spawned.length);
          for (let i = 0; i < amountToSpawn; i++) {
            const entity = data.spawnCallback();
            data._spawned.push(entity);
            entity.on('destroy', () => {
              // todo possible memory leak?
              data._spawned.splice(data._spawned.indexOf(entity), 1);
            });
          }
        }
      }
    }
  }
}
