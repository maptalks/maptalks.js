import Class from '../../core/Class';
import Point from '../../geo/Point';
import PointExtent from '../../geo/PointExtent';
import { Geometry } from './../..//geometry';
import { Map } from '../../index'
import OverlayLayer from '../../layer/OverlayLayer'
/**
 * @classdesc
 * Painter class for all geometry types except the collection types.
 * @class
 * @private
 */
declare class Painter extends Class {
    geometry: Geometry;
    symbolizers: any;
    _altAtGL: any;
    _hasPoint: boolean;
    _debugSymbolizer: any;
    _renderPoints: object;
    _hitPoint: Point;
    _cachedParams: any;
    _unsimpledParams: any;
    _pitched: boolean;
    _rotated: boolean;
    containerOffset: Point;
    _containerBbox: any;
    _spriting: boolean;
    _sprite: any;
    _painted: boolean;
    _extent2D: PointExtent;
    _fixedExtent: PointExtent;
    _paintParams: any;
    _propAlt: number;
    minAltitude: number;
    maxAltitude: number;
    _projCode: string;
    /**
     *  @param {Geometry} geometry - geometry to paint
     */
    constructor(geometry: any);
    getMap(): Map;
    getLayer(): OverlayLayer;
    /**
     * create symbolizers
     */
    _createSymbolizers(): any[];
    hasPoint(): boolean;
    /**
     * for point symbolizers
     * @return {Point[]} points to render
     */
    getRenderPoints(placement: any): any;
    /**
     * for strokeAndFillSymbolizer
     * @return {Object[]} resources to render vector
     */
    getPaintParams(dx: any, dy: any, ignoreAltitude: any, disableClip: any, ptkey?: string): any[];
    _pointContainerPoints(points: any, dx: any, dy: any, ignoreAltitude: any, disableClip: any, pointPlacement: any, ptkey?: string): any;
    _clip(points: any, altitude: any): {
        points: any;
        altitude: any;
        inView?: undefined;
    } | {
        points: any;
        altitude: any;
        inView: boolean;
    };
    /**
     * interpolate clipped line segs's altitude
     * @param {Point[]|Point[][]} clipSegs
     * @param {Point[]|Point[][]} orig
     * @param {Number|Number[]} altitude
     * @private
     */
    _interpolateSegAlt(clipSegs: any, orig: any, altitude: any): {
        points: any;
        altitude: any;
    };
    getSymbol(): any;
    paint(extent?: any, context?: any, offset?: any): void;
    getSprite(resources: any, canvasClass: any): any;
    isSpriting(): boolean;
    hitTest(cp: any, tolerance: any): boolean;
    isHitTesting(): boolean;
    _prepareShadow(ctx: any, symbol: any): void;
    _eachSymbolizer(fn: any, context?: any): void;
    get2DExtent(resources: any, out: any): any;
    _computeExtent2D(extent: any): any;
    _computeFixedExtent(resources: any, extent: any): any;
    _isDynamicSize(): boolean;
    _aboveCamera(): boolean;
    getFixedExtent(): any;
    setZIndex(change: any): void;
    show(): void;
    hide(): void;
    repaint(): void;
    /**
     * refresh symbolizers when symbol changed
     */
    refreshSymbol(): void;
    remove(): void;
    _removeSymbolizers(): void;
    /**
     * delete painter's caches
     */
    removeCache(): void;
    getAltitude(): any;
    getMinAltitude(): number;
    getMaxAltitude(): number;
    _getGeometryAltitude(): number | any[];
    _verifyProjection(): void;
    _beforePaint(): void;
    _afterPaint(): void;
}
export default Painter;
