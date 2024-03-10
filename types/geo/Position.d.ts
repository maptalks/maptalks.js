/**
 * Abstract parent class for Point and Coordinate
 * @abstract
 * @category basic types
 */
declare class Position {
    x: number;
    y: number;
    z: number;
    constructor(x: number | Array<number> | Position, y?: number, z?: number);
    /**
     * Set point or coordinate's x, y value
     * @params {Number} x - x value
     * @params {Number} y - y value
     * @return {Coordinate|Point} this
     */
    set(x: number, y: number, z?: number): this;
    /**
     * Return abs value of the point
     * @return {Coordinate|Point} abs point
     */
    abs(): Position;
    _abs(): this;
    _round(): this;
    /**
     * Like math.round, rounding the point's xy.
     * @return {Coordinate|Point} rounded point
     */
    round(): Position;
    _ceil(): this;
    ceil(): Position;
    /**
     * Returns the distance between the current and the given point.
     * @param  {Coordinate|Point} point - another point
     * @return {Number} distance
     */
    distanceTo(point: Position): number;
    /**
     * Return the magnitude of this point: this is the Euclidean
     * distance from the 0, 0 coordinate to this point's x and y
     * coordinates.
     * @return {Number} magnitude
     */
    mag(): number;
    _floor(): this;
    floor(): Position;
    /**
     * Returns a copy of the coordinate
     * @return {Coordinate|Point} copy
     */
    copy(): Position;
    _add(x: number | Array<number> | Position, y?: number): this;
    /**
     * Returns the result of addition of another coordinate.
     * @param {Coordinate|Point|Array|Number} x - coordinate to add
     * @param {Number} [y=undefined] - optional, coordinate to add
     * @return {Coordinate|Point} result
     */
    add(x: number | Array<number> | Position, y?: number): Position;
    _sub(x: number | Array<number> | Position, y?: number): this;
    _substract(): any;
    /**
     * Returns the result of subtraction of another coordinate.
     * @param {Coordinate|Point|Array|Number} x - coordinate to add
     * @param {Number} [y=undefined] - optional, coordinate to add
     * @return {Coordinate|Point} result
     */
    sub(x: number | Array<number> | Position, y?: number): Position;
    /**
     * Alias for sub
     * @param {Coordinate|Point|Array|Number} x - coordinate to add
     * @param {Number} [y=undefined] - optional, coordinate to add
     * @return {Coordinate|Point} result
     */
    substract(): Position;
    /**
     * Returns the result of multiplication of the current coordinate by the given number.
     * @param {Number} ratio - ratio to multi
     * @return {Coordinate|Point} result
     */
    multi(ratio: number): Position;
    _multi(ratio: number): this;
    /**
     * Returns the result of division of the current point by the given number.
     * @param {Number} n - number to div
     * @return {Coordinate|Point} result
     */
    div(n: number): Position;
    _div(n: number): this;
    /**
     * Compare with another coordinate to see whether they are equal.
     * @param {Coordinate|Point} c - coordinate to compare
     * @return {Boolean}
     */
    equals(c: Position): boolean;
    /**
     * Whether the coordinate is NaN
     * @return {Boolean}
     * @private
     */
    _isNaN(): boolean;
    /**
     * Whether the coordinate/point is zero
     */
    isZero(): boolean;
    /**
     * Convert to a number array [x, y]
     * @return {Number[]} number array
     */
    toArray(): number[];
    /**
     * Formats coordinate number using fixed-point notation.
     * @param  {Number} n The number of digits to appear after the decimal point
     * @return {Coordinate}   fixed coordinate
     */
    toFixed(n: number): Position;
    /**
     * Convert to a json object {x : .., y : ..}
     * @return {Object} json
     */
    toJSON(): {
        x: number;
        y: number;
    };
}
export default Position;
