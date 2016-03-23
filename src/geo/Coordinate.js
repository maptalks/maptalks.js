/**
 * Represents a coordinate point <br>
 * e.g. <br>
 * a geographical point with a certain latitude and longitude <br>
 * a point in a indoor room
 * @class
 * @category basic types
 * @param {Number} x - x value
 * @param {Number} y - y value
 */
Z.Coordinate = function(x, y) {
    if (!Z.Util.isNil(x) && !Z.Util.isNil(y)) {
        /**
         * @property {Number} x - value on X-Axis or longitude in degrees
         */
        this.x = +(x);
        /**
         * @property {Number} y - value on Y-Axis or Latitude in degrees
         */
        this.y = +(y);
    } else if (Z.Util.isArray(x)) {
        //数组
        this.x = +(x[0]);
        this.y = +(x[1]);
    } else if (!Z.Util.isNil(x['x']) && !Z.Util.isNil(x['y'])) {
        //对象
        this.x = +(x['x']);
        this.y = +(x['y']);
    }
    if (this.isNaN()) {
        throw new Error('coordinate is NaN');
    }
};

Z.Util.extend(Z.Coordinate.prototype,/** @lends maptalks.Coordinate.prototype */{
    /**
     * Returns a copy of the coordinate
     * @return {maptalks.Coordinate} copy
     */
    copy:function() {
        return new Z.Coordinate(this.x, this.y);
    },

    //destructive add, to improve performance in some circumstances.
    _add: function(d) {
        this.x += d.x;
        this.y += d.y;
        return this;
    },
    /**
     * Returns the result of addition of another coordinate.
     * @param {maptalks.Coordinate} coordinate - coordinate to add
     * @return {maptalks.Coordinate} result
     */
    add:function(d) {
        return new Z.Coordinate(this.x+d.x, this.y+d.y);
    },

    //destructive substract
    _substract: function(d) {
        this.x -= d.x;
        this.y -= d.y;
        return this;
    },

    /**
     * Returns the result of subtraction of another coordinate.
     * @param {maptalks.Coordinate} coordinate - coordinate to substract
     * @return {maptalks.Coordinate} result
     */
    substract:function(d) {
        return new Z.Coordinate(this.x-d.x, this.y-d.y);
    },

    /**
     * Returns the result of multiplication of the current coordinate by the given number.
     * @param {Number} ratio - ratio to multi
     * @return {maptalks.Coordinate} result
     */
    multi: function(ratio) {
        return new Z.Coordinate(this.x*ratio, this.y*ratio);
    },

    _multi: function(ratio) {
        this.x *= ratio;
        this.y *= ratio;
        return this;
    },

    /**
     * Compare with another coordinate to see whether they are equal.
     * @param {maptalks.Coordinate} c2 - coordinate to compare
     * @return {Boolean}
     */
    equals:function(c2) {
        if (!Z.Util.isCoordinate(c2)) {
            return false;
        }
        return this.x === c2.x && this.y === c2.y;
    },

    isNaN:function() {
        return isNaN(this.x) || isNaN(this.y);
    },

    /**
     * Convert the coordinate to a number array [x, y]
     * @return {Number[]} number array
     */
    toArray:function() {
        return [this.x, this.y];
    }
});
