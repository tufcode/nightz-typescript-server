import { Health } from '../components/health';
import { Animation } from '../components/animation';
import { Item } from './item';
import { FoodBag } from '../components/food-bag';
import { Projectile } from '../components/projectile';
import { Body, Vec2 } from 'planck-js';
import { createProjectile } from '../prefabs/projectile';
import { EntityId } from '../data/entity-id';
import { PhysicsBody } from '../components/physics-body';

export class Bow extends Item {
  private _attackTick = 0;
  private attackSpeed = 100;
  private parentBody: Body;

  public onEquip() {
    super.onEquip();
    this.parentBody = (<PhysicsBody>this.parent.getComponent(PhysicsBody)).getBody();
  }

  public update(deltaTime: number): void {
    this._attackTick += deltaTime;
    if (this._primary) {
      if (this._attackTick >= 1 / this.attackSpeed) {
        this._attackTick = 0;

        const projectile = new Projectile(20, 12, 8, 80, 10, 400);
        projectile.setDir(this.parentBody.getWorldVector(Vec2(1, 0)).clone());
        createProjectile(
          EntityId.ArrowBasic,
          projectile,
          this.parent.world,
          this.parentBody
            .getWorldCenter()
            .clone()
            .add(this.parentBody.getWorldVector(Vec2(1, 0))),
          this.parentBody.getAngle(),
          this.parent.owner,
        );
      }
    }
  }
}
