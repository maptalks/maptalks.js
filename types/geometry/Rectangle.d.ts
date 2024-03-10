import Coordinate from '../geo/Coordinate';
import Extent from '../geo/Extent';
import Polygon, { PolygonOptionsType } from './Polygon';
/**
 * @classdesc
 * Represents a Rectangle geometry.
 * @category geometry
 * @extends Polygon
 * @example
 * var rectangle = new Rectangle([100, 0], 1000, 500, {
 *     id : 'rectangle0'
 * });
 */
declare class Rectangle extends Polygon {
    _width: number;
    _height: number;
    _pnw: any;
    static fromJSON(json: any): Rectangle;
    /**
     * @param {Coordinate} coordinates  - northwest of the rectangle
     * @param {Number} width                     - width of the rectangle, in meter
     * @param {Number} height                    - height of the rectangle, in meter
     * @param {Object} [options=null]            - options defined in [Rectangle]{@link Rectangle#options}
     */
    constructor(coordinates: any, width: number, height: number, opts: PolygonOptionsType);
    /**
     * Get coordinates of rectangle's northwest
     * @return {Coordinate}
     */
    getCoordinates(): Coordinate;
    /**
     * Set a new coordinate for northwest of the rectangle
     * @param {Coordinate} nw - coordinates of new northwest
     * @return {Rectangle} this
     * @fires Rectangle#positionchange
     */
    setCoordinates(nw: any): this;
    /**
     * Get rectangle's width
     * @return {Number}
     */
    getWidth(): number;
    /**
     * Set new width to the rectangle
     * @param {Number} width - new width
     * @fires Rectangle#shapechange
     * @return {Rectangle} this
     */
    setWidth(width: any): this;
    /**
     * Get rectangle's height
     * @return {Number}
     */
    getHeight(): number;
    /**
     * Set new height to rectangle
     * @param {Number} height - new height
     * @fires Rectangle#shapechange
     * @return {Rectangle} this
     */
    setHeight(height: any): this;
    /**
     * Gets the shell of the rectangle as a polygon
     * @return {Coordinate[]} - shell coordinates
     */
    getShell(): any[];
    /**
     * Rectangle won't have any holes, always returns null
     * @return {Object[]} an empty array
     */
    getHoles(): any[];
    animateShow(): this;
    _getPrjCoordinates(): any;
    _setPrjCoordinates(pnw: any): void;
    _getPrjShell(): any;
    _updateCache(): void;
    _clearProjection(): void;
    _computeCenter(measurer: any): any;
    _containsPoint(point: any, tolerance: any): any;
    _computePrjExtent(projection: any): Extent;
    _computeExtent(measurer: any): Extent;
    _getSouthEast(measurer: any): any;
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
export default Rectangle;
