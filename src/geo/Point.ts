import Position from './Position';

/**
 * 2D 点实现
 * @english
 * Represents a 2d point.<br>
 * Can be created in serveral ways:
 * @example
 *
 * var point = new Point(1000, 1000);
 * @example
 *
 * var point = new Point([1000,1000]);
 * @example
 *
 * var point = new Point({x:1000, y:1000});
 * @category basic types
 * @extends Position
 */
class Point extends Position {
    /**
     *
     * @english
     * Compare with another point with a delta
     * @param p
     * @param delta
     */
    closeTo(p: Point, delta?: number): boolean {
        if (!delta) {
            delta = 0;
        }
        return this.x >= (p.x - delta) && this.x <= (p.x + delta) &&
            this.y >= (p.y - delta) && this.y <= (p.y + delta);
    }

    /**
     * Return the magitude of this point: this is the Euclidean
     * distance from the 0, 0 coordinate to this point's x and y
     * coordinates.
     * @returns magnitude
     */
    mag(): number {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    /**
     * Calculate this point but as a unit vector from 0, 0, meaning
     * that the distance from the resulting point to the 0, 0
     * coordinate will be equal to 1 and the angle from the resulting
     * point to the 0, 0 coordinate will be the same as before.
     * @returns unit vector point
     */
    unit() {
        return this.copy()._unit();
    }

    _unit(): this {
        this._div(this.mag());
        return this;
    }

    /**
     * Compute a perpendicular point, where the new y coordinate
     * is the old x coordinate and the new x coordinate is the old y
     * coordinate multiplied by -1
     * @returns perpendicular point
     */
    perp() {
        return this.copy()._perp();
    }

    _perp() {
        [this.x, this.y] = [-this.y, this.x]
        return this;
    }

    /**
     * Get the angle between this point and another point, in radians
     * from mapbox/point-geometry
     * @param b the other point
     * @returns angle
     */
    angleWith(b: Point): number {
        return this.angleWithSep(b.x, b.y);
    }

    /*
     * Find the angle of the two vectors, solving the formula for
     * the cross product a x b = |a||b|sin(θ) for θ.
     * from mapbox/point-geometry
     *
     * @param x the x-coordinate
     * @param y the y-coordinate
     * @returns the angle in radians
     */
    angleWithSep(x: number, y: number) {
        return Math.atan2(
            this.x * y - this.y * x,
            this.x * x + this.y * y);
    }

    _rotate(angle: number) {
        const cos = Math.cos(angle),
            sin = Math.sin(angle),
            x = cos * this.x - sin * this.y,
            y = sin * this.x + cos * this.y;
        this.x = x;
        this.y = y;
        return this;
    }

    /**
     * Rotate this point around the 0, 0 origin by an angle a,
     * given in radians
     * from mapbox/point-geometry
     *
     * @param a angle to rotate around, in radians
     * @returns output point
     */
    rotate(a: number) {
        return this.copy()._rotate(a);
    }

    /**
     * Return abs value of the point
     * @returns abs point
     */
    abs() {
        return new Point(Math.abs(this.x), Math.abs(this.y));
    }

    /**
     * Like math.round, rounding the point's xy.
     * @returns rounded point
     */
    round() {
        return new Point(Math.round(this.x), Math.round(this.y));
    }
}

export default Point;
