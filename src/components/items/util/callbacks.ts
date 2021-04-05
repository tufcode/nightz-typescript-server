import { Gold } from '../../gold';
import { Inventory } from '../../inventory';

export const requireGold = (goldComponent: Gold, amount: number): boolean => {
  if (goldComponent.amount >= amount) {
    goldComponent.amount -= amount;
    return true;
  }
  return false;
};
