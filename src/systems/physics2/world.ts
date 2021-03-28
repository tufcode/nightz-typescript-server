import { Body, BodyType } from './body';
import { Vector2 } from './vector2';
import * as Flatbush from 'flatbush';
import { performance } from 'perf_hooks';
import { Solver } from './solver';

interface ICell {
  bodies: Body[];
  isTested: boolean;
}

export class World {
  public bodies: Body[] = [];
  public bounds: Vector2;
  public gravity = 0;
  public gridCellSize: number;
  private _lastBodyId = 0;
  private _bounceThreshold = 0;
  private _iterations = 8;
  private _index: Flatbush;
  private _indexUpdateTick = 0;

  public constructor(bounds: Vector2, cellSize: number) {
    this.bounds = bounds;
    this.gridCellSize = cellSize;
  }

  public addBody(b: Body): void {
    b._bodyId = this._lastBodyId++;
    b._world = this;
    this.bodies.push(b);
  }

  public update(deltaTime: number): void {
    const grid: ICell[][] = [];
    this._indexUpdateTick += deltaTime;
    if (this._indexUpdateTick >= 0) {
      this._indexUpdateTick = 0;
      this._index = null;
    }

    const a = performance.now();
    if (this._index == null) {
      this._index = new Flatbush(this.bodies.length);
      let gp = 0;
      // Populate the grid
      for (let i = 0; i < this.bodies.length; i++) {
        gp++;
        const body = this.bodies[i];

        // Also reset state of bodies
        body.update(deltaTime);

        // Check edge collisions
        const minX = -(this.bounds.x / 2);
        const minY = -(this.bounds.y / 2);
        const maxX = this.bounds.x / 2;
        const maxY = this.bounds.y / 2;

        // Check for left and right
        if (body.position.x < minX + body.radius) {
          if (body.velocity.lengthSquared() >= this._bounceThreshold)
            body.velocity.x = Math.abs(body.velocity.x) * Math.min(body.restitution, 0.4);
          else body.velocity.x = 0;
          body.position.x = minX + body.radius;
        } else if (body.position.x > maxX - body.radius) {
          if (body.velocity.lengthSquared() >= this._bounceThreshold)
            body.velocity.x = -Math.abs(body.velocity.x) * Math.min(body.restitution, 0.4);
          else body.velocity.x = 0;
          body.position.x = maxX - body.radius;
        }

        // Check for bottom and top
        if (body.position.y < minY + body.radius) {
          if (body.velocity.lengthSquared() >= this._bounceThreshold)
            body.velocity.y = Math.abs(body.velocity.y) * Math.min(body.restitution, 0.4);
          else body.velocity.y = 0;
          body.position.y = minY + body.radius;
        } else if (body.position.y > maxY - body.radius) {
          if (body.velocity.lengthSquared() >= this._bounceThreshold)
            body.velocity.y = -Math.abs(body.velocity.y) * Math.min(body.restitution, 0.4);
          else body.velocity.y = 0;
          body.position.y = maxY - body.radius;
        }

        // find extremes of cells that entity overlaps
        // subtract min to shift grid to avoid negative numbers
        const bodySize = body.radius;
        const cXEntityMin = Math.floor(body.position.x - bodySize);
        const cXEntityMax = Math.floor(body.position.x + bodySize);
        const cYEntityMin = Math.floor(body.position.y - bodySize);
        const cYEntityMax = Math.floor(body.position.y + bodySize);

        this._index.add(cXEntityMin, cYEntityMin, cXEntityMax, cYEntityMax);

        // insert entity into each cell it overlaps
        // we're looping to make sure that all cells between extremes are found
        /*for (let cX = cXEntityMin; cX <= cXEntityMax; cX++) {
        gp++;
        // make sure a column exists, initialize if not to grid height length
        if (!grid[cX]) {
          grid[cX] = [];
        }

        const gridCol = grid[cX];

        // loop through each cell in this column
        for (let cY = cYEntityMin; cY <= cYEntityMax; cY++) {
          gp++;
          // ensure we have a bucket to put entities into for this cell
          if (!gridCol[cY]) {
            gridCol[cY] = { bodies: [], isTested: false };
          }

          const gridCell = gridCol[cY];
          // add body to cell
          gridCell.bodies.push(body);
        }
      }*/
      }
      this._index.finish();
    }

    let cp = 0;
    // Check for collision pairs
    const addedPairs = [];
    const pairs: Body[][] = [];

    const minX = -(this.bounds.x / 2);
    const minY = -(this.bounds.y / 2);
    const maxX = this.bounds.x / 2;
    const maxY = this.bounds.y / 2;

    let thisFrameTime = 0;
    for (let i = 0; i < this.bodies.length; i++) {
      cp++;
      const obj1 = this.bodies[i];
      const bodySize = obj1.radius;
      const cXEntityMin = Math.floor(obj1.position.x - bodySize);
      const cXEntityMax = Math.floor(obj1.position.x + bodySize);
      const cYEntityMin = Math.floor(obj1.position.y - bodySize);
      const cYEntityMax = Math.floor(obj1.position.y + bodySize);
      const possibleCollisions = this._index.search(
        cXEntityMin,
        cYEntityMin,
        cXEntityMax,
        cYEntityMax,
        (j) => this.bodies[j]._bodyId != obj1._bodyId,
      );
      for (let j = 0; j < possibleCollisions.length; j++) {
        cp++;
        //console.log('a', i, possibleCollisions[j]);
        const obj2 = this.bodies[possibleCollisions[j]];
        // This pair is already in the list
        if (addedPairs[obj1._bodyId] && addedPairs[obj1._bodyId][obj2._bodyId]) continue;

        if (addedPairs[obj1._bodyId]) addedPairs[obj1._bodyId].push(obj2._bodyId);
        else addedPairs[obj1._bodyId] = [obj2._bodyId];
        if (addedPairs[obj2._bodyId]) addedPairs[obj2._bodyId].push(obj1._bodyId);
        else addedPairs[obj2._bodyId] = [obj1._bodyId];

        // Compare object1 with object2
        if (World.canCollide(obj1, obj2)) {
          obj1._futureCollidingBodies.push(obj2);
          obj2._futureCollidingBodies.push(obj1);
          // Add pairs
          pairs.push([obj1, obj2]);
        }
      }
    }

    /*for (let i = 0; i < grid.length; i++) {
      const gridCol = grid[i];
      // ignore columns that have no cells
      if (!gridCol || gridCol.length == 0) {
        continue;
      }
      cp++;
      for (let j = 0; j < gridCol.length; j++) {
        const gridCell = gridCol[j];
        // ignore columns that have no cells
        if (!gridCell || gridCell.bodies.length == 0) {
          continue;
        }
        cp++;

        for (let k = 0; k < gridCell.bodies.length; k++) {
          cp++;
          const obj1 = gridCell.bodies[k];
          // For every other body in this cell
          for (let l = k + 1; l < gridCell.bodies.length; l++) {
            cp++;
            const obj2 = gridCell.bodies[l];
            // This pair is already in the list
            if (addedPairs.indexOf(obj1._bodyId + ',' + obj2._bodyId) != -1) continue;
            addedPairs.push(obj1._bodyId + ',' + obj2._bodyId);
            // Compare object1 with object2
            if (World.canCollide(obj1, obj2)) {
              obj1._futureCollidingBodies.push(obj2);
              obj2._futureCollidingBodies.push(obj1);
              // Add pairs
              pairs.push([obj1, obj2]);
            }
          }
        }
      }
    }*/

    // Handle collisions
    let c = 0;
    for (let i = 0; i < this._iterations; i++) {
      for (let j = 0; j < pairs.length; j++) {
        c++;
        const obj1 = pairs[j][0];
        const obj2 = pairs[j][1];

        if (
          !World.circleIntersect(
            obj1.position.x,
            obj1.position.y,
            obj1.radius,
            obj2.position.x,
            obj2.position.y,
            obj2.radius,
          ) ||
          obj1.isSensor() ||
          obj2.isSensor() // sensors don't need collision handling
        ) {
          continue;
        }
        //console.log(obj1._bodyId, obj2._bodyId);
        Solver.CircleToCircle(obj1, obj2);
      }
    }

    // Update collision cache
    for (let i = 0; i < this.bodies.length; i++) {
      this.bodies[i]._updateCollisionCache();
    }
    thisFrameTime += performance.now() - a;
    //console.log('Total collision checks this frame:', c, 'cp', cp, 'ft', thisFrameTime);
  }

  private static canCollide(b1: Body, b2: Body): boolean {
    return (
      // Do they intersect?
      World.circleIntersect(b1.position.x, b1.position.y, b1.radius, b2.position.x, b2.position.y, b2.radius) &&
      // Don't collide if they're both static
      (!b1.isStatic() || !b2.isStatic()) &&
      // Don't collide if they're both sensors
      ((!b1.isSensor() && !b2.isSensor()) || (b1.isSensor() && b2.isDynamic()) || (b2.isSensor() && b1.isDynamic())) &&
      // Make sure they don't ignore each other
      b1.ignoredBodies.indexOf(b2) == -1 &&
      b2.ignoredBodies.indexOf(b1) == -1 &&
      // Make sure they can collide
      (b2.collisionMask & b1.collisionCategory) == b1.collisionCategory &&
      (b1.collisionMask & b2.collisionCategory) == b2.collisionCategory
    );
  }

  private static circleIntersect(x1: number, y1: number, r1: number, x2: number, y2: number, r2: number): boolean {
    // Calculate the distance between the two circles
    const squareDistance = (x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2);

    // When the distance is smaller or equal to the sum
    // of the two radius, the circles touch or overlap
    return squareDistance <= (r1 + r2) * (r1 + r2);
  }
}
