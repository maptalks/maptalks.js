import Coordinate from '../geo/Coordinate';
import { clipLine } from '../core/util/path';
import Path from './Path';
import Polygon from './Polygon';
import Extent from '../geo/Extent';

export type LineStringOption = {
    arrowStyle?: string | number[]
    arrowPlacement?: string
}
/**
 * @property {Object} [options=null]
 * @property {String|Number[]} [options.arrowStyle=null]        - style of arrow, can be a pre-defined value or an array [arrow-width, arrow-height] (value in the array is times of linewidth), possible predefined values: classic ([3, 4])
 * @property {String} [options.arrowPlacement=vertex-last]      - arrow's placement: vertex-first, vertex-last, vertex-firstlast, point
 * @memberOf LineString
 * @instance
 */
const options: LineStringOption = {
    'arrowStyle': null,
    'arrowPlacement': 'vertex-last' //vertex-first, vertex-last, vertex-firstlast, point
};

/**
 * 表示LineString类型的Geometry。
 * @english
 * Represents a LineString type Geometry.
 * @category geometry
 * @extends Path
 * @example
 * var line = new LineString(
 *     [
 *         [121.45942, 31.24123],
 *         [121.46371, 31.24226],
 *         [121.46727, 31.23870],
 *         [121.47019, 31.24145]
 *     ]
 * ).addTo(layer);
 */
export class LineString extends Path {

    public _coordinates: any
    /**
     * @param {Coordinate[]|Number[][]} coordinates - coordinates of the line string
     * @param {Object} [options=null] - construct options defined in [LineString]{@link LineString#options}
     */
    constructor(coordinates?: any, options?: any) {
        super(options);
        this.type = 'LineString';
        if (coordinates) {
            this.setCoordinates(coordinates);
        }
    }

    getOutline(): any {
        return Polygon.prototype.getOutline.call(this);
    }

    /**
     * 给线段设置坐标
     * @english
     * Set new coordinates to the line string
     * @param {Coordinate[]|Number[][]} coordinates - new coordinates
     * @fires LineString#shapechange
     * @return {LineString} this
     */
    setCoordinates(coordinates: any): LineString {
        if (!coordinates) {
            this._coordinates = null;
            this._setPrjCoordinates(null);
            return this;
        }
        this._coordinates = Coordinate.toCoordinates(coordinates);
        if (this.getMap()) {
            this._setPrjCoordinates(this._projectCoords(this._coordinates));
        } else {
            this.onShapeChanged();
        }
        return this;
    }

    /**
     * 获取线段的坐标
     * @english
     * Get coordinates of the line string
     * @return {Coordinate[]|Number[][]} coordinates
     */
    getCoordinates(): any {
        return this._coordinates || [];
    }

    /**
     * 获取具有给定范围的线串的交点的中心
     * @english
     * Get center of linestring's intersection with give extent
     * @example
     *  const extent = map.getExtent();
     *  const center = line.getCenterInExtent(extent);
     * @param {Extent} extent
     * @return {Coordinate} center, null if line doesn't intersect with extent
     */
    getCenterInExtent(extent: Extent): Coordinate {
        return this._getCenterInExtent(extent, this.getCoordinates(), clipLine);
    }

    _computeGeodesicLength(measurer: any): number {
        return measurer.measureLength(this.getCoordinates());
    }

    _computeGeodesicArea(): number {
        return 0;
    }
}

LineString.mergeOptions(options);

LineString.registerJSONType('LineString');

export default LineString;
