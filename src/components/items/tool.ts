import { Item } from './item';
import { Entity } from '../../entity';
import { Box, Fixture, Vec2 } from 'planck-js';
import { EntityCategory } from '../../protocol';
import { PhysicsBody } from '../physics-body';
import { ItemSlot } from '../inventory';
import { Team } from '../team';
import { Health } from '../health';
import { randomRange } from '../../utils';
import { Animation } from '../animation';
import { EntityId } from '../../data/entity-id';

export class Tool extends Item {
  private fixture: Fixture;
  private _entitiesToDamage: Health[] = [];
  private _damageTick = 0;
  private myTeam: Team;
  private attackSpeed = 2; // todo cant be more than 10
  private animationComponent: Animation;

  public constructor() {
    super(ItemSlot.Slot1);
  }

  public init() {
    super.init();
  }

  public onEquip(): void {
    const body = (<PhysicsBody>this.parent.getComponent(PhysicsBody)).getBody();
    this.fixture = body.createFixture({
      shape: Box(0.3, 0.5, Vec2(0.8, 0)),
      filterCategoryBits: EntityCategory.MELEE,
      filterMaskBits: EntityCategory.STRUCTURE | EntityCategory.RESOURCE | EntityCategory.PLAYER | EntityCategory.NPC,
      isSensor: true,
    });
    this.fixture.setUserData(this.entity.objectId);
    body.setAwake(true);
    this.myTeam = <Team>this.parent.getComponent(Team);
    this.animationComponent = <Animation>this.parent.getComponent(Animation);
  }

  public onUnequip() {
    this.fixture.getBody().destroyFixture(this.fixture);
    this.animationComponent.setAnimation(0, 0);
  }

  public onTriggerEnter(me: Fixture, other: Fixture): void {
    if (me.getUserData() != this.entity.objectId) return;
    // Get teams
    const teamComponent = <Team>(<Entity>other.getBody().getUserData()).getComponent(Team);
    // Compare teams
    if (teamComponent == null || teamComponent.id == this.myTeam.id) return;
    // Get entity health component
    const healthComponent = <Health>(<Entity>other.getBody().getUserData()).getComponent(Health);

    if (healthComponent != null) {
      // There is a health component, we can damage this entity.
      this._entitiesToDamage.push(healthComponent);
    }
  }

  public onTriggerExit(me: Fixture, other: Fixture): void {
    if (me.getUserData() != this.entity.objectId) return;
    const healthComponent = <Health>(<Entity>other.getBody().getUserData()).getComponent(Health);

    if (healthComponent != null) {
      this._entitiesToDamage.splice(this._entitiesToDamage.indexOf(healthComponent), 1);
    }
  }

  public setPrimary(b: boolean) {
    if (!this._primary && b) {
      this.animationComponent.setAnimation(2, this.attackSpeed);
    } else if (this._primary && !b) {
      this.animationComponent.setAnimation(0, 0);
    }
    super.setPrimary(b);
  }

  public update(deltaTime: number) {
    // Damage colliding entities every 0.5 second
    if (!this._primary) {
      this._damageTick = 0;
      return;
    }
    this._damageTick += deltaTime;
    if (this._damageTick >= 1 / this.attackSpeed) {
      this._damageTick = 0;
      for (let i = 0; i < this._entitiesToDamage.length; i++) {
        const h = this._entitiesToDamage[i];
        let dmg = randomRange(5, 10);
        if (h.entity.id == EntityId.Zombie) dmg += 30;
        h.damage(dmg, this.parent);
      }
    }
  }
}
