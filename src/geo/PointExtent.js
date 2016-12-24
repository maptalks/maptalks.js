import Extent from './Extent';
import Point from './Point';
import Size from './Size';

/**
 * Represent a bounding box on 2d surface , a rectangular area with minimum and maximum points. <br>
 * There are serveral ways to create a PointExtent:
 * @class
 * @category basic types
 * @param {Number} x1   - x of point 1
 * @param {Number} y1   - y of point 1
 * @param {Number} x2   - x of point 2
 * @param {Number} y2   - y of point 2
 * @extends {Extent}
 * @example
 * //with 4 numbers
 * var extent = new PointExtent(100, 10, 120, 20);
 * @example
 * //with 2 points
 * var extent = new PointExtent(new Point(100, 10), new Point(120, 20));
 * @example
 * //with a json object containing xmin, ymin, xmax and ymax
 * var extent = new PointExtent({xmin : 100, ymin: 10, xmax: 120, ymax:20});
 * @example
 * var extent1 = new PointExtent(100, 10, 120, 20);
 * //with another extent
 * var extent2 = new PointExtent(extent1);
 */
export default class PointExtent extends Extent {
    constructor(p1, p2, p3, p4) {
        super(p1, p2, p3, p4);
        this._clazz = Point;
    }

    /**
     * Get size of the PointExtent
     * @return {Size}
     */
    getSize() {
        return new Size(this.getWidth(), this.getHeight());
    }
}
