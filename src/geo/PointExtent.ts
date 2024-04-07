import Extent, { ExtentLike, Position, Projection } from './Extent';
import Point from './Point';
import type { WithNull } from '../types/typings';

/**
 * 表示二维表面上的边界框，即具有最小点和最大点的矩形区域。 <br>
 * 有多种方法可以创建 PointExtent：
 *
 * @english
 * Represent a bounding box on 2d surface , a rectangular area with minimum and maximum points. <br>
 * There are serveral ways to create a PointExtent:
 * @category basic types
 * @example
 *
 * ```ts
 * // with 4 numbers
 * var extent = new PointExtent(100, 10, 120, 20);
 *
 * // with 2 points
 * var extent = new PointExtent(new Point(100, 10), new Point(120, 20));
 *
 * // with a json object containing xmin, ymin, xmax and ymax
 * var extent = new PointExtent({xmin : 100, ymin: 10, xmax: 120, ymax:20});
 *
 * var extent1 = new PointExtent(100, 10, 120, 20);
 * // with another extent
 * var extent2 = new PointExtent(extent1);
 * ```
 */
class PointExtent extends Extent {
    constructor(p1?: WithNull<ExtentLike>, p?: Projection);
    constructor(p1: Position, p2: Position, p?: Projection);
    constructor(p1: number, p2: number, p3: number, p4: number, p?: Projection)
    constructor(...args: any[]) {
        super(...args);
        this._clazz = Point;
    }
}

export default PointExtent;
