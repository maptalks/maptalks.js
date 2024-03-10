import Geometry from '../geometry/Geometry';
import OverlayLayer, { OverlayLayerOptionsType } from './OverlayLayer';
import Painter from '../renderer/geometry/Painter';
import CollectionPainter from '../renderer/geometry/CollectionPainter';
import Coordinate from '../geo/Coordinate';
import Point from '../geo/Point';
export type VectorLayerOptionsType = OverlayLayerOptionsType & {
    'debug'?: boolean;
    'enableSimplify'?: boolean;
    'defaultIconSize'?: Array<number>;
    'cacheVectorOnCanvas'?: boolean;
    'cacheSvgOnCanvas'?: boolean;
    'enableAltitude'?: boolean;
    'altitudeProperty'?: string;
    'drawAltitude'?: boolean;
    'sortByDistanceToCamera'?: boolean;
    'roundPoint'?: boolean;
    'altitude'?: number;
    'clipBBoxBufferSize'?: number;
    'geometryEventTolerance'?: number;
    'collision'?: boolean;
    'collisionBufferSize'?: number;
    'collisionDelay'?: number;
};
/**
 * @classdesc
 * A layer for managing and rendering geometries.
 * @category layer
 * @extends OverlayLayer
 */
declare class VectorLayer extends OverlayLayer {
    /**
     * @param {String|Number} id - layer's id
     * @param {Geometry|Geometry[]} [geometries=null] - geometries to add
     * @param {Object}  [options=null]          - construct options
     * @param {Object}  [options.style=null]    - vectorlayer's style
     * @param {*}  [options.*=null]             - options defined in [VectorLayer]{@link VectorLayer#options}
     */
    constructor(id: any, geometries?: Geometry | Array<Geometry>, options?: VectorLayerOptionsType);
    onConfig(conf: any): void;
    /**
     * Identify the geometries on the given coordinate
     * @param  {maptalks.Coordinate} coordinate   - coordinate to identify
     * @param  {Object} [options=null]  - options
     * @param  {Object} [options.tolerance=0] - identify tolerance in pixel
     * @param  {Object} [options.count=null]  - result count
     * @return {Geometry[]} geometries identified
     */
    identify(coordinate: Coordinate, options?: {}): void | any[];
    /**
     * Identify the geometries on the given container point
     * @param  {maptalks.Point} point   - container point to identify
     * @param  {Object} [options=null]  - options
     * @param  {Object} [options.tolerance=0] - identify tolerance in pixel
     * @param  {Object} [options.count=null]  - result count
     * @return {Geometry[]} geometries identified
     */
    identifyAtPoint(point: Point, options?: {}): void | any[];
    _hitGeos(geometries: any, cp: any, options?: {}): any[];
    getAltitude(): number;
    /**
     * Export the VectorLayer's JSON. <br>
     * @param  {Object} [options=null] - export options
     * @param  {Object} [options.geometries=null] - If not null and the layer is a [OverlayerLayer]{@link OverlayLayer},
     *                                            the layer's geometries will be exported with the given "options.geometries" as a parameter of geometry's toJSON.
     * @param  {Extent} [options.clipExtent=null] - if set, only the geometries intersectes with the extent will be exported.
     * @return {Object} layer's JSON
     */
    toJSON(options: any): object;
    /**
     * Reproduce a VectorLayer from layer's JSON.
     * @param  {Object} layerJSON - layer's JSON
     * @return {VectorLayer}
     * @static
     * @private
     * @function
     */
    static fromJSON(json: any): VectorLayer;
    static getPainterClass(): typeof Painter;
    static getCollectionPainterClass(): typeof CollectionPainter;
}
export default VectorLayer;
