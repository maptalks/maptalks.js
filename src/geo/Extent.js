import { isNil, isNumber } from 'core/util';
import Coordinate from './Coordinate';
import Point from './Point';
import Size from './Size';

/**
 * Represent a bounding box on the map, a rectangular geographical area with minimum and maximum coordinates. <br>
 * There are serveral ways to create a extent:
 * @category basic types
 * @example
 * //with 4 numbers
 * var extent = new Extent(100, 10, 120, 20);
 * @example
 * //with 2 coordinates
 * var extent = new Extent(new Coordinate(100, 10), new Coordinate(120, 20));
 * @example
 * //with a json object containing xmin, ymin, xmax and ymax
 * var extent = new Extent({xmin : 100, ymin: 10, xmax: 120, ymax:20});
 * @example
 * var extent1 = new Extent(100, 10, 120, 20);
 * //with another extent
 * var extent2 = new Extent(extent1);
 */
class Extent {

    /**
     * @param {Number} x1   - x of coordinate 1
     * @param {Number} y1   - y of coordinate 1
     * @param {Number} x2   - x of coordinate 2
     * @param {Number} y2   - y of coordinate 2
     */
    constructor(p1, p2, p3, p4) {
        this._clazz = Coordinate;
        this._initialize(p1, p2, p3, p4);
    }

    _initialize(p1, p2, p3, p4) {
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
        if (isNil(p1)) {
            return;
        }
        //Constructor 1: all numbers
        if (isNumber(p1) &&
            isNumber(p2) &&
            isNumber(p3) &&
            isNumber(p4)) {
            this['xmin'] = Math.min(p1, p3);
            this['ymin'] = Math.min(p2, p4);
            this['xmax'] = Math.max(p1, p3);
            this['ymax'] = Math.max(p2, p4);
            return;
        } else if (Array.isArray(p1)) {
            this['xmin'] = Math.min(p1[0], p1[2]);
            this['ymin'] = Math.min(p1[1], p1[3]);
            this['xmax'] = Math.max(p1[0], p1[2]);
            this['ymax'] = Math.max(p1[1], p1[3]);
        } else if (isNumber(p1.x) &&
            isNumber(p2.x) &&
            isNumber(p1.y) &&
            isNumber(p2.y)) {
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
        } else if (isNumber(p1['xmin']) &&
            isNumber(p1['xmax']) &&
            isNumber(p1['ymin']) &&
            isNumber(p1['ymax'])) {
            this['xmin'] = p1['xmin'];
            this['ymin'] = p1['ymin'];
            this['xmax'] = p1['xmax'];
            this['ymax'] = p1['ymax'];
        }
    }

    _add(p) {
        if (!isNil(p.x)) {
            this['xmin'] += p.x;
            this['ymin'] += p.y;
            this['xmax'] += p.x;
            this['ymax'] += p.y;
        } else if (!isNil(p.xmin)) {
            this['xmin'] += p.xmin;
            this['ymin'] += p.ymin;
            this['xmax'] += p.xmax;
            this['ymax'] += p.ymax;
        } else if (!isNil(p[0])) {
            this['xmin'] += p[0];
            this['ymin'] += p[1];
            this['xmax'] += p[0];
            this['ymax'] += p[1];
        }
        return this;
    }

    /**
     * Add the extent with a coordinate or a point.
     * @param {Coordinate|Point} p - point or coordinate to add
     * @returns {Extent} a new extent
     */
    add() {
        const e = new this.constructor(this['xmin'], this['ymin'], this['xmax'], this['ymax']);
        return e._add.apply(e, arguments);
    }

    _sub(p) {
        if (!isNil(p.x)) {
            this['xmin'] -= p.x;
            this['ymin'] -= p.y;
            this['xmax'] -= p.x;
            this['ymax'] -= p.y;
        } else if (!isNil(p.xmin)) {
            this['xmin'] -= p.xmin;
            this['ymin'] -= p.ymin;
            this['xmax'] -= p.xmax;
            this['ymax'] -= p.ymax;
        } else if (!isNil(p[0])) {
            this['xmin'] -= p[0];
            this['ymin'] -= p[1];
            this['xmax'] -= p[0];
            this['ymax'] -= p[1];
        }
        return this;
    }

    _substract() {
        return this._sub.apply(this, arguments);
    }

    /**
     * Substract the extent with a coordinate or a point.
     * @param {Coordinate|Point} p - point or coordinate to substract
     * @returns {Extent} a new extent
     */
    sub() {
        const e = new this.constructor(this['xmin'], this['ymin'], this['xmax'], this['ymax']);
        return e._sub.apply(e, arguments);
    }

    /**
     * Alias for sub
     * @param {Coordinate|Point} p - point or coordinate to substract
     * @returns {Extent} a new extent
     */
    substract() {
        return this.sub.apply(this, arguments);
    }


    /**
     * Round the extent
     * @return {Extent} rounded extent
     */
    round() {
        return new this.constructor(Math.round(this['xmin']), Math.round(this['ymin']),
            Math.round(this['xmax']), Math.round(this['ymax']));
    }

    _round() {
        this['xmin'] = Math.round(this['xmin']);
        this['ymin'] = Math.round(this['ymin']);
        this['xmax'] = Math.round(this['xmax']);
        this['ymax'] = Math.round(this['ymax']);
        return this;
    }

    /**
     * Get the minimum point
     * @return {Coordinate}
     */
    getMin() {
        return new this._clazz(this['xmin'], this['ymin']);
    }

    /**
     * Get the maximum point
     * @return {Coordinate}
     */
    getMax() {
        return new this._clazz(this['xmax'], this['ymax']);
    }

    /**
     * Get center of the extent.
     * @return {Coordinate}
     */
    getCenter() {
        return new this._clazz((this['xmin'] + this['xmax']) / 2, (this['ymin'] + this['ymax']) / 2);
    }

    /**
     * Whether the extent is valid
     * @protected
     * @return {Boolean}
     */
    isValid() {
        return isNumber(this['xmin']) &&
            isNumber(this['ymin']) &&
            isNumber(this['xmax']) &&
            isNumber(this['ymax']);
    }

    /**
     * Compare with another extent to see whether they are equal.
     * @param  {Extent}  ext2 - extent to compare
     * @return {Boolean}
     */
    equals(ext2) {
        return (this['xmin'] === ext2['xmin'] &&
            this['xmax'] === ext2['xmax'] &&
            this['ymin'] === ext2['ymin'] &&
            this['ymax'] === ext2['ymax']);
    }

    /**
     * Whether it intersects with another extent
     * @param  {Extent}  ext2 - another extent
     * @return {Boolean}
     */
    intersects(ext2) {
        const rxmin = Math.max(this['xmin'], ext2['xmin']);
        const rymin = Math.max(this['ymin'], ext2['ymin']);
        const rxmax = Math.min(this['xmax'], ext2['xmax']);
        const rymax = Math.min(this['ymax'], ext2['ymax']);
        const intersects = !((rxmin > rxmax) || (rymin > rymax));
        return intersects;
    }

    /**
     * Whether the extent is within another extent
     * @param  {Extent}  ext2 - another extent
     * @returns {Boolean}
     */
    within(extent) {
        return this.xmin >= extent.xmin && this.xmax <= extent.xmax && this.ymin >= extent.ymin && this.ymax <= extent.ymax;
    }

    /**
     * Whether the extent contains the input point.
     * @param  {Coordinate|Number[]} coordinate - input point
     * @returns {Boolean}
     */
    contains(c) {
        return (c.x >= this.xmin) &&
            (c.x <= this.xmax) &&
            (c.y >= this.ymin) &&
            (c.y <= this.ymax);
    }

    /**
     * Get the width of the Extent
     * @return {Number}
     */
    getWidth() {
        return this['xmax'] - this['xmin'];
    }

    /**
     * Get the height of the Extent
     * @return {Number}
     */
    getHeight() {
        return this['ymax'] - this['ymin'];
    }

    __combine(extent) {
        if ((extent instanceof Point) || (extent instanceof Coordinate)) {
            extent = {
                'xmin': extent.x,
                'xmax': extent.x,
                'ymin': extent.y,
                'ymax': extent.y
            };
        }
        let xmin = this['xmin'];
        if (!isNumber(xmin)) {
            xmin = extent['xmin'];
        } else if (isNumber(extent['xmin'])) {
            if (xmin > extent['xmin']) {
                xmin = extent['xmin'];
            }
        }

        let xmax = this['xmax'];
        if (!isNumber(xmax)) {
            xmax = extent['xmax'];
        } else if (isNumber(extent['xmax'])) {
            if (xmax < extent['xmax']) {
                xmax = extent['xmax'];
            }
        }

        let ymin = this['ymin'];
        if (!isNumber(ymin)) {
            ymin = extent['ymin'];
        } else if (isNumber(extent['ymin'])) {
            if (ymin > extent['ymin']) {
                ymin = extent['ymin'];
            }
        }

        let ymax = this['ymax'];
        if (!isNumber(ymax)) {
            ymax = extent['ymax'];
        } else if (isNumber(extent['ymax'])) {
            if (ymax < extent['ymax']) {
                ymax = extent['ymax'];
            }
        }
        return [xmin, ymin, xmax, ymax];
    }

    _combine(extent) {
        if (!extent) {
            return this;
        }
        const ext = this.__combine(extent);
        this['xmin'] = ext[0];
        this['ymin'] = ext[1];
        this['xmax'] = ext[2];
        this['ymax'] = ext[3];
        return this;
    }

    /**
     * Combine it with another extent to a larger extent.
     * @param  {Extent} extent - another extent
     * @returns {Extent} extent combined
     */
    combine(extent) {
        if (!extent) {
            return this;
        }
        const ext = this.__combine(extent);
        return new this.constructor(ext[0], ext[1], ext[2], ext[3]);
    }

    /**
     * Gets the intersection extent of this and another extent.
     * @param  {Extent} extent - another extent
     * @return {Extent} intersection extent
     */
    intersection(extent) {
        if (!this.intersects(extent)) {
            return null;
        }
        return new this.constructor(Math.max(this['xmin'], extent['xmin']), Math.max(this['ymin'], extent['ymin']),
            Math.min(this['xmax'], extent['xmax']), Math.min(this['ymax'], extent['ymax'])
        );
    }

    /**
     * Expand the extent by distance
     * @param  {Size|Number} distance  - distance to expand
     * @returns {Extent} a new extent expanded from
     */
    expand(distance) {
        if (distance instanceof Size) {
            return new this.constructor(this['xmin'] - distance['width'], this['ymin'] - distance['height'], this['xmax'] + distance['width'], this['ymax'] + distance['height']);
        } else {
            return new this.constructor(this['xmin'] - distance, this['ymin'] - distance, this['xmax'] + distance, this['ymax'] + distance);
        }
    }

    _expand(distance) {
        if (distance instanceof Size) {
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
    }

    /**
     * Get extent's JSON object.
     * @return {Object} jsonObject
     * @example
     * // {xmin : 100, ymin: 10, xmax: 120, ymax:20}
     * var json = extent.toJSON();
     */
    toJSON() {
        return {
            'xmin': this['xmin'],
            'ymin': this['ymin'],
            'xmax': this['xmax'],
            'ymax': this['ymax']
        };
    }

    /**
     * Get a coordinate array of extent's rectangle area, containing 5 coordinates in which the first equals with the last.
     * @return {Coordinate[]} coordinates array
     */
    toArray() {
        const xmin = this['xmin'],
            ymin = this['ymin'],
            xmax = this['xmax'],
            ymax = this['ymax'];
        return [
            new this._clazz([xmin, ymax]), new this._clazz([xmax, ymax]),
            new this._clazz([xmax, ymin]), new this._clazz([xmin, ymin]),
            new this._clazz([xmin, ymax])
        ];
    }

    /**
     * Get a copy of the extent.
     * @return {Extent} copy
     */
    copy() {
        return new this.constructor(this['xmin'], this['ymin'], this['xmax'], this['ymax']);
    }

    /**
     * Convert to a new extent
     * @param  {Function} fn convert function on each point
     * @return {Extent}
     */
    convertTo(fn) {
        if (!this.isValid()) {
            return null;
        }
        const e = new this.constructor();
        this.toArray().forEach(c => {
            e._combine(fn(c));
        });
        return e;
    }
}

export default Extent;
