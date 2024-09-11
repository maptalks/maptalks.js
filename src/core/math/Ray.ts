import { Vector3 } from '../util/mat4';
import * as vec3 from '../util/vec3';
import Plane from './Plane';

const scaledDir: [number, number, number] = [0, 0, 0];
const _edge1: [number, number, number] = [0, 0, 0];
const _edge2: [number, number, number] = [0, 0, 0];
const _normal: [number, number, number] = [0, 0, 0];
const _diff: [number, number, number] = [0, 0, 0];

const Ground = new Plane([0, 0, 1], 0);

// from Vector3.js in three.js
// https://github.com/mrdoob/three.js
// MIT license
export default class Ray {
    origin: [number, number, number];
    direction: [number, number, number];

    constructor(from: Vector3, to: Vector3) {
        this.setFromTo(from, to);
    }



    setFromTo(from: Vector3, to: Vector3) {
        this.origin = from;
        const direction = this.direction || [0, 0, 0] as [number, number, number];
        this.direction = vec3.normalize(direction, vec3.sub(direction, to, from));
    }

    distanceToPlane( plane: Plane ) {

		const denominator = vec3.dot(plane.normal, this.direction);

		if ( denominator === 0 ) {

			// line is coplanar, return origin
			if ( plane.distanceToPoint( this.origin ) === 0 ) {

				return 0;

			}

			// Null is preferable to undefined since undefined means.... it is undefined

			return null;

		}

		const t = - (vec3.dot(this.origin, plane.normal) + plane.constant) / denominator;

		// Return if the ray never intersects the plane

		return t >= 0 ? t : null;

	}

    intersectGround(target: Vector3) {
        return this.intersectPlane(Ground, target);
    }

    distanceToGround() {
        return this.distanceToPlane(Ground);
    }

    intersectPlane( plane: Plane, target: Vector3 ) {

		const t = this.distanceToPlane( plane );

		if ( t === null ) {

			return null;

		}

		return this.at( t, target );

	}

    intersectBox( box, target: Vector3 ) {

		let tmin, tmax, tymin, tymax, tzmin, tzmax;

		const invdirx = 1 / this.direction[0],
			invdiry = 1 / this.direction[1],
			invdirz = 1 / this.direction[2];

		const origin = this.origin;

		if ( invdirx >= 0 ) {

			tmin = ( box[0][0] - origin[0] ) * invdirx;
			tmax = ( box[1][0] - origin[0] ) * invdirx;

		} else {

			tmin = ( box[1][0] - origin[0] ) * invdirx;
			tmax = ( box[0][0] - origin[0] ) * invdirx;

		}

		if ( invdiry >= 0 ) {

			tymin = ( box[0][1] - origin[1] ) * invdiry;
			tymax = ( box[1][1] - origin[1] ) * invdiry;

		} else {

			tymin = ( box[1][1] - origin[1] ) * invdiry;
			tymax = ( box[0][1] - origin[1] ) * invdiry;

		}

		if ( ( tmin > tymax ) || ( tymin > tmax ) ) return null;

		if ( tymin > tmin || isNaN( tmin ) ) tmin = tymin;

		if ( tymax < tmax || isNaN( tmax ) ) tmax = tymax;

		if ( invdirz >= 0 ) {

			tzmin = ( box[0][2] - origin[2] ) * invdirz;
			tzmax = ( box[1][2] - origin[2] ) * invdirz;

		} else {

			tzmin = ( box[1][2] - origin[2] ) * invdirz;
			tzmax = ( box[0][2] - origin[2] ) * invdirz;

		}

		if ( ( tmin > tzmax ) || ( tzmin > tmax ) ) return null;

		if ( tzmin > tmin || tmin !== tmin ) tmin = tzmin;

		if ( tzmax < tmax || tmax !== tmax ) tmax = tzmax;

		//return point closest to the ray (positive side)

		if ( tmax < 0 ) return null;

		return this.at( tmin >= 0 ? tmin : tmax, target );

	}

    intersectTriangle( a, b, c, backfaceCulling, target ) {

		// Compute the offset origin, edges, and normal.

		// from https://github.com/pmjoniak/GeometricTools/blob/master/GTEngine/Include/Mathematics/GteIntrRay3Triangle3.h
        vec3.sub(_edge1, b, a);
        vec3.sub(_edge2, c, a);
        vec3.cross(_normal, _edge1, _edge2);

		// Solve Q + t*D = b1*E1 + b2*E2 (Q = kDiff, D = ray direction,
		// E1 = kEdge1, E2 = kEdge2, N = Cross(E1,E2)) by
		//   |Dot(D,N)|*b1 = sign(Dot(D,N))*Dot(D,Cross(Q,E2))
		//   |Dot(D,N)|*b2 = sign(Dot(D,N))*Dot(D,Cross(E1,Q))
		//   |Dot(D,N)|*t = -sign(Dot(D,N))*Dot(Q,N)
		let DdN = vec3.dot(this.direction, _normal);
		let sign;

		if ( DdN > 0 ) {

			if ( backfaceCulling ) return null;
			sign = 1;

		} else if ( DdN < 0 ) {

			sign = - 1;
			DdN = - DdN;

		} else {

			return null;

		}
        vec3.sub(_diff, this.origin, a);

		vec3.cross(_edge2, _diff, _edge2);
		const DdQxE2 = sign * vec3.dot(this.direction, _edge2);

		// b1 < 0, no intersection
		if ( DdQxE2 < 0 ) {

			return null;

		}
        vec3.cross(_edge1, _edge1, _diff);
		const DdE1xQ = sign * vec3.dot(this.direction, _edge1);

		// b2 < 0, no intersection
		if ( DdE1xQ < 0 ) {

			return null;

		}

		// b1+b2 > 1, no intersection
		if ( DdQxE2 + DdE1xQ > DdN ) {

			return null;

		}

		// Line intersects triangle, check if ray does.
		const QdN = - sign * vec3.dot(_diff, _normal);

		// t < 0, no intersection
		if ( QdN < 0 ) {

			return null;

		}

		// Ray intersects triangle.
		return this.at( QdN / DdN, target );

	}

    at( t, target ) {
        vec3.copy(target, this.origin);
        return vec3.add(target, target, vec3.scale(scaledDir, this.direction, t));
	}
}
