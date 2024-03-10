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
declare class Extent {
    _clazz: any;
    projection: any;
    _dirty: boolean;
    xmin: number;
    ymin: number;
    xmax: number;
    ymax: number;
    pxmin: number;
    pymin: number;
    pxmax: number;
    pymax: number;
    left: number;
    right: number;
    top: number;
    bottom: number;
    /**
     * @param {Number} x1   - x of coordinate 1
     * @param {Number} y1   - y of coordinate 1
     * @param {Number} x2   - x of coordinate 2
     * @param {Number} y2   - y of coordinate 2
     */
    constructor(p1?: any, p2?: any, p3?: any, p4?: any);
    _initialize(p1: any, p2: any, p3: any, p4: any): void;
    _add(p: any): this;
    /**
     * Add the extent with a coordinate or a point.
     * @param {Coordinate|Point} p - point or coordinate to add
     * @returns {Extent} a new extent
     */
    add(): any;
    _scale(s: any): this;
    _sub(p: any): this;
    _substract(): any;
    /**
     * Substract the extent with a coordinate or a point.
     * @param {Coordinate|Point} p - point or coordinate to substract
     * @returns {Extent} a new extent
     */
    sub(): any;
    /**
     * Alias for sub
     * @param {Coordinate|Point} p - point or coordinate to substract
     * @returns {Extent} a new extent
     */
    substract(): any;
    /**
     * Round the extent
     * @return {Extent} rounded extent
     */
    round(): any;
    _round(): this;
    /**
     * Get the minimum point
     * @params {Coorindate} [out=undefined] - optional point to receive result
     * @return {Coordinate}
     */
    getMin(out?: any): any;
    /**
     * Get the maximum point
     * @params {Coorindate} [out=undefined] - optional point to receive result
     * @return {Coordinate}
     */
    getMax(out?: any): any;
    /**
     * Get center of the extent.
     * @params {Coorindate} [out=undefined] - optional point to receive result
     * @return {Coordinate}
     */
    getCenter(out?: any): any;
    /**
     * Whether the extent is valid
     * @protected
     * @return {Boolean}
     */
    isValid(): boolean;
    /**
     * Compare with another extent to see whether they are equal.
     * @param  {Extent}  ext2 - extent to compare
     * @return {Boolean}
     */
    equals(ext2: any): boolean;
    /**
     * Whether it intersects with another extent
     * @param  {Extent}  ext2 - another extent
     * @return {Boolean}
     */
    intersects(ext2: any): boolean;
    /**
     * Whether the extent is within another extent
     * @param  {Extent}  ext2 - another extent
     * @returns {Boolean}
     */
    within(extent: any): boolean;
    /**
     * Whether the extent contains the input point.
     * @param  {Coordinate|Number[]} coordinate - input point
     * @returns {Boolean}
     */
    contains(c: any): boolean;
    /**
     * Get the width of the Extent
     * @return {Number}
     */
    getWidth(): number;
    /**
     * Get the height of the Extent
     * @return {Number}
     */
    getHeight(): number;
    /**
     * Get size of the Extent
     * @return {Size}
     */
    getSize(): Size;
    set(xmin: any, ymin: any, xmax: any, ymax: any): this;
    __combine(extent: any): number[];
    _combine(extent: any): this;
    /**
     * Combine it with another extent to a larger extent.
     * @param  {Extent|Coordinate|Point} extent - extent/coordinate/point to combine into
     * @returns {Extent} extent combined
     */
    combine(extent: any): any;
    /**
     * Gets the intersection extent of this and another extent.
     * @param  {Extent} extent - another extent
     * @return {Extent} intersection extent
     */
    intersection(extent: any): any;
    /**
     * Expand the extent by distance
     * @param  {Size|Number} distance  - distance to expand
     * @returns {Extent} a new extent expanded from
     */
    expand(distance: any): any;
    _expand(distance: any): this;
    /**
     * Get extent's JSON object.
     * @return {Object} jsonObject
     * @example
     * // {xmin : 100, ymin: 10, xmax: 120, ymax:20}
     * var json = extent.toJSON();
     */
    toJSON(): {
        xmin: number;
        ymin: number;
        xmax: number;
        ymax: number;
    };
    /**
     * Get a coordinate array of extent's rectangle area, containing 5 coordinates in which the first equals with the last.
     * @return {Coordinate[]} coordinates array
     */
    toArray(out?: any): any;
    toString(): string;
    /**
     * Get a copy of the extent.
     * @return {Extent} copy
     */
    copy(): any;
    /**
     * Convert to a new extent
     * @param  {Function} fn convert function on each point
     * @return {Extent}
     */
    convertTo(fn: any, out?: any): any;
    _project(ext: any): void;
}
export default Extent;
