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
Z.Point=function(x,y) {
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
    _abs:function() {
        this.x = Math.abs(this.x);
        this.y = Math.abs(this.y);
        return this;
    },
    /**
     * Returns a copy of the point
     * @return {maptalks.Point} copy
     */
    copy:function() {
        return new Z.Point(this.x, this.y);
    },

    _round:function() {
        this.x = Z.Util.round(this.x);
        this.y = Z.Util.round(this.y);
        return this;
    },

    round:function() {
        return new Z.Point(Z.Util.round(this.x),Z.Util.round(this.y));
    },

    /**
     * Compare with another point to see whether they are equal.
     * @param {maptalks.Point} c2 - point to compare
     * @return {Boolean}
     */
    equals:function(p) {
        return this.x === p.x && this.y === p.y;
    },

    /**
     * Returns the distance between the current and the given point.
     * @param  {maptalks.Point} point - another point
     * @return {Number} distance
     */
    distanceTo: function(point) {
        var x = point.x - this.x,
            y = point.y - this.y;
        return Math.sqrt(x * x + y * y);
    },

    //Destructive add
    _add: function(x, y) {
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
    add: function(x, y) {
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

    _substract: function(x, y) {
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
    substract: function(x, y) {
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
    _multi: function(ratio) {
        this.x *= ratio;
        this.y *= ratio;
        return this;
    },

    /**
     * Returns the result of multiplication of the current point by the given number.
     * @param {Number} ratio - ratio to multi
     * @return {maptalks.Point} result
     */
    multi: function(ratio) {
        return new Z.Point(this.x*ratio, this.y*ratio);
    },

    isNaN:function() {
        return isNaN(this.x) || isNaN(this.y);
    },

    toString:function() {
        return [this.x,this.y].join(',');
    }
});
