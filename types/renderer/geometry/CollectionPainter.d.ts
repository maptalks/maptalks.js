import { Geometry } from './../../geometry';
import Class from '../../core/Class';
/**
 * @classdesc
 * Painter for collection type geometries
 * @class
 * @private
 */
export default class CollectionPainter extends Class {
    geometry: Geometry;
    isMask: boolean;
    /**
     * @param {GeometryCollection} geometry - geometry to paint
     */
    constructor(geometry: any, isMask: any);
    _eachPainter(fn: any): void;
    paint(extent: any): void;
    get2DExtent(resources: any, out: any): any;
    remove(): void;
    setZIndex(): void;
    show(): void;
    hide(): void;
    repaint(): void;
    refreshSymbol(): void;
    hasPoint(): boolean;
    getMinAltitude(): number;
    getMaxAltitude(): number;
}
