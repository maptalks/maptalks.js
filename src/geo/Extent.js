import { isNil, isNumber } from '../core/util';
import Coordinate from './Coordinate';
import Size from './Size';

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
                this['xmin'] = p1;
                this['ymin'] = p2;
                this['xmax'] = p3;
                this['ymax'] = p4;
            } else {
                this['xmin'] = Math.min(p1, p3);
                this['ymin'] = Math.min(p2, p4);
                this['xmax'] = Math.max(p1, p3);
                this['ymax'] = Math.max(p2, p4);
            }
            return;
        } else if (Array.isArray(p1)) {
            if (projection) {
                this['xmin'] = p1[0];
                this['ymin'] = p1[1];
                this['xmax'] = p1[2];
                this['ymax'] = p1[3];
            } else {
                this['xmin'] = Math.min(p1[0], p1[2]);
                this['ymin'] = Math.min(p1[1], p1[3]);
                this['xmax'] = Math.max(p1[0], p1[2]);
                this['ymax'] = Math.max(p1[1], p1[3]);
            }
        } else if (isNumber(p1.x) &&
            isNumber(p2.x) &&
            isNumber(p1.y) &&
            isNumber(p2.y)) {
            //Constructor 2: two coordinates
            if (projection) {
                this['xmin'] = p1.x;
                this['ymin'] = p1.y;
                this['xmax'] = p2.x;
                this['ymax'] = p2.y;
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
            this['xmin'] = p1['xmin'];
            this['ymin'] = p1['ymin'];
            this['xmax'] = p1['xmax'];
            this['ymax'] = p1['ymax'];
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
        if (Array.isArray(c)) {
            c = new this._clazz(c);
        }
        if (proj) {
            c = proj.project(c);
        }
        return (c.x >= this.pxmin) &&
            (c.x <= this.pxmax) &&
            (c.y >= this.pymin) &&
            (c.y <= this.pymax);
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

    __combine(extent) {
        if (!(extent instanceof this.constructor)) {
            extent = new this.constructor(extent, extent);
        }
        this._project(extent);
        this._project(this);
        let xmin = this['pxmin'];
        if (!isNumber(xmin)) {
            xmin = extent['pxmin'];
        } else if (isNumber(extent['pxmin'])) {
            if (xmin > extent['pxmin']) {
                xmin = extent['pxmin'];
            }
        }

        let xmax = this['pxmax'];
        if (!isNumber(xmax)) {
            xmax = extent['pxmax'];
        } else if (isNumber(extent['pxmax'])) {
            if (xmax < extent['pxmax']) {
                xmax = extent['pxmax'];
            }
        }

        let ymin = this['pymin'];
        if (!isNumber(ymin)) {
            ymin = extent['pymin'];
        } else if (isNumber(extent['pymin'])) {
            if (ymin > extent['pymin']) {
                ymin = extent['pymin'];
            }
        }

        let ymax = this['pymax'];
        if (!isNumber(ymax)) {
            ymax = extent['pymax'];
        } else if (isNumber(extent['pymax'])) {
            if (ymax < extent['pymax']) {
                ymax = extent['pymax'];
            }
        }
        const proj = this.projection;
        if (proj) {
            const min = proj.unproject(new this._clazz(xmin, ymin)),
                max = proj.unproject(new this._clazz(xmax, ymax));
            xmin = min.x;
            ymin = min.y;
            xmax = max.x;
            ymax = max.y;
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
        this._dirty = true;
        return this;
    }

    /**
     * Combine it with another extent to a larger extent.
     * @param  {Extent|Coordinate|Point} extent - extent/coordinate/point to combine into
     * @returns {Extent} extent combined
     */
    combine(extent) {
        if (!extent) {
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
        let min = new this._clazz(Math.max(this['pxmin'], extent['pxmin']), Math.max(this['pymin'], extent['pymin'])),
            max = new this._clazz(Math.min(this['pxmax'], extent['pxmax']), Math.min(this['pymax'], extent['pymax']));
        const proj = this.projection;
        if (proj) {
            min = proj.unproject(min);
            max = proj.unproject(max);
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
    convertTo(fn) {
        if (!this.isValid()) {
            return null;
        }
        const e = new this.constructor();
        const coord = new this._clazz(this.xmin, this.ymax);
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
            return;
        }
        const proj = this.projection;
        if (proj) {
            //FIXME a rare but potential bug:
            //An extent may be projected by multiple projection
            if (ext._dirty) {
                let minmax = [ext.getMin(), ext.getMax()];
                minmax = proj.projectCoords(minmax);
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

export default Extent;
