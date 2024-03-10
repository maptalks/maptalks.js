import Position from './Position';
/**
 * Represents a 2d point.<br>
 * Can be created in serveral ways:
 * @example
 * var point = new Point(1000, 1000);
 * @example
 * var point = new Point([1000,1000]);
 * @example
 * var point = new Point({x:1000, y:1000});
 * @category basic types
 * @extends Position
 */
declare class Point extends Position {
    /**
     * Compare with another point with a delta
     * @param {Point} p
     * @param {Number} delta
     * @return {Boolean}
     */
    closeTo(p: any, delta: any): boolean;
    /**
     * Return the magitude of this point: this is the Euclidean
     * distance from the 0, 0 coordinate to this point's x and y
     * coordinates.
     * @return {Number} magnitude
     */
    mag(): number;
    /**
     * Calculate this point but as a unit vector from 0, 0, meaning
     * that the distance from the resulting point to the 0, 0
     * coordinate will be equal to 1 and the angle from the resulting
     * point to the 0, 0 coordinate will be the same as before.
     * @return {Point} unit vector point
     */
    unit(): Point;
    _unit(): this;
    /**
     * Compute a perpendicular point, where the new y coordinate
     * is the old x coordinate and the new x coordinate is the old y
     * coordinate multiplied by -1
     * @return {Point} perpendicular point
     */
    perp(): Point;
    _perp(): this;
    /**
     * Get the angle between this point and another point, in radians
     * from mapbox/point-geometry
     * @param {Point} b the other point
     * @return {Number} angle
     */
    angleWith(b: any): number;
    angleWithSep(x: any, y: any): number;
    _rotate(angle: any): this;
    /**
     * Rotate this point around the 0, 0 origin by an angle a,
     * given in radians
     * from mapbox/point-geometry
     *
     * @param {Number} a angle to rotate around, in radians
     * @return {Point} output point
     */
    rotate(a: any): Point;
}
export default Point;
