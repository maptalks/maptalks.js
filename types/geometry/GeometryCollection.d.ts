import Coordinate from '../geo/Coordinate';
import PointExtent from '../geo/PointExtent';
import Geometry from './Geometry';
import Point from './../geo/Point';
/**
 * @classdesc
 * Represents a GeometryCollection.
 * @category geometry
 * @extends Geometry
 * @example
 * var marker = new Marker([0, 0]),
 *     line = new LineString([[0, 0], [0, 1]]),
 *     polygon = new Polygon([[0, 0], [0, 1], [1, 3]]);
 * var collection = new GeometryCollection([marker, line, polygon])
 *     .addTo(layer);
 */
declare class GeometryCollection extends Geometry {
    _geometries: Array<Geometry>;
    _pickGeometryIndex: number;
    _originalSymbol: any;
    _draggbleBeforeEdit: boolean;
    _editing: boolean;
    /**
     * @param {Geometry[]} geometries - GeometryCollection's geometries
     * @param {Object} [options=null] - options defined in [nGeometryCollection]{@link GeometryCollection#options}
     */
    constructor(geometries?: any, opts?: any);
    getContainerExtent(out?: PointExtent): PointExtent;
    /**
     * Set new geometries to the geometry collection
     * @param {Geometry[]} geometries
     * @return {GeometryCollection} this
     * @fires GeometryCollection#shapechange
     */
    setGeometries(_geometries: Array<Geometry>): this;
    /**
     * Get geometries of the geometry collection
     * @return {Geometry[]} geometries
     */
    getGeometries(): Geometry[];
    /**
     * Executes the provided callback once for each geometry present in the collection in order.
     * @param  {Function} fn             - a callback function
     * @param  {*} [context=undefined]   - callback's context
     * @return {GeometryCollection} this
     */
    forEach(fn: any, context?: any): this;
    /**
     * Creates a GeometryCollection with all elements that pass the test implemented by the provided function.
     * @param  {Function} fn      - Function to test each geometry
     * @param  {*} [context=undefined]    - Function's context
     * @return {GeometryCollection} A GeometryCollection with all elements that pass the test
     * @example
     * var filtered = collection.filter(['==', 'foo', 'bar]);
     * @example
     * var filtered = collection.filter(geometry => geometry.getProperties().foo === 'bar');
     */
    filter(fn: any, context: any): GeometryCollection;
    /**
     * Translate or move the geometry collection by the given offset.
     * @param  {Coordinate} offset - translate offset
     * @return {GeometryCollection} this
     */
    translate(offset: Point): this;
    /**
     * Whether the geometry collection is empty
     * @return {Boolean}
     */
    isEmpty(): boolean;
    /**
     * remove itself from the layer if any.
     * @returns {Geometry} this
     * @fires GeometryCollection#removestart
     * @fires GeometryCollection#remove
     * @fires GeometryCollection#removeend
     */
    remove(): any;
    /**
     * Show the geometry collection.
     * @return {GeometryCollection} this
     * @fires GeometryCollection#show
     */
    show(): this;
    /**
     * Hide the geometry collection.
     * @return {GeometryCollection} this
     * @fires GeometryCollection#hide
     */
    hide(): this;
    onConfig(config: any): void;
    getSymbol(): any;
    setSymbol(s: any): this;
    _setExternSymbol(symbol: any): this;
    /**
     * bind this geometry collection to a layer
     * @param  {Layer} layer
     * @private
     */
    _bindLayer(): void;
    _bindGeometriesToLayer(): void;
    /**
     * Check whether the type of geometries is valid
     * @param  {Geometry[]} geometries - geometries to check
     * @private
     */
    _checkGeometries(geometries: any): any;
    _checkGeo(geo: any): boolean;
    _updateCache(): void;
    _removePainter(): void;
    _computeCenter(projection: any): Coordinate;
    _containsPoint(point: any, t: any): boolean;
    _computeExtent(projection: any): any;
    _computePrjExtent(projection: any): any;
    _computeGeodesicLength(projection: any): number;
    _computeGeodesicArea(projection: any): number;
    _exportGeoJSONGeometry(): {
        type: string;
        geometries: any[];
    };
    _toJSON(options: any): any;
    _clearProjection(): void;
    /**
     * Get connect points if being connected by [ConnectorLine]{@link ConnectorLine}
     * @private
     * @return {Coordinate[]}
     */
    _getConnectPoints(): Coordinate[];
    _getExternalResources(): any[];
    startEdit(opts: any): this;
    endEdit(): this;
    isEditing(): boolean;
}
export default GeometryCollection;
