import PointExtent from '../../../geo/PointExtent';
import Point from '../../../geo/Point';
import CanvasSymbolizer from './CanvasSymbolizer';
/**
 * @classdesc
 * Base symbolizer class for all the point type symbol styles.
 * @abstract
 * @class
 * @private
 * @memberOf symbolizer
 * @name PointSymbolizer
 * @extends {symbolizer.CanvasSymbolizer}
 */
declare class PointSymbolizer extends CanvasSymbolizer {
    style: any;
    _fixedExtent: PointExtent;
    constructor(symbol: any, geometry: any, painter: any);
    get2DExtent(): PointExtent;
    isDynamicSize(): any;
    _rotateExtent(fixedExtent: any, angle: any): any;
    _getRenderPoints(): any;
    /**
     * Get container points to draw on Canvas
     * @return {Point[]}
     */
    _getRenderContainerPoints(ignoreAltitude?: any): any;
    getPlacement(): any;
    getRotation(): number;
    getDxDy(): Point;
    _getRotationAt(i: any): number;
    _rotate(ctx: any, origin: any, rotation: any): Point;
}
export default PointSymbolizer;
