import { isNil, isArrayHasData } from '../core/util';

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
class Point {

    /**
     * @param {Number} x - x value
     * @param {Number} y - y value
     */
    constructor(x, y) {
        if (!isNil(x) && !isNil(y)) {
            /**
             * @property x {Number} - x value
             */
            this.x = x;
            /**
             * @property y {Number} - y value
             */
            this.y = y;
        } else if (!isNil(x.x) && !isNil(x.y)) {
            this.x = x.x;
            this.y = x.y;
        } else if (isArrayHasData(x)) {
            this.x = x[0];
            this.y = x[1];
        }
        if (this._isNaN()) {
            throw new Error('point is NaN');
        }
    }

    /**
     * Return abs value of the point
     * @return {Point} abs point
     */
    abs() {
        return new Point(Math.abs(this.x), Math.abs(this.y));
    }

    //destructive abs
    _abs() {
        this.x = Math.abs(this.x);
        this.y = Math.abs(this.y);
        return this;
    }

    /**
     * Returns a copy of the point
     * @return {Point} copy
     */
    copy() {
        return new Point(this.x, this.y);
    }

    _round() {
        this.x = Math.round(this.x);
        this.y = Math.round(this.y);
        return this;
    }

    /**
     * Like math.round, rounding the point's xy.
     * @return {Point} rounded point
     */
    round() {
        return new Point(Math.round(this.x), Math.round(this.y));
    }

    _ceil() {
        this.x = Math.ceil(this.x);
        this.y = Math.ceil(this.y);
        return this;
    }

    ceil() {
        return new Point(Math.ceil(this.x), Math.ceil(this.y));
    }

    _floor() {
        this.x = Math.floor(this.x);
        this.y = Math.floor(this.y);
        return this;
    }

    floor() {
        return new Point(Math.floor(this.x), Math.floor(this.y));
    }

    /**
     * Compare with another point to see whether they are equal.
     * @param {Point} c2 - point to compare
     * @return {Boolean}
     */
    equals(p) {
        return this.x === p.x && this.y === p.y;
    }

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

    //Destructive add
    _add(x, y) {
        if (!isNil(x.x)) {
            this.x += x.x;
            this.y += x.y;
        } else {
            this.x += x;
            this.y += y;
        }
        return this;
    }

    /**
     * Returns the result of addition of another point.
     * @param {Point} point - point to add
     * @return {Point} result
     */
    add(x, y) {
        let nx, ny;
        if (!isNil(x.x)) {
            nx = this.x + x.x;
            ny = this.y + x.y;
        } else {
            nx = this.x + x;
            ny = this.y + y;
        }
        return new Point(nx, ny);
    }

    _sub(x, y) {
        if (!isNil(x.x)) {
            this.x -= x.x;
            this.y -= x.y;
        } else {
            this.x -= x;
            this.y -= y;
        }
        return this;
    }

    _substract() {
        return this._sub.apply(this, arguments);
    }

    /**
     * Returns the result of subtraction of another point.
     * @param {Point} point - point to substract
     * @return {Point} result
     */
    sub(x, y) {
        let nx, ny;
        if (!isNil(x.x)) {
            nx = this.x - x.x;
            ny = this.y - x.y;
        } else {
            nx = this.x - x;
            ny = this.y - y;
        }
        return new Point(nx, ny);
    }

    /**
     * alias for sub
     * @param {Point} point - point to substract
     * @return {Point} result
     */
    substract() {
        return this.sub.apply(this, arguments);
    }

    //destructive multi
    _multi(n) {
        this.x *= n;
        this.y *= n;
        return this;
    }

    /**
     * Returns the result of multiplication of the current point by the given number.
     * @param {Number} n - number to multi
     * @return {Point} result
     */
    multi(n) {
        return new Point(this.x * n, this.y * n);
    }

    /**
     * Returns the result of division of the current point by the given number.
     * @param {Number} n - number to div
     * @return {Point} result
     */
    div(n) {
        return this.multi(1 / n);
    }

    _div(n) {
        return this._multi(1 / n);
    }

    /**
     * Whether the point is NaN
     * @return {Boolean}
     */
    _isNaN() {
        return isNaN(this.x) || isNaN(this.y);
    }

    /**
     * Convert the point to a number array [x, y]
     * @return {Number[]} number array
     */
    toArray() {
        return [this.x, this.y];
    }

    /**
     * Convert the point to a json object {x : .., y : ..}
     * @return {Object} json
     */
    toJSON() {
        return {
            x: this.x,
            y: this.y
        };
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

    isZero() {
        return this.x === 0 && this.y === 0;
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
