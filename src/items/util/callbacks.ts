import { Gold } from '../../components/gold';
import { Inventory } from '../../components/inventory';

export const requireGold = (goldComponent: Gold, amount: number): boolean => {
  if (goldComponent.amount >= amount) {
    goldComponent.amount -= amount;
    return true;
  }
  return false;
};
