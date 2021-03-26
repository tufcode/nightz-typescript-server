import { Body, BodyType } from './body';
import { Vector2 } from './vector2';

interface ICell {
  bodies: Body[];
  isTested: boolean;
}

export class World {
  public bodies: Body[] = [];
  public bounds: Vector2;
  public gravity: number = 0;
  public gridCellSize: number;
  private _lastBodyId = 0;
  private _bounceThreshold = 0;

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

    // Populate the grid
    for (let i = 0; i < this.bodies.length; i++) {
      const body = this.bodies[i];

      // Also reset state of bodies
      body.update(deltaTime);
      body.isColliding = false;

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
      const cXEntityMin = Math.floor((body.position.x - bodySize - minX) / this.gridCellSize);
      const cXEntityMax = Math.floor((body.position.x + bodySize - minX) / this.gridCellSize);
      const cYEntityMin = Math.floor((body.position.y - bodySize - minY) / this.gridCellSize);
      const cYEntityMax = Math.floor((body.position.y + bodySize - minY) / this.gridCellSize);

      // insert entity into each cell it overlaps
      // we're looping to make sure that all cells between extremes are found
      for (let cX = cXEntityMin; cX <= cXEntityMax; cX++) {
        // make sure a column exists, initialize if not to grid height length
        if (!grid[cX]) {
          grid[cX] = [];
        }

        const gridCol = grid[cX];

        // loop through each cell in this column
        for (let cY = cYEntityMin; cY <= cYEntityMax; cY++) {
          // ensure we have a bucket to put entities into for this cell
          if (!gridCol[cY]) {
            gridCol[cY] = { bodies: [], isTested: false };
          }

          const gridCell = gridCol[cY];
          // add body to cell
          gridCell.bodies.push(body);
        }
      }
    }

    // Check for collision pairs
    const addedPairs = [];
    const pairs: Body[][] = [];
    for (let i = 0; i < grid.length; i++) {
      const gridCol = grid[i];
      // ignore columns that have no cells
      if (!gridCol || gridCol.length == 0) {
        continue;
      }

      for (let j = 0; j < gridCol.length; j++) {
        const gridCell = gridCol[j];
        // ignore columns that have no cells
        if (!gridCell || gridCell.bodies.length == 0) {
          continue;
        }

        for (let k = 0; k < gridCell.bodies.length; k++) {
          const obj1 = gridCell.bodies[k];
          // For every other body in this cell
          for (let l = k + 1; l < gridCell.bodies.length; l++) {
            const obj2 = gridCell.bodies[l];
            // This pair is already in the list
            if (addedPairs.indexOf(obj1._bodyId + ',' + obj2._bodyId) != -1) continue;
            addedPairs.push(obj1._bodyId + ',' + obj2._bodyId);
            // Compare object1 with object2
            if (
              // If bodies overlap
              World.circleIntersect(
                obj1.position.x,
                obj1.position.y,
                obj1.radius,
                obj2.position.x,
                obj2.position.y,
                obj2.radius,
              ) &&
              // Both of them are not static
              (!obj1.isStatic() || !obj2.isStatic()) &&
              // If one of them is a sensor, then one of them is dynamic.
              ((!obj1.isSensor() && !obj2.isSensor()) ||
                (obj1.isSensor() && obj2.isDynamic()) ||
                (obj2.isSensor() && obj1.isDynamic()))
            ) {
              // Add pairs
              pairs.push([obj1, obj2]);
            }
          }
        }
      }
    }

    let c = 0;
    for (let i = 0; i < 4; i++) {
      // Handle collisions
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
          )
        ) {
          const index1 = obj1._collidingBodies.indexOf(obj2);
          const index2 = obj2._collidingBodies.indexOf(obj1);
          if (index1 != -1) {
            obj1._collidingBodies.splice(index1, 1);
            obj1._emit('collision-end', obj2);
          }
          if (index2 != -1) {
            obj2._collidingBodies.splice(index2, 1);
            obj2._emit('collision-end', obj1);
          }
          continue;
        }
        obj1.isColliding = true;
        obj2.isColliding = true;

        if (obj1._collidingBodies.indexOf(obj2) == -1) {
          obj1._collidingBodies.push(obj2);
          obj2._collidingBodies.push(obj1);
          obj1._emit('collision-start', obj2);
          obj2._emit('collision-start', obj1);
        }

        const collisionVector = new Vector2(obj2.position.x - obj1.position.x, obj2.position.y - obj1.position.y);
        const distance = Math.sqrt(
          (obj2.position.x - obj1.position.x) * (obj2.position.x - obj1.position.x) +
            (obj2.position.y - obj1.position.y) * (obj2.position.y - obj1.position.y),
        );
        const normalizedCollisionVector = new Vector2(collisionVector.x / distance, collisionVector.y / distance);
        const relativeVelocityVector = new Vector2(
          obj1.velocity.x - obj2.velocity.x,
          obj1.velocity.y - obj2.velocity.y,
        );
        let speed =
          relativeVelocityVector.x * normalizedCollisionVector.x +
          relativeVelocityVector.y * normalizedCollisionVector.y;
        speed *= (obj1.restitution + obj2.restitution) / 2;
        if (Math.abs(speed) < this._bounceThreshold) speed = 0;
        // The speed of the collision can be positive or negative. When it's positive, the objects are moving toward each other.
        // When it's negative, they move away. When objects move away, there is no need to perform any further action. They will move out of collision on their own.
        // For the other case, when objects are moving toward each other, apply the speed in the direction of the collision.
        // Both objects get the same change in velocity from the collision. Subtract or add the velocity to the velocity of the two collided objects.
        if (speed >= 0) {
          // Apply physics even further and take mass into the equation by calculating the collision impulse from the speed.
          // Use the impulse to calculate momentum. Heavy objects will push light ones aside.
          const impulse = (2 * speed) / (obj1.mass + obj2.mass);
          const s = obj1.radius + obj2.radius - distance; // Compute penetration depth

          if (obj1.isDynamic()) {
            obj1.position.x -= (normalizedCollisionVector.x * s) / 2; // Move first object by half of collision size
            obj1.position.y -= (normalizedCollisionVector.y * s) / 2;
            if (obj2.isDynamic()) {
              obj1.velocity.x -= impulse * obj2.mass * normalizedCollisionVector.x;
              obj1.velocity.y -= impulse * obj2.mass * normalizedCollisionVector.y;
            } else {
              obj1.velocity.x = -obj1.velocity.x * Math.min(obj1.restitution, obj2.restitution);
              obj1.velocity.y = -obj1.velocity.y * Math.min(obj1.restitution, obj2.restitution);
            }
          }
          if (obj2.isDynamic()) {
            obj2.position.x += (normalizedCollisionVector.x * s) / 2; // Move other object by half of collision size in opposite direction
            obj2.position.y += (normalizedCollisionVector.y * s) / 2;
            if (obj1.isDynamic()) {
              obj2.velocity.x += impulse * obj1.mass * normalizedCollisionVector.x;
              obj2.velocity.y += impulse * obj1.mass * normalizedCollisionVector.y;
            } else {
              obj2.velocity.x = -obj2.velocity.x * Math.min(obj1.restitution, obj2.restitution);
              obj2.velocity.y = -obj2.velocity.y * Math.min(obj1.restitution, obj2.restitution);
            }
          }
        }
      }
    }
    console.log('Total collision checks this frame:', c);
  }

  private static circleIntersect(x1: number, y1: number, r1: number, x2: number, y2: number, r2: number): boolean {
    // Calculate the distance between the two circles
    const squareDistance = (x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2);

    // When the distance is smaller or equal to the sum
    // of the two radius, the circles touch or overlap
    return squareDistance <= (r1 + r2) * (r1 + r2);
  }
}
