import Coordinate from '../geo/Coordinate';
import Extent from '../geo/Extent';
import Polygon, { PolygonOptionsType } from './Polygon';
export type CirlceOptionsType = PolygonOptionsType & {
    'numberOfShellPoints'?: number;
};
declare const Circle_base: {
    new (...args: any[]): {
        _coordinates: any;
        _dirtyCoords: boolean;
        _pcenter: import("src").Point;
        getCoordinates(): any;
        setCoordinates(coordinates: any): any;
        _getCenter2DPoint(res?: any): any;
        _getPrjCoordinates(): import("src").Point;
        _setPrjCoordinates(pcenter: any): void;
        _updateCache(): void;
        _clearProjection(): void;
        _computeCenter(): any;
    };
} & typeof Polygon;
/**
 * @classdesc
 * Represents a Circle Geometry. <br>
 * @category geometry
 * @extends Polygon
 * @mixes Geometry.Center
 * @example
 * var circle = new Circle([100, 0], 1000, {
 *     id : 'circle0',
 *     properties : {
 *         foo : 'bar'
 *     }
 * });
 * @mixes CenterMixin
 */
declare class Circle extends Circle_base {
    _radius: number;
    static fromJSON(json: any): Circle;
    /**
     * @param {Coordinate} center - center of the circle
     * @param {Number} radius           - radius of the circle, in meter
     * @param {Object} [options=null]   - construct options defined in [Circle]{@link Circle#options}
     */
    constructor(coordinates: any, radius: number, opts?: PolygonOptionsType);
    /**
     * Get radius of the circle
     * @return {Number}
     */
    getRadius(): number;
    /**
     * Set a new radius to the circle
     * @param {Number} radius - new radius
     * @return {Circle} this
     * @fires Circle#shapechange
     */
    setRadius(radius: number): this;
    /**
     * Gets the shell of the circle as a polygon, number of the shell points is decided by [options.numberOfShellPoints]{@link Circle#options}
     * @return {Coordinate[]} - shell coordinates
     */
    getShell(): Array<Coordinate>;
    /**
     * Circle won't have any holes, always returns null
     * @return {Object[]} an empty array
     */
    getHoles(): any[];
    animateShow(): this;
    _containsPoint(point: any, tolerance: any): boolean;
    _computePrjExtent(projection: any): Extent;
    _computeExtent(measurer: any): Extent;
    _getMinMax(measurer: any): any[];
    _computeGeodesicLength(): number;
    _computeGeodesicArea(): number;
    _exportGeoJSONGeometry(): {
        type: string;
        coordinates: any;
    };
    _toJSON(options: any): {
        feature: object;
        subType: string;
        coordinates: number[];
        radius: number;
    };
}
export default Circle;
