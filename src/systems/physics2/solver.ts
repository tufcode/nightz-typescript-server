import { Body } from './body';
import { Vector2 } from './vector2';

export class Solver {
  public static CircleToCircle(body1: Body, body2: Body): void {
    const collisionVector = new Vector2(body2.position.x - body1.position.x, body2.position.y - body1.position.y);
    const distance = Math.sqrt(
      (body1.position.x - body2.position.x) * (body1.position.x - body2.position.x) +
        (body1.position.y - body2.position.y) * (body1.position.y - body2.position.y),
    );

    if (distance == 0) {
      console.log(body1._bodyId, body2._bodyId, 'dist0!', body1.position, body2.position);
      return;
    }

    const normalVector = new Vector2(
      (body2.position.x - body1.position.x) / distance,
      (body2.position.y - body1.position.y) / distance,
    );

    // Overlap
    const overlap = 0.5 * (distance - body1.radius - body2.radius);
    body1.position.x -= (overlap * (body1.position.x - body2.position.x)) / distance;
    body1.position.y -= (overlap * (body1.position.y - body2.position.y)) / distance;

    body2.position.x += (overlap * (body1.position.x - body2.position.x)) / distance;
    body2.position.y += (overlap * (body1.position.y - body2.position.y)) / distance;

    // Tangent
    const tangentVector = new Vector2(-normalVector.y, normalVector.x);

    // Dot Product Tangent
    const dpTan1 = body1.velocity.x * normalVector.x + body1.velocity.y * normalVector.y;
    const dpTan2 = body2.velocity.x * normalVector.x + body2.velocity.y * normalVector.y;

    // Dot Product Normal
    const dpNorm1 = body1.velocity.x * normalVector.x + body1.velocity.y * normalVector.y;
    const dpNorm2 = body2.velocity.x * normalVector.x + body2.velocity.y * normalVector.y;

    // Conversation of momentum in 1D
    const m1 = (dpNorm1 * (body1.mass - body2.mass) + 2.0 * body2.mass * dpNorm2) / (body1.mass + body2.mass);
    const m2 = (dpNorm2 * (body2.mass - body1.mass) + 2.0 * body1.mass * dpNorm1) / (body1.mass + body2.mass);

    console.log(
      'm',
      m1,
      m2,
      'dp',
      dpNorm1,
      dpNorm2,
      'tan',
      dpTan1,
      dpTan2,
      'norm',
      normalVector,
      'tang',
      tangentVector,
      'dist',
      distance,
    );
    //console.log(body1.velocity, body2.velocity);

    body1.velocity.x = tangentVector.x * dpTan1 + normalVector.x * m1;
    body1.velocity.y = tangentVector.y * dpTan1 + normalVector.y * m1;
    body2.velocity.x = tangentVector.x * dpTan2 + normalVector.x * m2;
    body2.velocity.y = tangentVector.y * dpTan2 + normalVector.y * m2;

    //console.log(body1.velocity, body2.velocity);
  }
}
