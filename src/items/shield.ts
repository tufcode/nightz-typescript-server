import { Health } from '../components/health';
import { Animation } from '../components/animation';
import { Item } from './item';
import { FoodBag } from '../components/food-bag';
import { Entity } from '../entity';
import { Body, Box, Fixture, Vec2 } from 'planck-js';
import { PhysicsBody } from '../components/physics-body';
import { EntityCategory } from '../protocol';
import { Team } from '../components/team';
import { DamageEffect, DamageSource, DamageTarget } from './melee-weapon';

export class Shield extends Item {
  private parentHealth: Health;
  private parentBody: Body;
  private fixture: Fixture;
  private myTeam: Team;
  private sources: DamageSource[] = [];

  public onEquip(): void {
    super.onEquip();

    this.parentBody = (<PhysicsBody>this.parent.getComponent(PhysicsBody)).getBody();
    this.fixture = this.parentBody.createFixture({
      shape: Box(0.4, 1, Vec2(0.65, 0)),
      filterCategoryBits: EntityCategory.SHIELD,
      filterMaskBits: EntityCategory.BULLET | EntityCategory.MELEE,
      isSensor: true,
    });
    this.fixture.setUserData(this);
    this.parentBody.setAwake(true);
    this.myTeam = <Team>this.parent.getComponent(Team);
  }

  public onUnequip(): void {
    this.parentBody.destroyFixture(this.fixture);
    this.sources = [];
  }

  public effect(damage: number, knockbackForce: number): DamageEffect {
    return { damage: damage / 4, knockbackForce: knockbackForce / 4 };
  }
}
