import { isNil } from '../core/util';

/**
 * Abstract parent class for Point and Coordinate
 * @abstract
 * @category basic types
 */
class Position {

    constructor(x, y) {
        if (!isNil(x) && !isNil(y)) {
            /**
             * @property x {Number} - x value
             */
            this.x = +(x);
            /**
             * @property y {Number} - y value
             */
            this.y = +(y);
        } else if (!isNil(x.x) && !isNil(x.y)) {
            this.x = +(x.x);
            this.y = +(x.y);
        } else if (Array.isArray(x)) {
            this.x = +(x[0]);
            this.y = +(x[1]);
        }
        if (this._isNaN()) {
            throw new Error('Position is NaN');
        }
    }

    /**
     * Return abs value of the point
     * @return {Coordinate|Point} abs point
     */
    abs() {
        return new this.constructor(Math.abs(this.x), Math.abs(this.y));
    }

    //destructive abs
    _abs() {
        this.x = Math.abs(this.x);
        this.y = Math.abs(this.y);
        return this;
    }

    _round() {
        this.x = Math.round(this.x);
        this.y = Math.round(this.y);
        return this;
    }

    /**
     * Like math.round, rounding the point's xy.
     * @return {Coordinate|Point} rounded point
     */
    round() {
        return new this.constructor(Math.round(this.x), Math.round(this.y));
    }

    _ceil() {
        this.x = Math.ceil(this.x);
        this.y = Math.ceil(this.y);
        return this;
    }

    ceil() {
        return new this.constructor(Math.ceil(this.x), Math.ceil(this.y));
    }

    _floor() {
        this.x = Math.floor(this.x);
        this.y = Math.floor(this.y);
        return this;
    }

    floor() {
        return new this.constructor(Math.floor(this.x), Math.floor(this.y));
    }

    /**
     * Returns a copy of the coordinate
     * @return {Coordinate|Point} copy
     */
    copy() {
        return new this.constructor(this.x, this.y);
    }

    //destructive add
    _add(x, y) {
        if (!isNil(x.x)) {
            this.x += x.x;
            this.y += x.y;
        } else if (!isNil(x[0])) {
            this.x += x[0];
            this.y += x[1];
        } else {
            this.x += x;
            this.y += y;
        }
        return this;
    }

    /**
     * Returns the result of addition of another coordinate.
     * @param {Coordinate|Point|Array|Number} x - coordinate to add
     * @param {Number} [y=undefined] - optional, coordinate to add
     * @return {Coordinate|Point} result
     */
    add(x, y) {
        let nx, ny;
        if (!isNil(x.x)) {
            nx = this.x + x.x;
            ny = this.y + x.y;
        } else if (!isNil(x[0])) {
            nx = this.x + x[0];
            ny = this.y + x[1];
        } else {
            nx = this.x + x;
            ny = this.y + y;
        }
        return new this.constructor(nx, ny);
    }

    //destructive substract
    _sub(x, y) {
        if (!isNil(x.x)) {
            this.x -= x.x;
            this.y -= x.y;
        } else if (!isNil(x[0])) {
            this.x -= x[0];
            this.y -= x[1];
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
     * Returns the result of subtraction of another coordinate.
     * @param {Coordinate|Point|Array|Number} x - coordinate to add
     * @param {Number} [y=undefined] - optional, coordinate to add
     * @return {Coordinate|Point} result
     */
    sub(x, y) {
        let nx, ny;
        if (!isNil(x.x)) {
            nx = this.x - x.x;
            ny = this.y - x.y;
        } else if (!isNil(x[0])) {
            nx = this.x - x[0];
            ny = this.y - x[1];
        } else {
            nx = this.x - x;
            ny = this.y - y;
        }
        return new this.constructor(nx, ny);
    }

    /**
     * Alias for sub
     * @param {Coordinate|Point|Array|Number} x - coordinate to add
     * @param {Number} [y=undefined] - optional, coordinate to add
     * @return {Coordinate|Point} result
     */
    substract() {
        return this.sub.apply(this, arguments);
    }

    /**
     * Returns the result of multiplication of the current coordinate by the given number.
     * @param {Number} ratio - ratio to multi
     * @return {Coordinate|Point} result
     */
    multi(ratio) {
        return new this.constructor(this.x * ratio, this.y * ratio);
    }

    _multi(ratio) {
        this.x *= ratio;
        this.y *= ratio;
        return this;
    }

    /**
     * Returns the result of division of the current point by the given number.
     * @param {Number} n - number to div
     * @return {Coordinate|Point} result
     */
    div(n) {
        return this.multi(1 / n);
    }

    _div(n) {
        return this._multi(1 / n);
    }

    /**
     * Compare with another coordinate to see whether they are equal.
     * @param {Coordinate|Point} c - coordinate to compare
     * @return {Boolean}
     */
    equals(c) {
        if (!(c instanceof this.constructor)) {
            return false;
        }
        return this.x === c.x && this.y === c.y;
    }

    /**
     * Whether the coordinate is NaN
     * @return {Boolean}
     * @private
     */
    _isNaN() {
        return isNaN(this.x) || isNaN(this.y);
    }

    /**
     * Whether the coordinate/point is zero
     */
    isZero() {
        return this.x === 0 && this.y === 0;
    }

    /**
     * Convert to a number array [x, y]
     * @return {Number[]} number array
     */
    toArray() {
        return [this.x, this.y];
    }

    /**
     * Formats coordinate number using fixed-point notation.
     * @param  {Number} n The number of digits to appear after the decimal point
     * @return {Coordinate}   fixed coordinate
     */
    toFixed(n) {
        return new this.constructor(this.x.toFixed(n), this.y.toFixed(n));
    }

    /**
     * Convert to a json object {x : .., y : ..}
     * @return {Object} json
     */
    toJSON() {
        return {
            x: this.x,
            y: this.y
        };
    }
}

export default Position;
