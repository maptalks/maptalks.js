import Coordinate from '../geo/Coordinate';
import Path, { PathOptionsType } from './Path';
export type PolygonOptionsType = PathOptionsType;
/**
 * @classdesc
 * Geometry class for polygon type
 * @category geometry
 * @extends Path
 * @example
 * var polygon = new Polygon(
 *      [
 *          [
 *              [121.48053653961283, 31.24244899384889],
 *              [121.48049362426856, 31.238559229494186],
 *              [121.49032123809872, 31.236210614999653],
 *              [121.49366863494917, 31.242926029397037],
 *              [121.48577221160967, 31.243880093267567],
 *              [121.48053653961283, 31.24244899384889]
 *          ]
 *      ]
 *  ).addTo(layer);
 */
declare class Polygon extends Path {
    _holes: Array<any>;
    _prjHoles: Array<any>;
    _prjShell: Array<any>;
    /**
     * @param {Number[][]|Number[][][]|Coordinate[]|Coordinate[][]} coordinates - coordinates, shell coordinates or all the rings.
     * @param {Object} [options=null] - construct options defined in [Polygon]{@link Polygon#options}
     */
    constructor(coordinates: any, opts?: PolygonOptionsType);
    getOutline(): Polygon;
    /**
     * Set coordinates to the polygon
     *
     * @param {Number[][]|Number[][][]|Coordinate[]|Coordinate[][]} coordinates - new coordinates
     * @return {Polygon} this
     * @fires Polygon#shapechange
     */
    setCoordinates(coordinates: Array<Array<Coordinate | Array<number>>>): this;
    /**
     * Gets polygons's coordinates
     *
     * @returns {Coordinate[][]}
     */
    getCoordinates(): Array<Array<Coordinate>>;
    /**
     * Get center of linestring's intersection with give extent
     * @example
     *  const extent = map.getExtent();
     *  const center = line.getCenterInExtent(extent);
     * @param {Extent} extent
     * @return {Coordinate} center, null if line doesn't intersect with extent
     */
    getCenterInExtent(extent: any): Coordinate;
    /**
     * Gets shell's coordinates of the polygon
     *
     * @returns {Coordinate[]}
     */
    getShell(): Array<Coordinate>;
    /**
     * Gets holes' coordinates of the polygon if it has.
     * @returns {Coordinate[][]}
     */
    getHoles(): Array<Array<Coordinate>>;
    /**
     * Whether the polygon has any holes inside.
     *
     * @returns {Boolean}
     */
    hasHoles(): boolean;
    _projectRings(): void;
    _setPrjCoordinates(prjCoords: any): void;
    _cleanRing(ring: any): void;
    /**
     * Check if ring is valid
     * @param  {*} ring ring to check
     * @return {Boolean} is ring a closed one
     * @private
     */
    _checkRing(ring: any): boolean;
    /**
     * If the first coordinate is equal with the last one, then remove the last coordinates.
     * @private
     */
    _trimRing(ring: any): any;
    /**
     * If the first coordinate is different with the last one, then copy the first coordinates and add to the ring.
     * @private
     */
    _copyAndCloseRing(ring: any): any;
    _getPrjShell(): any;
    _getPrjHoles(): any[];
    _computeGeodesicLength(measurer: any): number;
    _computeGeodesicArea(measurer: any): any;
    _updateCache(): void;
    _clearCache(): void;
    _clearProjection(): void;
}
export default Polygon;
