import Coordinate from '../Coordinate';
import Point from '../Point';

/**
 * Transformation between projected coordinates and base 2d point system.
 * A core class used internally for mapping map's (usually geographical) coordinates to 2d points.<br>
 *
 * @category geo
 * @protected
 */
class Transformation {
    /**
     * The base 2d point system is a fixed system that is consistent with HTML coordinate system: on X-Axis, left is smaller and right is larger; on Y-Axis, top is smaller and bottom is larger. <br>
     * As map's coordinates may not be in the same order(e.g. on a mercator projected earth, top is larger and bottom is smaller), <br>
     * transformation provides mapping functions to map arbitrary coordinates system to the fixed 2d point system. <br>
     * How to transform is decided by the constructor parameters which is a 4 number array [a, b, c, d]:<br>
     * a : the order scale of X-axis values 1 means right is larger and -1 means the reverse, left is larger;<br>
     * b : the order scale of Y-axis values 1 means bottom is larger and -1 means the reverse, top is larger;<br>
     * c : x of the origin point of the projected coordinate system <br>
     * d : y of the origin point of the projected coordinate system <br>
     * e.g.: Transformation parameters for Google map: [1, -1, -20037508.34, 20037508.34] <br>
     * @param  {Number[]} matrix transformation array
     */
    constructor(matrix) {
        this.matrix = matrix;
    }

    /**
     * Transform a projected coordinate to a 2d point. <br>
     * Parameter scale in transform/untransform method is used to scale the result 2d points on map's different zoom levels.
     * @param  {Number[]|Coordinate} coordinates - projected coordinate to transform
     * @param  {Number} scale                              - transform scale
     * @return {Point} 2d point.
     */
    transform(coordinates, scale, out) {
        const x = this.matrix[0] * (coordinates.x - this.matrix[2]) / scale;
        const y = -this.matrix[1] * (coordinates.y - this.matrix[3]) / scale;
        if (out) {
            out.x = x;
            out.y = y;
            return out;
        }
        return new Point(x, y);
    }

    /**
     * Transform a 2d point to a projected coordinate.
     * @param  {Point} point   - 2d point
     * @param  {Number} scale           - transform scale
     * @return {Coordinate}  projected coordinate.
     */
    untransform(point, scale, out) {
        const x = point.x * scale / this.matrix[0] + this.matrix[2];
        const y = point.y * scale / -this.matrix[1] + this.matrix[3];
        if (out) {
            out.x = x;
            out.y = y;
            return out;
        }
        return new Coordinate(x, y);
    }
}

export default Transformation;
