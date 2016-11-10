/**
 * Represents a 2d point.<br>
 * Can be created in serveral ways:
 * @example
 * var point = new maptalks.Point(1000, 1000);
 * @example
 * var point = new maptalks.Point([1000,1000]);
 * @example
 * var point = new maptalks.Point({x:1000, y:1000});
 * @class
 * @category basic types
 * @param {Number} x - x value
 * @param {Number} y - y value
 */
Z.Point = function (x, y) {
    if (!Z.Util.isNil(x) && !Z.Util.isNil(y)) {
        /**
         * @property x {Number} - x value
         */
        this.x = x;
        /**
         * @property y {Number} - y value
         */
        this.y = y;
    } else if (!Z.Util.isNil(x.x) && !Z.Util.isNil(x.y)) {
        //对象
        this.x = x.x;
        this.y = x.y;
    } else if (Z.Util.isArrayHasData(x)) {
        this.x = x[0];
        this.y = x[1];
    }
    if (this.isNaN()) {
        throw new Error('point is NaN');
    }
};

Z.Util.extend(Z.Point.prototype, /** @lends maptalks.Point.prototype */{
    _abs:function () {
        this.x = Math.abs(this.x);
        this.y = Math.abs(this.y);
        return this;
    },
    /**
     * Returns a copy of the point
     * @return {maptalks.Point} copy
     */
    copy:function () {
        return new Z.Point(this.x, this.y);
    },

    _round:function () {
        this.x = Z.Util.round(this.x);
        this.y = Z.Util.round(this.y);
        return this;
    },

    /**
     * Like math.round, rounding the point's xy.
     * @return {maptalks.Point} rounded point
     */
    round:function () {
        return new Z.Point(Z.Util.round(this.x), Z.Util.round(this.y));
    },

    /**
     * Compare with another point to see whether they are equal.
     * @param {maptalks.Point} c2 - point to compare
     * @return {Boolean}
     */
    equals:function (p) {
        return this.x === p.x && this.y === p.y;
    },

    /**
     * Returns the distance between the current and the given point.
     * @param  {maptalks.Point} point - another point
     * @return {Number} distance
     */
    distanceTo: function (point) {
        var x = point.x - this.x,
            y = point.y - this.y;
        return Math.sqrt(x * x + y * y);
    },

    //Destructive add
    _add: function (x, y) {
        if (x instanceof Z.Point) {
            this.x += x.x;
            this.y += x.y;
        } else {
            this.x += x;
            this.y += y;
        }
        return this;
    },

    /**
     * Returns the result of addition of another point.
     * @param {maptalks.Point} point - point to add
     * @return {maptalks.Point} result
     */
    add: function (x, y) {
        var nx, ny;
        if (x instanceof Z.Point) {
            nx = this.x + x.x;
            ny = this.y + x.y;
        } else {
            nx = this.x + x;
            ny = this.y + y;
        }
        return new Z.Point(nx, ny);
    },

    _substract: function (x, y) {
        if (x instanceof Z.Point) {
            this.x -= x.x;
            this.y -= x.y;
        } else {
            this.x -= x;
            this.y -= y;
        }
        return this;
    },

    /**
     * Returns the result of subtraction of another point.
     * @param {maptalks.Point} point - point to substract
     * @return {maptalks.Point} result
     */
    substract: function (x, y) {
        var nx, ny;
        if (x instanceof Z.Point) {
            nx = this.x - x.x;
            ny = this.y - x.y;
        } else {
            nx = this.x - x;
            ny = this.y - y;
        }
        return new Z.Point(nx, ny);
    },

    //破坏性方法
    _multi: function (n) {
        this.x *= n;
        this.y *= n;
        return this;
    },

    /**
     * Returns the result of multiplication of the current point by the given number.
     * @param {Number} n - number to multi
     * @return {maptalks.Point} result
     */
    multi: function (n) {
        return new Z.Point(this.x * n, this.y * n);
    },

    /**
     * Returns the result of division of the current point by the given number.
     * @param {Number} n - number to div
     * @return {maptalks.Point} result
     */
    div: function (n) {
        return this.multi(1 / n);
    },

    _div: function (n) {
        return this._multi(1 / n);
    },

    /**
     * Whether the point is NaN
     * @return {Boolean}
     */
    isNaN:function () {
        return isNaN(this.x) || isNaN(this.y);
    },

    /**
     * Convert the point to a number array [x, y]
     * @return {Number[]} number array
     */
    toArray:function () {
        return [this.x, this.y];
    },

    /**
     * Convert the point to a json object {x : .., y : ..}
     * @return {Object} json
     */
    toJSON: function () {
        return {
            x : this.x,
            y : this.y
        };
    },

    /**
     * Return the magitude of this point: this is the Euclidean
     * distance from the 0, 0 coordinate to this point's x and y
     * coordinates.
     * @return {Number} magnitude
     */
    mag: function () {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    },

    /**
     * Calculate this point but as a unit vector from 0, 0, meaning
     * that the distance from the resulting point to the 0, 0
     * coordinate will be equal to 1 and the angle from the resulting
     * point to the 0, 0 coordinate will be the same as before.
     * @return {maptalks.Point} unit vector point
     */
    unit:    function() { return this.copy()._unit(); },

    _unit: function () {
        this._div(this.mag());
        return this;
    },

    /**
     * Compute a perpendicular point, where the new y coordinate
     * is the old x coordinate and the new x coordinate is the old y
     * coordinate multiplied by -1
     * @return {maptalks.Point} perpendicular point
     */
    perp:    function() { return this.copy()._perp(); },

    _perp: function() {
        var y = this.y;
        this.y = this.x;
        this.x = -y;
        return this;
    }
});
