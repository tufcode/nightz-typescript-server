import { Body, Vector2 } from './body';

export class World {
  public bodies: Body[] = [];

  public update(deltaTime: number): void {
    let obj1: Body;
    let obj2: Body;

    // Reset collision state of all objects
    for (let i = 0; i < this.bodies.length; i++) {
      this.bodies[i].update(deltaTime);
      this.bodies[i].isColliding = false;
    }

    // Start checking for collisions
    for (let i = 0; i < this.bodies.length; i++) {
      obj1 = this.bodies[i];
      for (let j = i + 1; j < this.bodies.length; j++) {
        obj2 = this.bodies[j];

        // Compare object1 with object2
        if (
          World.circleIntersect(
            obj1.position.x,
            obj1.position.y,
            obj1.radius,
            obj2.position.x,
            obj2.position.y,
            obj2.radius,
          )
        ) {
          obj1.isColliding = true;
          obj2.isColliding = true;

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
          speed *= Math.min(obj1.restitution, obj2.restitution);
          // The speed of the collision can be positive or negative. When it's positive, the objects are moving toward each other.
          // When it's negative, they move away. When objects move away, there is no need to perform any further action. They will move out of collision on their own.
          // For the other case, when objects are moving toward each other, apply the speed in the direction of the collision.
          // Both objects get the same change in velocity from the collision. Subtract or add the velocity to the velocity of the two collided objects.
          if (speed > 0) {
            // Apply physics even further and take mass into the equation by calculating the collision impulse from the speed.
            // Use the impulse to calculate momentum. Heavy objects will push light ones aside.
            const impulse = (2 * speed) / (obj1.mass + obj2.mass);

            /*const move = (2 * (obj1.radius + obj2.radius - distance)) / (obj1.mass + obj2.mass);
            obj1.position.x -= (normalizedCollisionVector.x * (move * obj2.mass)) / 2; // Move first object by half of collision size
            obj1.position.y -= (normalizedCollisionVector.y * (move * obj2.mass)) / 2;
            obj2.position.x += (normalizedCollisionVector.x * (move * obj1.mass)) / 2; // Move other object by half of collision size in opposite direction
            obj2.position.y += (normalizedCollisionVector.y * (move * obj1.mass)) / 2;*/

            obj1.velocity.x -= impulse * obj2.mass * normalizedCollisionVector.x;
            obj1.velocity.y -= impulse * obj2.mass * normalizedCollisionVector.y;
            obj2.velocity.x += impulse * obj1.mass * normalizedCollisionVector.x;
            obj2.velocity.y += impulse * obj1.mass * normalizedCollisionVector.y;
          } else if (speed == 0) {
            const s = obj1.radius + obj2.radius - distance; // Compute penetration depth
            const impulse = (2 * s) / (obj1.mass + obj2.mass);
            obj1.position.x -= (normalizedCollisionVector.x * (impulse * obj2.mass)) / 2; // Move first object by half of collision size
            obj1.position.y -= (normalizedCollisionVector.y * (impulse * obj2.mass)) / 2;
            obj2.position.x += (normalizedCollisionVector.x * (impulse * obj1.mass)) / 2; // Move other object by half of collision size in opposite direction
            obj2.position.y += (normalizedCollisionVector.y * (impulse * obj1.mass)) / 2;

            obj1.velocity.x -= impulse * obj2.mass * normalizedCollisionVector.x;
            obj1.velocity.y -= impulse * obj2.mass * normalizedCollisionVector.y;
            obj2.velocity.x += impulse * obj1.mass * normalizedCollisionVector.x;
            obj2.velocity.y += impulse * obj1.mass * normalizedCollisionVector.y;

            // Reset velocities
            /*obj1.velocity.x -= obj2.mass * normalizedCollisionVector.x;
            obj1.velocity.y -= obj2.mass * normalizedCollisionVector.y;
            obj2.velocity.x -= obj1.mass * normalizedCollisionVector.x;
            obj2.velocity.y -= obj1.mass * normalizedCollisionVector.y;*/
          }
        }
      }
    }
  }

  private static circleIntersect(x1: number, y1: number, r1: number, x2: number, y2: number, r2: number): boolean {
    // Calculate the distance between the two circles
    const squareDistance = (x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2);

    // When the distance is smaller or equal to the sum
    // of the two radius, the circles touch or overlap
    return squareDistance <= (r1 + r2) * (r1 + r2);
  }
}
