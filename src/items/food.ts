import { Health } from '../components/health';
import { Animation } from '../components/animation';
import { Item } from './item';
import { FoodBag } from '../components/food-bag';

export class Food extends Item {
  private foodComponent: FoodBag;
  public set isEating(value: boolean) {
    this._isEating = value;
    if (value) this.animationComponent.setAnimation(1, 3);
    else this.animationComponent.setAnimation(0, 0);
  }
  private _isEating: boolean;
  private eatTick = 0;
  private animationComponent: Animation;

  private parentHealth: Health;

  public onEquip() {
    super.onEquip();
    this.parentHealth = <Health>this.parent.getComponent(Health);
    this.foodComponent = <FoodBag>this.parent.getComponent(FoodBag);
    this.animationComponent = <Animation>this.parent.getComponent(Animation);
  }

  public setPrimary(b: boolean): void {
    if (!this._primary && b) {
      this.onConsume();
    } else if (this._isEating) this.isEating = false;
    super.setPrimary(b);
  }

  protected onConsume(): void {
    if (this.foodComponent.amount >= 1) {
      this.eatTick = 0;
      this.isEating = true;
    }
  }

  public update(deltaTime: number): void {
    if (this._isEating) {
      this.eatTick += deltaTime;
      if (this.eatTick >= 1) {
        this.isEating = false;
        this.foodComponent.amount--;
        this.parentHealth.currentHealth += 10;
      }
    }
  }
}
