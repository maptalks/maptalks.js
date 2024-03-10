import Extent from '../geo/Extent';
import { Geometry } from '../geometry';
import Layer, { LayerOptionsType } from './Layer';
import { OverlayLayerCanvasRenderer } from './../renderer';
export type OverlayLayerOptionsType = LayerOptionsType & {
    'drawImmediate'?: boolean;
    'geometryEvents'?: boolean;
};
/**
 * @classdesc
 * Base class of all the layers that can add/remove geometries. <br>
 * It is abstract and not intended to be instantiated.
 * @category layer
 * @abstract
 * @extends Layer
 */
declare class OverlayLayer extends Layer {
    _renderer: OverlayLayerCanvasRenderer;
    _maxZIndex: number;
    _minZIndex: number;
    _geoMap: any;
    _geoList: Array<Geometry>;
    _toSort: boolean;
    _cookedStyles: any;
    _clearing: boolean;
    constructor(id: any, geometries?: Geometry | Array<Geometry>, options?: OverlayLayerOptionsType);
    _getRenderer(): OverlayLayerCanvasRenderer;
    getRenderer(): OverlayLayerCanvasRenderer;
    /**
     * Get a geometry by its id
     * @param  {String|Number} id   - id of the geometry
     * @return {Geometry}
     */
    getGeometryById(id: any): Geometry | null;
    /**
     * Get all the geometries or the ones filtered if a filter function is provided.
     * @param {Function} [filter=undefined]  - a function to filter the geometries
     * @param {Object} [context=undefined]   - context of the filter function, value to use as this when executing filter.
     * @return {Geometry[]}
     */
    getGeometries(filter?: any, context?: any): Array<Geometry>;
    /**
     * Get the first geometry, the geometry at the bottom.
     * @return {Geometry} first geometry
     */
    getFirstGeometry(): Geometry | null;
    /**
     * Get the last geometry, the geometry on the top
     * @return {Geometry} last geometry
     */
    getLastGeometry(): Geometry | null;
    /**
     * Get count of the geometries
     * @return {Number} count
     */
    getCount(): number;
    /**
     * Get extent of all the geometries in the layer, return null if the layer is empty.
     * @return {Extent} - extent of the layer
     */
    getExtent(): Extent | null;
    /**
     * Executes the provided callback once for each geometry present in the layer in order.
     * @param  {Function} fn - a callback function
     * @param  {*} [context=undefined]   - callback's context, value to use as this when executing callback.
     * @return {OverlayLayer} this
     */
    forEach(fn: any, context?: any): this;
    /**
     * Creates a GeometryCollection with all the geometries that pass the test implemented by the provided function.
     * @param  {Function} fn      - Function to test each geometry
     * @param  {*} [context=undefined]  - Function's context, value to use as this when executing function.
     * @return {GeometryCollection} A GeometryCollection with all the geometries that pass the test
     */
    filter(fn: any, context: any): Array<Geometry>;
    /**
     * Whether the layer is empty.
     * @return {Boolean}
     */
    isEmpty(): boolean;
    /**
     * Adds one or more geometries to the layer
     * @param {Geometry|Geometry[]} geometries - one or more geometries
     * @param {Boolean|Object} [fitView=false]  - automatically set the map to a fit center and zoom for the geometries
     * @param {String} [fitView.easing=out]  - default animation type
     * @param {Number} [fitView.duration=map.options.zoomAnimationDuration]  - default animation time
     * @param {Function} [fitView.step=null]  - step function during animation, animation frame as the parameter
     * @return {OverlayLayer} this
     */
    addGeometry(geometries: Geometry | Array<Geometry>, fitView?: any): any;
    /**
     * Get minimum zindex of geometries
     */
    getGeoMinZIndex(): number;
    /**
     * Get maximum zindex of geometries
     */
    getGeoMaxZIndex(): number;
    _add(geo: any, extent: any, i: any): void;
    /**
     * Removes one or more geometries from the layer
     * @param  {String|String[]|Geometry|Geometry[]} geometries - geometry ids or geometries to remove
     * @returns {OverlayLayer} this
     */
    removeGeometry(geometries: Geometry | Array<Geometry>): any;
    /**
     * Clear all geometries in this layer
     * @returns {OverlayLayer} this
     */
    clear(): this;
    /**
     * Called when geometry is being removed to clear the context concerned.
     * @param  {Geometry} geometry - the geometry instance to remove
     * @protected
     */
    onRemoveGeometry(geometry: any): void;
    /**
     * Gets layer's style.
     * @return {Object|Object[]} layer's style
     */
    getStyle(): any;
    /**
     * Sets style to the layer, styling the geometries satisfying the condition with style's symbol. <br>
     * Based on filter type in [mapbox-gl-js's style specification]{https://www.mapbox.com/mapbox-gl-js/style-spec/#types-filter}.
     * @param {Object|Object[]} style - layer's style
     * @returns {VectorLayer} this
     * @fires VectorLayer#setstyle
     * @example
     * layer.setStyle([
        {
          'filter': ['==', 'count', 100],
          'symbol': {'markerFile' : 'foo1.png'}
        },
        {
          'filter': ['==', 'count', 200],
          'symbol': {'markerFile' : 'foo2.png'}
        }
      ]);
     */
    setStyle(style: any): this;
    _styleGeometry(geometry: any): boolean;
    /**
     * Removes layers' style
     * @returns {VectorLayer} this
     * @fires VectorLayer#removestyle
     */
    removeStyle(): this;
    onAddGeometry(geo: any): void;
    hide(): any;
    _initCache(): void;
    _updateZIndex(...zIndex: any[]): void;
    _sortGeometries(): void;
    _compare(a: any, b: any): number;
    _findInList(geo: any): any;
    _onGeometryEvent(param: any): void;
    _onGeometryIdChange(param: any): void;
    _onGeometryZIndexChange(param: any): void;
    _onGeometryPositionChange(param: any): void;
    _onGeometryShapeChange(param: any): void;
    _onGeometrySymbolChange(param: any): void;
    _onGeometryShow(param: any): void;
    _onGeometryHide(param: any): void;
    _onGeometryPropertiesChange(param: any): void;
    _hasGeoListeners(eventTypes: any): boolean;
}
export default OverlayLayer;
