import { Vector3 } from "../util/mat4";
import * as vec3 from '../util/vec3';

export default class Plane {
    normal: Vector3;
    constant: number;

    constructor(normal: Vector3, constant: number) {
        this.normal = normal;
        this.constant = constant;
    }

    distanceToPoint( point ) {
		return vec3.dot(this.normal, point) + this.constant;
	}
}
