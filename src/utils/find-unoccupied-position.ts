import { AABB, Vec2 } from 'planck-js';
import { randomRange } from '../utils';
import { EntityCategory } from '../protocol';
import { World } from '../systems/world';

export const findUnoccupiedPos = (
  gameWorld: World,
  maxTries: number,
  area: Vec2,
  checkForCategories: number[],
): Vec2 => {
  let pos: Vec2 = null;
  for (let i = 0; i < maxTries; i++) {
    let canSpawn = true;
    const newPos = Vec2(randomRange(-(area.x / 2), area.x / 2), randomRange(-(area.y / 2), area.y / 2));

    const aabbLower = newPos.clone().sub(Vec2(1, 1));
    const aabbUpper = newPos.clone().add(Vec2(1, 1));
    const aabb = new AABB(aabbLower, aabbUpper);
    gameWorld.getPhysicsWorld().queryAABB(aabb, (f) => {
      for (let j = 0; j < checkForCategories.length; j++) {
        const cat = checkForCategories[j];
        if ((f.getFilterCategoryBits() & cat) == cat) {
          canSpawn = false;
          return canSpawn;
        }
      }
      return canSpawn;
    });

    if (canSpawn) {
      pos = newPos;
      break;
    }
  }

  return pos;
};
