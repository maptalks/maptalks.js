import Coordinate from '../geo/Coordinate';
import Path, { PathOptionsType } from './Path';
export type LineStringOptionsType = PathOptionsType & {
    'arrowStyle'?: any;
    'arrowPlacement'?: string;
};
/**
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
declare class LineString extends Path {
    _coordinates: Array<Coordinate>;
    /**
     * @param {Coordinate[]|Number[][]} coordinates - coordinates of the line string
     * @param {Object} [options=null] - construct options defined in [LineString]{@link LineString#options}
     */
    constructor(coordinates: any, options?: LineStringOptionsType);
    getOutline(): any;
    /**
     * Set new coordinates to the line string
     * @param {Coordinate[]|Number[][]} coordinates - new coordinates
     * @fires LineString#shapechange
     * @return {LineString} this
     */
    setCoordinates(coordinates: Array<Coordinate>): this;
    /**
     * Get coordinates of the line string
     * @return {Coordinate[]|Number[][]} coordinates
     */
    getCoordinates(): Coordinate[];
    /**
     * Get center of linestring's intersection with give extent
     * @example
     *  const extent = map.getExtent();
     *  const center = line.getCenterInExtent(extent);
     * @param {Extent} extent
     * @return {Coordinate} center, null if line doesn't intersect with extent
     */
    getCenterInExtent(extent: any): Coordinate;
    _computeGeodesicLength(measurer: any): any;
    _computeGeodesicArea(): number;
}
export default LineString;
