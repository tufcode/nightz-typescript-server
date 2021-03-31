import { Gold } from '../../components/gold';
import { Inventory } from '../../components/inventory';

export const requireGold = (inventory: Inventory, amount: number): boolean => {
  if (inventory.gold >= amount) {
    inventory.gold -= amount;
    return true;
  }
  return false;
};
