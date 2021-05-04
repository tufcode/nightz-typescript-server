import { Health } from '../components/health';
import { Animation } from '../components/animation';
import { Item } from './item';
import { FoodBag } from '../components/food-bag';
import { Entity } from '../entity';
import { Body, Box, Fixture, Vec2 } from 'planck-js';
import { PhysicsBody } from '../components/physics-body';
import { EntityCategory } from '../protocol';
import { Team } from '../components/team';
import { DamageData, DamageSource, DamageTarget } from './melee-weapon';
import { EntityId } from '../data/entity-id';
import { ItemType } from '../components/inventory';

export class Shield extends Item {
  private parentBody: Body;
  private fixture: Fixture;
  private myTeam: Team;
  public damageMultiplier = 0.1;
  public knockbackMultiplier = 0.1;

  public constructor(
    entityId: EntityId,
    type: ItemType,
    movementSpeedMultiplier: number,
    requiredStone = 0,
    requiredFood = 0,
    requiredWood = 0,
    damageMultiplier: number,
    knockbackMultiplier: number,
  ) {
    super(entityId, type, movementSpeedMultiplier, requiredStone, requiredFood, requiredWood);
    this.damageMultiplier = damageMultiplier;
    this.knockbackMultiplier = knockbackMultiplier;
  }

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
  }
}
