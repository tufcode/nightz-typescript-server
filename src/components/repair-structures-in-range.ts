import { Team } from './team';
import { Entity } from '../entity';
import { AABB, Vec2 } from 'planck-js';
import { Health } from './health';
import { ComponentIds, EntityCategory } from '../protocol';
import { Component } from './component';
import { PhysicsBody } from './physics-body';
import { EntityId } from '../data/entity-id';

export class RepairStructuresInRange extends Component {
  private _entitiesToHeal: Entity[] = [];
  private _healTick = 0;
  private _aabbTick = 0;
  private teamComponent: Team;
  private healsPerSecond: number;
  private healingAmount: number;
  private healRadius: number;

  public constructor(healsPerSecond: number, healingAmount: number, healRadius: number) {
    super();
    this.healsPerSecond = healsPerSecond;
    this.healingAmount = healingAmount;
    this.healRadius = healRadius;
  }

  public init(): void {
    this.teamComponent = <Team>this.entity.getComponent(Team);
  }

  public update(deltaTime: number): void {
    this._aabbTick += deltaTime;
    this._healTick += deltaTime;

    if (this._aabbTick >= 3) {
      this._aabbTick = 0;
      this._entitiesToHeal = [];
      const pos = (<PhysicsBody>this.entity.getComponent(PhysicsBody)).getBody().getPosition();
      const aabbLower = pos.clone().sub(Vec2(this.healRadius, this.healRadius));
      const aabbUpper = pos.clone().add(Vec2(this.healRadius, this.healRadius));
      const aabb = new AABB(aabbLower, aabbUpper);
      this.entity.world.getPhysicsWorld().queryAABB(aabb, (f) => {
        // Skip if it is not a structure
        if (f.getFilterCategoryBits() != EntityCategory.STRUCTURE) return true;

        // Get body
        const b = f.getBody();

        // Don't detect those outside the circle (we are casting a box, so...)
        const targetCenter = b.getWorldCenter();
        if (targetCenter.clone().sub(pos).length() >= this.healRadius) return true;

        const entity = <Entity>b.getUserData();

        // Do not heal other repair pads, they can not be destroyed if you do so
        if (entity.id == EntityId.RepairPad) return true;

        // Check entity team
        const teamComponent = <Team>entity.getComponent(Team);
        if (teamComponent == null || this.teamComponent.isHostileTowards(teamComponent)) return true;

        // Store it
        this._entitiesToHeal.push(entity);
      });
    }

    if (this._healTick >= 1 / this.healsPerSecond) {
      this._healTick = 0;
      for (let i = 0; i < this._entitiesToHeal.length; i++) {
        const entityHealth = <Health>this._entitiesToHeal[i].getComponent(Health);
        if (entityHealth == null) continue;

        if (entityHealth.currentHealth < entityHealth.maxHealth) {
          entityHealth.currentHealth += this.healingAmount;
        }
      }
    }
  }

  public serialize(): Buffer {
    this.isDirty = false;

    const buf = Buffer.allocUnsafe(2);
    buf.writeUInt8(ComponentIds.RepairPad, 0);
    buf.writeUInt8(this.healRadius, 1);

    return buf;
  }
}
