/**
 * Represent a bounding box on the map, a rectangular geographical area with minimum and maximum coordinates. <br>
 * There are serveral ways to create a extent:
 * @class
 * @category basic types
 * @param {Number} x1   - x of coordinate 1
 * @param {Number} y1   - y of coordinate 1
 * @param {Number} x2   - x of coordinate 2
 * @param {Number} y2   - y of coordinate 2
 * @example
 * //with 4 numbers
 * var extent = new maptalks.Extent(100, 10, 120, 20);
 * @example
 * //with 2 coordinates
 * var extent = new maptalks.Extent(new maptalks.Coordinate(100, 10), new maptalks.Coordinate(120, 20));
 * @example
 * //with a json object containing xmin, ymin, xmax and ymax
 * var extent = new maptalks.Extent({xmin : 100, ymin: 10, xmax: 120, ymax:20});
 * @example
 * var extent1 = new maptalks.Extent(100, 10, 120, 20);
 * //with another extent
 * var extent2 = new maptalks.Extent(extent1);
 */
Z.Extent = function (p1, p2, p3, p4) {
    this._clazz = Z.Coordinate;
    this._initialize(p1, p2, p3, p4);
};

Z.Util.extend(Z.Extent.prototype, /** @lends maptalks.Extent.prototype */{
    _initialize:function (p1, p2, p3, p4) {
        /**
         * @property {Number} xmin - minimum x
         */
        this.xmin = null;
        /**
         * @property {Number} xmax - maximum x
         */
        this.xmax = null;
        /**
         * @property {Number} ymin - minimum y
         */
        this.ymin = null;
        /**
         * @property {Number} ymax - maximum y
         */
        this.ymax = null;
        if (Z.Util.isNil(p1)) {
            return;
        }
        //Constructor 1: all numbers
        if (Z.Util.isNumber(p1) &&
            Z.Util.isNumber(p2) &&
            Z.Util.isNumber(p3) &&
            Z.Util.isNumber(p4)) {
            this['xmin'] = Math.min(p1, p3);
            this['ymin'] = Math.min(p2, p4);
            this['xmax'] = Math.max(p1, p3);
            this['ymax'] = Math.max(p2, p4);
            return;
        } else if (Z.Util.isNumber(p1.x) &&
            Z.Util.isNumber(p2.x) &&
            Z.Util.isNumber(p1.y) &&
            Z.Util.isNumber(p2.y)) {
            //Constructor 2: two coordinates
            if (p1.x > p2.x) {
                this['xmin'] = p2.x;
                this['xmax'] = p1.x;
            } else {
                this['xmin'] = p1.x;
                this['xmax'] = p2.x;
            }
            if (p1.y > p2.y) {
                this['ymin'] = p2.y;
                this['ymax'] = p1.y;
            } else {
                this['ymin'] = p1.y;
                this['ymax'] = p2.y;
            }
            //constructor 3: another extent or a object containing xmin, ymin, xmax and ymax
        } else if (Z.Util.isNumber(p1['xmin']) &&
                Z.Util.isNumber(p1['xmax']) &&
                Z.Util.isNumber(p1['ymin']) &&
                Z.Util.isNumber(p1['ymax'])) {
            this['xmin'] = p1['xmin'];
            this['ymin'] = p1['ymin'];
            this['xmax'] = p1['xmax'];
            this['ymax'] = p1['ymax'];
        }
    },

    _add: function (p) {
        this['xmin'] += p.x;
        this['ymin'] += p.y;
        this['xmax'] += p.x;
        this['ymax'] += p.y;
        return this;
    },

    /**
     * Add the extent with a coordinate or a point.
     * @param {maptalks.Coordinate|maptalks.Point} p - point or coordinate to add
     * @returns {maptalks.Extent} a new extent
     */
    add: function (p) {
        return new this.constructor(this['xmin'] + p.x, this['ymin'] + p.y, this['xmax'] + p.x, this['ymax'] + p.y);
    },

    _substract: function (p) {
        this['xmin'] -= p.x;
        this['ymin'] -= p.y;
        this['xmax'] -= p.x;
        this['ymax'] -= p.y;
        return this;
    },

    /**
     * Substract the extent with a coordinate or a point.
     * @param {maptalks.Coordinate|maptalks.Point} p - point or coordinate to substract
     * @returns {maptalks.Extent} a new extent
     */
    substract: function (p) {
        return new this.constructor(this['xmin'] - p.x, this['ymin'] - p.y, this['xmax'] - p.x, this['ymax'] - p.y);
    },

    /**
     * Round the extent
     * @return {maptalks.Extent} rounded extent
     */
    round:function () {
        return new this.constructor(Z.Util.round(this['xmin']), Z.Util.round(this['ymin']),
            Z.Util.round(this['xmax']), Z.Util.round(this['ymax']));
    },

    _round:function () {
        this['xmin'] = Z.Util.round(this['xmin']);
        this['ymin'] = Z.Util.round(this['ymin']);
        this['xmax'] = Z.Util.round(this['xmax']);
        this['ymax'] = Z.Util.round(this['ymax']);
        return this;
    },

    /**
     * Get the minimum point
     * @return {maptalks.Coordinate}
     */
    getMin:function () {
        return new this._clazz(this['xmin'], this['ymin']);
    },

    /**
     * Get the maximum point
     * @return {maptalks.Coordinate}
     */
    getMax:function () {
        return new this._clazz(this['xmax'], this['ymax']);
    },


    /**
     * Get center of the extent.
     * @return {maptalks.Coordinate}
     */
    getCenter:function () {
        return new this._clazz((this['xmin'] + this['xmax']) / 2, (this['ymin'] + this['ymax']) / 2);
    },

    /**
     * Whether the extent is valid
     * @protected
     * @return {Boolean}
     */
    isValid:function () {
        return Z.Util.isNumber(this['xmin']) &&
                Z.Util.isNumber(this['ymin']) &&
                Z.Util.isNumber(this['xmax']) &&
                Z.Util.isNumber(this['ymax']);
    },


    /**
     * Compare with another extent to see whether they are equal.
     * @param  {maptalks.Extent}  ext2 - extent to compare
     * @return {Boolean}
     */
    equals:function (ext2) {
        return (this['xmin'] === ext2['xmin'] &&
            this['xmax'] === ext2['xmax'] &&
            this['ymin'] === ext2['ymin'] &&
            this['ymax'] === ext2['ymax']);
    },

    /**
     * Whether it intersects with another extent
     * @param  {maptalks.Extent}  ext2 - another extent
     * @return {Boolean}
     */
    intersects:function (ext2) {
        var rxmin = Math.max(this['xmin'], ext2['xmin']);
        var rymin = Math.max(this['ymin'], ext2['ymin']);
        var rxmax = Math.min(this['xmax'], ext2['xmax']);
        var rymax = Math.min(this['ymax'], ext2['ymax']);
        var intersects = !((rxmin > rxmax) || (rymin > rymax));
        return intersects;
    },

    /**
     * Whether the extent contains the input point.
     * @param  {maptalks.Coordinate|Number[]} coordinate - input point
     * @returns {Boolean}
     */
    contains: function (coordinate) {
        var x, y;
        var c = new this._clazz(coordinate);
        x = c.x;
        y = c.y;
        return (x >= this.xmin) &&
            (x <= this.xmax) &&
            (y >= this.ymin) &&
            (y <= this.ymax);
    },

    /**
     * Get the width of the Extent
     * @return {Number}
     */
    getWidth:function () {
        return this['xmax'] - this['xmin'];
    },

    /**
     * Get the height of the Extent
     * @return {Number}
     */
    getHeight:function () {
        return this['ymax'] - this['ymin'];
    },


    __combine:function (extent) {
        var xmin = this['xmin'];
        if (!Z.Util.isNumber(xmin)) {
            xmin = extent['xmin'];
        } else if (Z.Util.isNumber(extent['xmin'])) {
            if (xmin > extent['xmin']) {
                xmin = extent['xmin'];
            }
        }

        var xmax = this['xmax'];
        if (!Z.Util.isNumber(xmax)) {
            xmax = extent['xmax'];
        } else if (Z.Util.isNumber(extent['xmax'])) {
            if (xmax < extent['xmax']) {
                xmax = extent['xmax'];
            }
        }

        var ymin = this['ymin'];
        if (!Z.Util.isNumber(ymin)) {
            ymin = extent['ymin'];
        } else if (Z.Util.isNumber(extent['ymin'])) {
            if (ymin > extent['ymin']) {
                ymin = extent['ymin'];
            }
        }

        var ymax = this['ymax'];
        if (!Z.Util.isNumber(ymax)) {
            ymax = extent['ymax'];
        } else if (Z.Util.isNumber(extent['ymax'])) {
            if (ymax < extent['ymax']) {
                ymax = extent['ymax'];
            }
        }
        return [xmin, ymin, xmax, ymax];
    },

    _combine:function (extent) {
        if (!extent) {
            return this;
        }
        var ext = this.__combine(extent);
        this['xmin'] = ext[0];
        this['ymin'] = ext[1];
        this['xmax'] = ext[2];
        this['ymax'] = ext[3];
        return this;
    },

    /**
     * Combine it with another extent to a larger extent.
     * @param  {maptalks.Extent} extent - another extent
     * @returns {maptalks.Extent} extent combined
     */
    combine:function (extent) {
        if (!extent) {
            return this;
        }
        var ext = this.__combine(extent);
        return new this.constructor(ext[0], ext[1], ext[2], ext[3]);
    },

    /**
     * Gets the intersection extent of this and another extent.
     * @param  {maptalks.Extent} extent - another extent
     * @return {maptalks.Extent} intersection extent
     */
    intersection:function (extent) {
        if (!this.intersects(extent)) {
            return null;
        }
        return new this.constructor(Math.max(this['xmin'], extent['xmin']), Math.max(this['ymin'], extent['ymin']),
            Math.min(this['xmax'], extent['xmax']), Math.min(this['ymax'], extent['ymax'])
            );
    },

    /**
     * Expand the extent by distance
     * @param  {maptalks.Size|Number} distance  - distance to expand
     * @returns {maptalks.Extent} a new extent expanded from
     */
    expand:function (distance) {
        if (distance instanceof Z.Size) {
            return new this.constructor(this['xmin'] - distance['width'], this['ymin'] - distance['height'], this['xmax'] + distance['width'], this['ymax'] + distance['height']);
        } else {
            return new this.constructor(this['xmin'] - distance, this['ymin'] - distance, this['xmax'] + distance, this['ymax'] + distance);
        }
    },

    _expand:function (distance) {
        if (distance instanceof Z.Size) {
            this['xmin'] -= distance['width'];
            this['ymin'] -= distance['height'];
            this['xmax'] += distance['width'];
            this['ymax'] += distance['height'];
        } else {
            this['xmin'] -= distance;
            this['ymin'] -= distance;
            this['xmax'] += distance;
            this['ymax'] += distance;
        }
        return this;
    },

    /**
     * Get extent's JSON object.
     * @return {Object} jsonObject
     * @example
     * // {xmin : 100, ymin: 10, xmax: 120, ymax:20}
     * var json = extent.toJSON();
     */
    toJSON:function () {
        return {
            'xmin':this['xmin'],
            'ymin':this['ymin'],
            'xmax':this['xmax'],
            'ymax':this['ymax']
        };
    },

    /**
     * Get a coordinate array of extent's rectangle area, containing 5 coordinates in which the first equals with the last.
     * @return {maptalks.Coordinate[]} coordinates array
     */
    toArray:function () {
        var xmin = this['xmin'],
            ymin = this['ymin'],
            xmax = this['xmax'],
            ymax = this['ymax'];
        return [
            new this._clazz([xmin, ymax]), new this._clazz([xmax, ymax]),
            new this._clazz([xmax, ymin]), new this._clazz([xmin, ymin]),
            new this._clazz([xmin, ymax])
        ];
    },

    /**
     * Get a copy of the extent.
     * @return {maptalks.Extent} copy
     */
    copy:function () {
        return new this.constructor(this['xmin'], this['ymin'], this['xmax'], this['ymax']);
    }
});
