import { Component } from './component';
import { NameTag } from './name-tag';
import { Level } from './level';

export class LeaderboardEntry extends Component {
  private level: Level;
  private nameTag: NameTag;
  private readonly id: number;

  public constructor(id: number) {
    super();
    this.id = id;
  }

  public init(): void {
    this.level = <Level>this.entity.getComponent(Level);
    this.nameTag = <NameTag>this.entity.getComponent(NameTag);
  }

  public getPoints(): number {
    return this.level.totalPoints;
  }

  public getName(): string {
    return this.nameTag != null ? this.nameTag.name : 'unknown';
  }

  public getId(): number {
    return this.id;
  }
}
