import { isNil, isNumber } from '../core/util';
import Coordinate from './Coordinate';
import Point from './Point';
import Size from './Size';

//temparary variables
const TEMP_POINT0 = new Point(0, 0);
const TEMP_COORD0 = new Coordinate(0, 0);
const TEMP_COORD1 = new Coordinate(0, 0);
const TEMP_COORD2 = new Coordinate(0, 0);
const TEMP_COORD3 = new Coordinate(0, 0);
const TEMP_COORD4 = new Coordinate(0, 0);
const TEMP_COORD5 = new Coordinate(0, 0);
const TEMP_COORD6 = new Coordinate(0, 0);
const TEMP_COORD7 = new Coordinate(0, 0);
const MINMAX = [];
/* eslint-disable prefer-const */
let TEMP_EXTENT;
/* eslint-enable prefer-const */
const TEMP_COMBINE = [];

/**
 * Represent a bounding box on the map, a rectangular geographical area with minimum and maximum coordinates. <br>
 * There are serveral ways to create a extent:
 * @category basic types
 * @example
 * //with 4 numbers: xmin, ymin, xmax and ymax
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
        const l = arguments.length;
        const proj = l > 0 ? arguments[l - 1] : null;
        if (proj && proj.unproject) {
            this.projection = arguments[l - 1];
        }
        this._dirty = true;
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
        const projection = this.projection;
        //Constructor 1: all numbers
        if (isNumber(p1) &&
            isNumber(p2) &&
            isNumber(p3) &&
            isNumber(p4)) {
            if (projection) {
                this.set(p1, p2, p3, p4);
            } else {
                this.set(
                    Math.min(p1, p3),
                    Math.min(p2, p4),
                    Math.max(p1, p3),
                    Math.max(p2, p4)
                );
            }
            return;
        } else if (Array.isArray(p1)) {
            if (projection) {
                this.set(p1[0], p1[1], p1[2], p1[3]);
            } else {
                this.set(
                    Math.min(p1[0], p1[2]),
                    Math.min(p1[1], p1[3]),
                    Math.max(p1[0], p1[2]),
                    Math.max(p1[1], p1[3])
                );
            }
        } else if (isNumber(p1.x) &&
            isNumber(p2.x) &&
            isNumber(p1.y) &&
            isNumber(p2.y)) {
            //Constructor 2: two coordinates
            if (projection) {
                this.set(p1.x, p1.y, p2.x, p2.y);
            } else {
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
            }
            //constructor 3: another extent or a object containing xmin, ymin, xmax and ymax
        } else if (isNumber(p1['xmin']) &&
            isNumber(p1['xmax']) &&
            isNumber(p1['ymin']) &&
            isNumber(p1['ymax'])) {
            this.set(p1['xmin'], p1['ymin'], p1['xmax'], p1['ymax']);
        }
    }

    _add(p) {
        this._dirty = true;
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
        const e = new this.constructor(this['xmin'], this['ymin'], this['xmax'], this['ymax'], this.projection);
        return e._add.apply(e, arguments);
    }

    _scale(s) {
        this._dirty = true;
        this['xmin'] *= s;
        this['ymin'] *= s;
        this['xmax'] *= s;
        this['ymax'] *= s;
        return this;
    }

    _sub(p) {
        this._dirty = true;
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
        const e = new this.constructor(this['xmin'], this['ymin'], this['xmax'], this['ymax'], this.projection);
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
            Math.round(this['xmax']), Math.round(this['ymax']), this.projection);
    }

    _round() {
        this._dirty = true;
        this['xmin'] = Math.round(this['xmin']);
        this['ymin'] = Math.round(this['ymin']);
        this['xmax'] = Math.round(this['xmax']);
        this['ymax'] = Math.round(this['ymax']);
        return this;
    }

    /**
     * Get the minimum point
     * @params {Coorindate} [out=undefined] - optional point to receive result
     * @return {Coordinate}
     */
    getMin(out) {
        if (out) {
            out.set(this['xmin'], this['ymin']);
            return out;
        }
        return new this._clazz(this['xmin'], this['ymin']);
    }

    /**
     * Get the maximum point
     * @params {Coorindate} [out=undefined] - optional point to receive result
     * @return {Coordinate}
     */
    getMax(out) {
        if (out) {
            out.set(this['xmax'], this['ymax']);
            return out;
        }
        return new this._clazz(this['xmax'], this['ymax']);
    }

    /**
     * Get center of the extent.
     * @params {Coorindate} [out=undefined] - optional point to receive result
     * @return {Coordinate}
     */
    getCenter(out) {
        const x = (this['xmin'] + this['xmax']) / 2;
        const y = (this['ymin'] + this['ymax']) / 2;
        if (out) {
            out.set(x, y);
            return out;
        }
        return new this._clazz(x, y);
    }

    /**
     * Whether the extent is valid
     * @protected
     * @return {Boolean}
     */
    isValid() {
        return !isNil(this['xmin']) &&
            !isNil(this['ymin']) &&
            !isNil(this['xmax']) &&
            !isNil(this['ymax']);
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
        this._project(this);
        this._project(ext2);
        const rxmin = Math.max(this['pxmin'], ext2['pxmin']);
        const rymin = Math.max(this['pymin'], ext2['pymin']);
        const rxmax = Math.min(this['pxmax'], ext2['pxmax']);
        const rymax = Math.min(this['pymax'], ext2['pymax']);
        const intersects = !((rxmin > rxmax) || (rymin > rymax));
        return intersects;
    }

    /**
     * Whether the extent is within another extent
     * @param  {Extent}  ext2 - another extent
     * @returns {Boolean}
     */
    within(extent) {
        this._project(this);
        this._project(extent);
        return this.pxmin >= extent.pxmin && this.pxmax <= extent.pxmax && this.pymin >= extent.pymin && this.pymax <= extent.pymax;
    }

    /**
     * Whether the extent contains the input point.
     * @param  {Coordinate|Number[]} coordinate - input point
     * @returns {Boolean}
     */
    contains(c) {
        if (!c) {
            return false;
        }
        this._project(this);
        const proj = this.projection;
        if (proj) {
            if (c.x !== undefined) {
                const coord = TEMP_COORD0;
                if (Array.isArray(c)) {
                    coord.x = c[0];
                    coord.y = c[1];
                } else {
                    coord.x = c.x;
                    coord.y = c.y;
                }
                c = proj.project(coord, coord);
            } else if (c.xmin !== undefined) {
                this._project(c);
            }
        }
        return ((c.x || c.pxmin || 0) >= this.pxmin) &&
            ((c.x || c.pxmax || 0) <= this.pxmax) &&
            ((c.y || c.pymin || 0) >= this.pymin) &&
            ((c.y || c.pymax || 0) <= this.pymax);
    }

    /**
     * Get the width of the Extent
     * @return {Number}
     */
    getWidth() {
        return Math.abs(this['xmax'] - this['xmin']);
    }

    /**
     * Get the height of the Extent
     * @return {Number}
     */
    getHeight() {
        return Math.abs(this['ymax'] - this['ymin']);
    }

    /**
     * Get size of the Extent
     * @return {Size}
     */
    getSize() {
        return new Size(this.getWidth(), this.getHeight());
    }

    set(xmin, ymin, xmax, ymax) {
        this.xmin = xmin;
        this.ymin = ymin;
        this.xmax = xmax;
        this.ymax = ymax;
        this._dirty = true;
        return this;
    }

    __combine(extent) {
        if (extent.x !== undefined) {
            TEMP_EXTENT.xmin = TEMP_EXTENT.xmax = extent.x;
            TEMP_EXTENT.ymin = TEMP_EXTENT.ymax = extent.y;
            extent = TEMP_EXTENT;
        }
        this._project(extent);
        this._project(this);
        const inited = isNumber(this.pxmin);
        let xmin, ymin, xmax, ymax;
        if (!inited) {
            xmin = extent['pxmin'];
            ymin = extent['pymin'];
            xmax = extent['pxmax'];
            ymax = extent['pymax'];
        } else {
            xmin = Math.min(this['pxmin'], extent['pxmin']);
            ymin = Math.min(this['pymin'], extent['pymin']);
            xmax = Math.max(this['pxmax'], extent['pxmax']);
            ymax = Math.max(this['pymax'], extent['pymax']);
        }
        const proj = this.projection;
        if (proj) {
            TEMP_COORD1.set(xmin, ymin);
            TEMP_COORD2.set(xmax, ymax);
            const min = proj.unproject(TEMP_COORD1, TEMP_COORD1),
                max = proj.unproject(TEMP_COORD2, TEMP_COORD2);
            xmin = min.x;
            ymin = min.y;
            xmax = max.x;
            ymax = max.y;
        }
        TEMP_COMBINE[0] = xmin;
        TEMP_COMBINE[1] = ymin;
        TEMP_COMBINE[2] = xmax;
        TEMP_COMBINE[3] = ymax;
        return TEMP_COMBINE;
    }

    _combine(extent) {
        if (!extent || extent.isValid && !extent.isValid()) {
            return this;
        }
        const ext = this.__combine(extent);
        this.set(ext[0], ext[1], ext[2], ext[3]);
        this._dirty = true;
        return this;
    }

    /**
     * Combine it with another extent to a larger extent.
     * @param  {Extent|Coordinate|Point} extent - extent/coordinate/point to combine into
     * @returns {Extent} extent combined
     */
    combine(extent) {
        if (!extent || extent.isValid && !extent.isValid()) {
            return this;
        }
        const ext = this.__combine(extent);
        return new this.constructor(ext[0], ext[1], ext[2], ext[3], this.projection);
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
        TEMP_COORD3.x = Math.max(this['pxmin'], extent['pxmin']);
        TEMP_COORD3.y = Math.max(this['pymin'], extent['pymin']);
        TEMP_COORD4.x = Math.min(this['pxmax'], extent['pxmax']);
        TEMP_COORD4.y = Math.min(this['pymax'], extent['pymax']);
        let min = TEMP_COORD3,
            max = TEMP_COORD4;
        const proj = this.projection;
        if (proj) {
            min = proj.unproject(min, min);
            max = proj.unproject(max, max);
        }
        return new this.constructor(min, max, proj);
    }

    /**
     * Expand the extent by distance
     * @param  {Size|Number} distance  - distance to expand
     * @returns {Extent} a new extent expanded from
     */
    expand(distance) {
        let w, h;
        if (!isNumber(distance)) {
            w = distance['width'] || distance['x'] || distance[0] || 0;
            h = distance['height'] || distance['y'] || distance[1] || 0;
        } else {
            w = h = distance;
        }
        return new this.constructor(this['xmin'] - w, this['ymin'] - h, this['xmax'] + w, this['ymax'] + h, this.projection);
    }

    _expand(distance) {
        let w, h;
        if (!isNumber(distance)) {
            w = distance['width'] || distance['x'] || distance[0] || 0;
            h = distance['height'] || distance['y'] || distance[1] || 0;
        } else {
            w = h = distance;
        }
        this['xmin'] -= w;
        this['ymin'] -= h;
        this['xmax'] += w;
        this['ymax'] += h;
        this._dirty = true;
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

    toString() {
        return `${this.xmin},${this.ymin},${this.xmax},${this.ymax}`;
    }

    /**
     * Get a copy of the extent.
     * @return {Extent} copy
     */
    copy() {
        return new this.constructor(this['xmin'], this['ymin'], this['xmax'], this['ymax'], this.projection);
    }

    /**
     * Convert to a new extent
     * @param  {Function} fn convert function on each point
     * @return {Extent}
     */
    convertTo(fn, out) {
        if (!this.isValid()) {
            return null;
        }
        const e = out || new this.constructor();
        if (out) {
            e.set(null, null, null, null);
        }
        let coord;
        if (this._clazz === Coordinate) {
            coord = TEMP_COORD5;
        } else if (this._clazz === Point) {
            coord = TEMP_POINT0;
        }
        coord.x = this.xmin;
        coord.y = this.ymax;
        e._combine(fn(coord));
        coord.x = this.xmax;
        e._combine(fn(coord));
        coord.y = this.ymin;
        e._combine(fn(coord));
        coord.x = this.xmin;
        e._combine(fn(coord));
        return e;
    }

    _project(ext) {
        if (!ext || !ext.isValid()) {
            if (ext) {
                ext.pxmin = ext.pxmax = ext.pymin = ext.pymax = null;
            }
            return;
        }
        const proj = this.projection;
        if (proj) {
            //FIXME a rare but potential bug:
            //An extent may be projected by multiple projection
            if (ext._dirty) {
                TEMP_COORD6.set(ext.xmax, ext.ymin);
                TEMP_COORD7.set(ext.xmin, ext.ymax);
                MINMAX[0] = TEMP_COORD6;
                MINMAX[1] = TEMP_COORD7;
                const minmax = proj.projectCoords(MINMAX);
                const min = minmax[0],
                    max = minmax[1];
                ext.pxmin = Math.min(min.x, max.x);
                ext.pymin = Math.min(min.y, max.y);
                ext.pxmax = Math.max(min.x, max.x);
                ext.pymax = Math.max(min.y, max.y);
            }
            delete ext._dirty;
        } else {
            ext.pxmin = ext.xmin;
            ext.pxmax = ext.xmax;
            ext.pymin = ext.ymin;
            ext.pymax = ext.ymax;
        }
    }
}

TEMP_EXTENT = new Extent(0, 0, 0, 0);

export default Extent;
