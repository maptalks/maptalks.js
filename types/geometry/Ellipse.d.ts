import Coordinate from '../geo/Coordinate';
import Polygon, { PolygonOptionsType } from './Polygon';
export type EllipseOptionsType = PolygonOptionsType & {
    'numberOfShellPoints'?: number;
};
declare const Ellipse_base: {
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
 * Represents a Ellipse Geometry. <br>
 * @category geometry
 * @extends Polygon
 * @mixes CenterMixin
 * @example
 * var ellipse = new Ellipse([100, 0], 1000, 500, {
 *     id : 'ellipse0'
 * });
 */
declare class Ellipse extends Ellipse_base {
    width: number;
    height: number;
    static fromJSON(json: any): Ellipse;
    /**
     * @param {Coordinate} center  - center of the ellipse
     * @param {Number} width  - width of the ellipse, in meter
     * @param {Number} height - height of the ellipse, in meter
     * @param {Object}  [options=null] - construct options defined in [Ellipse]{@link Ellipse#options}
     */
    constructor(coordinates: any, width: number, height: number, opts?: EllipseOptionsType);
    /**
     * Get ellipse's width
     * @return {Number}
     */
    getWidth(): number;
    /**
     * Set new width to ellipse
     * @param {Number} width - new width
     * @fires Ellipse#shapechange
     * @return {Ellipse} this
     */
    setWidth(width: number): this;
    /**
     * Get ellipse's height
     * @return {Number}
     */
    getHeight(): number;
    /**
     * Set new height to ellipse
     * @param {Number} height - new height
     * @fires Ellipse#shapechange
     * @return {Ellipse} this
     */
    setHeight(height: number): this;
    /**
     * Gets the shell of the ellipse as a polygon, number of the shell points is decided by [options.numberOfShellPoints]{@link Circle#options}
     * @return {Coordinate[]} - shell coordinates
     */
    getShell(): Array<Coordinate>;
    /**
     * Ellipse won't have any holes, always returns null
     * @return {Object[]} an empty array
     */
    getHoles(): any[];
    animateShow(): this;
    _containsPoint(point: any, tolerance: any): boolean;
    _computePrjExtent(): any;
    _computeExtent(): any;
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
        width: number;
        height: number;
    };
}
export default Ellipse;
