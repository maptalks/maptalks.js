import PointExtent from '../geo/PointExtent';
import Geometry, { GeometyOptionsType } from './Geometry';
import Coordinate from './../geo/Coordinate';
export type MarkerOptionsType = GeometyOptionsType & {
    'hitTestForEvent'?: boolean;
    'collision'?: boolean;
};
declare const Marker_base: {
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
} & typeof Geometry;
/**
 * @classdesc
 * Represents a Point type Geometry.
 * @category geometry
 * @extends Geometry
 * @mixes CenterMixin
 * @example
 * var marker = new Marker([100, 0], {
 *     'id' : 'marker0',
 *     'symbol' : {
 *         'markerFile'  : 'foo.png',
 *         'markerWidth' : 20,
 *         'markerHeight': 20,
 *     },
 *     'properties' : {
 *         'foo' : 'value'
 *     }
 * });
 */
declare class Marker extends Marker_base {
    _coordinates: Coordinate;
    /**
     * @param {Coordinate} coordinates      - coordinates of the marker
     * @param {Object} [options=null]       - construct options defined in [Marker]{@link Marker#options}
     */
    constructor(coordinates: any, opts?: MarkerOptionsType);
    getCoordinates(): Coordinate;
    setCoordinates(coordinates: Coordinate | Array<number>): this;
    getOutline(): Marker;
    setSymbol(...args: any[]): any;
    _getSizeSymbol(symbol: any): any;
    _setExternSymbol(symbol: any): this;
    _isDynamicSize(): any;
    _getFixedExtent(): PointExtent;
    _isVectorMarker(): boolean;
    /**
     * Can be edited, only marker with a vector symbol, vector path symbol or a image symbol can be edited.
     * @return {Boolean}
     * @private
     */
    _canEdit(): boolean;
    _containsPoint(point: any, t: any): boolean;
    _computeExtent(): any;
    _computePrjExtent(): any;
    _computeGeodesicLength(): number;
    _computeGeodesicArea(): number;
    _getSprite(resources: any, canvasClass: any): any;
}
export default Marker;
