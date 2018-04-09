import Position from './Position';

/**
 * Represents a 2d point.<br>
 * Can be created in serveral ways:
 * @example
 * var point = new Point(1000, 1000);
 * @example
 * var point = new Point([1000,1000]);
 * @example
 * var point = new Point({x:1000, y:1000});
 * @category basic types
 */
class Point extends Position {

    /**
     * Compare with another point with a delta
     * @param {Point} p
     * @param {Number} delta
     * @return {Boolean}
     */
    closeTo(p, delta) {
        if (!delta) {
            delta = 0;
        }
        return this.x >= (p.x - delta) && this.x <= (p.x + delta) &&
            this.y >= (p.y - delta) && this.y <= (p.y + delta);
    }

    /**
     * Returns the distance between the current and the given point.
     * @param  {Point} point - another point
     * @return {Number} distance
     */
    distanceTo(point) {
        const x = point.x - this.x,
            y = point.y - this.y;
        return Math.sqrt(x * x + y * y);
    }

    /**
     * Return the magitude of this point: this is the Euclidean
     * distance from the 0, 0 coordinate to this point's x and y
     * coordinates.
     * @return {Number} magnitude
     */
    mag() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    /**
     * Calculate this point but as a unit vector from 0, 0, meaning
     * that the distance from the resulting point to the 0, 0
     * coordinate will be equal to 1 and the angle from the resulting
     * point to the 0, 0 coordinate will be the same as before.
     * @return {Point} unit vector point
     */
    unit() {
        return this.copy()._unit();
    }

    _unit() {
        this._div(this.mag());
        return this;
    }

    /**
     * Compute a perpendicular point, where the new y coordinate
     * is the old x coordinate and the new x coordinate is the old y
     * coordinate multiplied by -1
     * @return {Point} perpendicular point
     */
    perp() {
        return this.copy()._perp();
    }

    _perp() {
        const y = this.y;
        this.y = this.x;
        this.x = -y;
        return this;
    }



    /**
     * Get the angle between this point and another point, in radians
     * from mapbox/point-geometry
     * @param {Point} b the other point
     * @return {Number} angle
     */
    angleWith(b) {
        return this.angleWithSep(b.x, b.y);
    }

    /*
     * Find the angle of the two vectors, solving the formula for
     * the cross product a x b = |a||b|sin(θ) for θ.
     * from mapbox/point-geometry
     *
     * @param {Number} x the x-coordinate
     * @param {Number} y the y-coordinate
     * @return {Number} the angle in radians
     */
    angleWithSep(x, y) {
        return Math.atan2(
            this.x * y - this.y * x,
            this.x * x + this.y * y);
    }

    _rotate(angle) {
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
     * @param {Number} a angle to rotate around, in radians
     * @return {Point} output point
     */
    rotate(a) {
        return this.copy()._rotate(a);
    }
}

export default Point;
