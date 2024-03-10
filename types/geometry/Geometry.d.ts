import Class from '../core/Class';
import Coordinate from '../geo/Coordinate';
import Point from '../geo/Point';
import Extent from '../geo/Extent';
import PointExtent from '../geo/PointExtent';
import Painter from '../renderer/geometry/Painter';
import { Player } from './../core/Animation';
import Size from './../geo/Size';
import OverlayLayer from './../layer/OverlayLayer';
import { Menu } from './../ui';
import { GeoPropertiesType } from './../types';
export type GeometyOptionsType = {
    id?: string | number;
    visible?: boolean;
    editable?: boolean;
    interactive?: boolean;
    cursor?: string;
    measure?: string;
    draggable?: boolean;
    dragShadow?: boolean;
    dragOnAxis?: string;
    zIndex?: number;
    antiMeridian?: boolean;
    symbol?: any;
    properties?: object;
    defaultProjection?: string;
};
interface GeometryInterface {
    startEdit(opts: object): any;
    endEdit(): any;
    redoEdit(): any;
    undoEdit(): any;
    cancelEdit(): any;
    isEditing(): boolean;
    setMenu(options: object): any;
    getMenu(): Menu;
    openMenu(coordinate: Coordinate): any;
    setMenuItems(items: any): any;
    getMenuItems(): any;
    closeMenu(): any;
    removeMenu(): any;
}
declare const Geometry_base: {
    new (...args: any[]): {
        _onEvent(event: any, type: any): void;
        _getEventTypeToFire(domEvent: any): any;
    };
} & {
    new (...args: any[]): {
        _animPlayer: Player;
        _animationStarted: boolean;
        animate(styles: any, options: any, step: any): Player;
        _prepareAnimationStyles(styles: any): {};
        _fireAnimateEvent(playState: any): void;
    };
} & {
    new (...args: any[]): {
        _infoWindow: any;
        _infoWinOptions: object;
        setInfoWindow(options: any): any;
        getInfoWindow(): any;
        openInfoWindow(coordinate: any): any;
        closeInfoWindow(): any;
        removeInfoWindow(): any;
        _bindInfoWindow(): any;
        _unbindInfoWindow(): any;
    };
} & {
    new (...args: any[]): {
        _jsonType: string;
        getJSONType(): string;
    };
    registerJSONType(type: string): any & {
        new (...args: any[]): {
            _eventMap: object;
            _eventParent: any;
            _eventTarget: any;
            on(eventsOn: string, handler: Function, context?: any): any;
            addEventListener(): any;
            once(eventTypes: string, handler: Function, context?: any): any;
            off(eventsOff: string, handler: Function, context: any): any;
            removeEventListener(): any;
            listens(eventType: string, handler?: Function, context?: any): any;
            getListeningEvents(): string[];
            copyEventListeners(target: any): any;
            fire(): any;
            _wrapOnceHandler(evtType: any, handler: any, context: any): () => void;
            _switch(to: any, eventKeys: any, context: any): any;
            _clearListeners(eventType: any): void;
            _clearAllListeners(): void;
            _setEventParent(parent: any): any;
            _setEventTarget(target: any): any;
            _fire(eventType: string, param: any): any;
        };
    } & {
        new (...args: any[]): {
            _handlers: any[];
            addHandler(name: any, handlerClass: any): any;
            removeHandler(name: any): any;
            _clearHandlers(): void;
        };
    } & typeof Class;
    getJSONClass(type: string): any;
} & {
    new (...args: any[]): {
        _eventMap: object;
        _eventParent: any;
        _eventTarget: any;
        on(eventsOn: string, handler: Function, context?: any): any;
        addEventListener(): any;
        once(eventTypes: string, handler: Function, context?: any): any;
        off(eventsOff: string, handler: Function, context: any): any;
        removeEventListener(): any;
        listens(eventType: string, handler?: Function, context?: any): any;
        getListeningEvents(): string[];
        copyEventListeners(target: any): any;
        fire(): any;
        _wrapOnceHandler(evtType: any, handler: any, context: any): () => void;
        _switch(to: any, eventKeys: any, context: any): any;
        _clearListeners(eventType: any): void;
        _clearAllListeners(): void;
        _setEventParent(parent: any): any;
        _setEventTarget(target: any): any;
        _fire(eventType: string, param: any): any;
    };
} & {
    new (...args: any[]): {
        _handlers: any[];
        addHandler(name: any, handlerClass: any): any;
        removeHandler(name: any): any;
        _clearHandlers(): void;
    };
} & typeof Class;
/**
 * Base class for all the geometries. <br/>
 * It defines common methods that all the geometry classes share. <br>
 * It is abstract and not intended to be instantiated but extended.
 *
 * @category geometry
 * @abstract
 * @extends Class
 * @mixes Eventable
 * @mixes Handlerable
 * @mixes JSONAble
 * @mixes GeometryInfoWindow
 * @mixes GeometryAnimation
 * @mixes ui.Menuable
 */
declare class Geometry extends Geometry_base implements GeometryInterface {
    type: string;
    _layer: OverlayLayer;
    _id: string | number;
    properties: any;
    __symbol: any;
    _symbol: any;
    _symbolUpdated: any;
    _compiledSymbol: any;
    _symbolHash: any;
    _textDesc: any;
    _eventSymbolProperties: any;
    _sizeSymbol: any;
    _fixedExtent: PointExtent;
    _extent2d: PointExtent;
    _silence: boolean;
    _externSymbol: any;
    _extent: PointExtent;
    _animPlayer: Player;
    _internalId: any;
    _projCode: any;
    _painter: any;
    _maskPainter: any;
    _dirtyCoords: any;
    _coordinates: any;
    _pcenter: any;
    _parent: Geometry;
    _infoWinOptions: object;
    _minAlt: number;
    _maxAlt: number;
    static fromJSON(json: object): Geometry;
    constructor(options: GeometyOptionsType);
    isGeometry(): boolean;
    /**
     * Returns the first coordinate of the geometry.
     *
     * @return {Coordinate} First Coordinate
     */
    getFirstCoordinate(): Coordinate | null;
    /**
     * Returns the last coordinate of the geometry.
     *
     * @return {Coordinate} Last Coordinate
     */
    getLastCoordinate(): Coordinate | null;
    /**
     * Adds the geometry to a layer
     * @param {Layer} layer    - layer add to
     * @param {Boolean} [fitview=false] - automatically set the map to a fit center and zoom for the geometry
     * @return {Geometry} this
     * @fires Geometry#add
     */
    addTo(layer: OverlayLayer, fitview?: any): this;
    /**
     * Get the layer which this geometry added to.
     * @returns {Layer} - layer added to
     */
    getLayer(): OverlayLayer | null;
    /**
     * Get the map which this geometry added to
     * @returns {Map} - map added to
     */
    getMap(): import("src").Map;
    /**
     * Gets geometry's id. Id is set by setId or constructor options.
     * @returns {String|Number} geometry的id
     */
    getId(): string | number;
    /**
     * Set geometry's id.
     * @param {String} id - new id
     * @returns {Geometry} this
     * @fires Geometry#idchange
     */
    setId(id: string | number): this;
    /**
     * Get geometry's properties. Defined by GeoJSON as [feature's properties]{@link http://geojson.org/geojson-spec.html#feature-objects}.
     *
     * @returns {Object} properties
     */
    getProperties(): GeoPropertiesType | null;
    /**
     * Set a new properties to geometry.
     * @param {Object} properties - new properties
     * @returns {Geometry} this
     * @fires Geometry#propertieschange
     */
    setProperties(properties: GeoPropertiesType): this;
    /**
     * Get type of the geometry, e.g. "Point", "LineString"
     * @returns {String} type of the geometry
     */
    getType(): string;
    /**
     * Get symbol of the geometry
     * @returns {Object} geometry's symbol
     */
    getSymbol(): any;
    /**
     * Set a new symbol to style the geometry.
     * @param {Object} symbol - new symbol
     * @see {@tutorial symbol Style a geometry with symbols}
     * @return {Geometry} this
     * @fires Geometry#symbolchange
     */
    setSymbol(symbol: any): this;
    /**
     * Get symbol's hash code
     * @return {String}
     */
    getSymbolHash(): any;
    /**
     * Update geometry's current symbol.
     *
     * @param  {Object | Array} props - symbol properties to update
     * @return {Geometry} this
     * @fires Geometry#symbolchange
     * @example
     * var marker = new Marker([0, 0], {
     *  // if has markerFile , the priority of the picture is greater than the vector and the path of svg
     *  // svg image type:'path';vector type:'cross','x','diamond','bar','square','rectangle','triangle','ellipse','pin','pie'
     *    symbol : {
     *       markerType : 'ellipse',
     *       markerWidth : 20,
     *       markerHeight : 30
     *    }
     * });
     * // update symbol's markerWidth to 40
     * marker.updateSymbol({
     *     markerWidth : 40
     * });
     */
    updateSymbol(props: any): this;
    /**
     * Get geometry's text content if it has
     * @returns {String}
     */
    getTextContent(): string | any[];
    getTextDesc(): any;
    /**
     * Get the geographical center of the geometry.
     *
     * @returns {Coordinate}
     */
    getCenter(): Coordinate;
    /**
     * Get the geometry's geographical extent
     *
     * @returns {Extent} geometry's extent
     */
    getExtent(): Extent;
    /**
     * Get geometry's screen extent in pixel
     *
     * @returns {PointExtent}
     */
    getContainerExtent(out?: any): PointExtent | null;
    _getFixedExtent(): PointExtent;
    get2DExtent(): PointExtent | null;
    /**
     * Get pixel size of the geometry, which may vary in different zoom levels.
     *
     * @returns {Size}
     */
    getSize(): Size | null;
    /**
     * Whehter the geometry contains the input container point.
     *
     * @param  {Point|Coordinate} point - input container point or coordinate
     * @param  {Number} [t=undefined] - tolerance in pixel
     * @return {Boolean}
     * @example
     * var circle = new Circle([0, 0], 1000)
     *     .addTo(layer);
     * var contains = circle.containsPoint(new maptalks.Point(400, 300));
     */
    containsPoint(containerPoint: Point, t: any): boolean;
    _containsPoint(containerPoint: any, t: any): boolean;
    /**
     * Show the geometry.
     *
     * @return {Geometry} this
     * @fires Geometry#show
     */
    show(): this;
    /**
     * Hide the geometry
     *
     * @return {Geometry} this
     * @fires Geometry#hide
     */
    hide(): this;
    /**
     * Whether the geometry is visible
     *
     * @returns {Boolean}
     */
    isVisible(): boolean;
    /**
     * Get zIndex of the geometry, default is 0
     * @return {Number} zIndex
     */
    getZIndex(): number;
    /**
     * Set a new zIndex to Geometry and fire zindexchange event (will cause layer to sort geometries and render)
     * @param {Number} zIndex - new zIndex
     * @return {Geometry} this
     * @fires Geometry#zindexchange
     */
    setZIndex(zIndex: number): this;
    /**
     * Only set a new zIndex to Geometry without firing zindexchange event. <br>
     * Can be useful to improve perf when a lot of geometries' zIndex need to be updated. <br>
     * When updated N geometries, You can use setZIndexSilently with (N-1) geometries and use setZIndex with the last geometry for layer to sort and render.
     * @param {Number} zIndex - new zIndex
     * @return {Geometry} this
     */
    setZIndexSilently(zIndex: any): this;
    /**
     * Bring the geometry on the top
     * @return {Geometry} this
     * @fires Geometry#zindexchange
     */
    bringToFront(): this;
    /**
     * Bring the geometry to the back
     * @return {Geometry} this
     * @fires Geometry#zindexchange
     */
    bringToBack(): this;
    /**
     * Translate or move the geometry by the given offset.
     *
     * @param  {Coordinate} offset - translate offset
     * @return {Geometry} this
     * @fires Geometry#positionchange
     * @fires Geometry#shapechange
     */
    /**
     * Translate or move the geometry by the given offset.
     *
     * @param  {Number} x - x offset
     * @param  {Number} y - y offset
     * @return {Geometry} this
     * @fires Geometry#positionchange
     * @fires Geometry#shapechange
     */
    translate(x: number, y: number): this;
    /**
     * Flash the geometry, show and hide by certain internal for times of count.
     *
     * @param {Number} [interval=100]     - interval of flash, in millisecond (ms)
     * @param {Number} [count=4]          - flash times
     * @param {Function} [cb=null]        - callback function when flash ended
     * @param {*} [context=null]          - callback context
     * @return {Geometry} this
     */
    flash(interval: number, count: number, cb: Function, context?: any): any;
    /**
     * Returns a copy of the geometry without the event listeners.
     * @returns {Geometry} copy
     */
    copy(): Geometry;
    /**
     * remove itself from the layer if any.
     * @returns {Geometry} this
     * @fires Geometry#removestart
     * @fires Geometry#remove
     */
    remove(): this;
    /**
     * Exports [geometry]{@link http://geojson.org/geojson-spec.html#feature-objects} out of a GeoJSON feature.
     * @return {Object} GeoJSON Geometry
     */
    toGeoJSONGeometry(): object;
    /**
     * Exports a GeoJSON feature.
     * @param {Object} [opts=null]              - export options
     * @param {Boolean} [opts.geometry=true]    - whether export geometry
     * @param {Boolean} [opts.properties=true]  - whether export properties
     * @returns {Object} GeoJSON Feature
     */
    toGeoJSON(opts?: any): object;
    /**
     * Export a profile json out of the geometry. <br>
     * Besides exporting the feature object, a profile json also contains symbol, construct options and infowindow info.<br>
     * The profile json can be stored somewhere else and be used to reproduce the geometry later.<br>
     * Due to the problem of serialization for functions, event listeners and contextmenu are not included in profile json.
     * @example
     *     // an example of a profile json.
     * var profile = {
            "feature": {
                  "type": "Feature",
                  "id" : "point1",
                  "geometry": {"type": "Point", "coordinates": [102.0, 0.5]},
                  "properties": {"prop0": "value0"}
            },
            //construct options.
            "options":{
                "draggable" : true
            },
            //symbol
            "symbol":{
                "markerFile"  : "http://foo.com/icon.png",
                "markerWidth" : 20,
                "markerHeight": 20
            },
            //infowindow info
            "infowindow" : {
                "options" : {
                    "style" : "black"
                },
                "title" : "this is a infowindow title",
                "content" : "this is a infowindow content"
            }
        };
     * @param {Object}  [options=null]          - export options
     * @param {Boolean} [opts.geometry=true]    - whether export feature's geometry
     * @param {Boolean} [opts.properties=true]  - whether export feature's properties
     * @param {Boolean} [opts.options=true]     - whether export construct options
     * @param {Boolean} [opts.symbol=true]      - whether export symbol
     * @param {Boolean} [opts.infoWindow=true]  - whether export infowindow
     * @return {Object} profile json object
     */
    toJSON(options?: any): object;
    /**
     * Get the geographic length of the geometry.
     * @returns {Number} geographic length, unit is meter
     */
    getLength(): number;
    /**
     * Get the geographic area of the geometry.
     * @returns {Number} geographic area, unit is sq.meter
     */
    getArea(): number;
    /**
     * Rotate the geometry of given angle around a pivot point
     * @param {Number} angle - angle to rotate in degree
     * @param {Coordinate} [pivot=null]  - optional, will be the geometry's center by default
     * @returns {Geometry} this
     */
    rotate(angle: number, pivot: any): this;
    /**
     * Get the connect points for [ConnectorLine]{@link ConnectorLine}
     * @return {Coordinate[]} connect points
     * @private
     */
    _getConnectPoints(): Coordinate[];
    _initOptions(options: any): void;
    _bindLayer(layer: OverlayLayer): void;
    _prepareSymbol(symbol: any): any;
    _checkAndCopySymbol(symbol: any): {};
    _getSymbol(): any;
    /**
     * Sets a external symbol to the geometry, e.g. style from VectorLayer's setStyle
     * @private
     * @param {Object} symbol - external symbol
     */
    _setExternSymbol(symbol: any): this;
    _getInternalSymbol(): any;
    _getPrjExtent(): PointExtent;
    _unbind(): void;
    _getInternalId(): any;
    _setInternalId(id: any): void;
    _getMeasurer(): any;
    _getProjection(): any;
    _verifyProjection(): void;
    _getExternalResources(): any[];
    _getPainter(): Painter;
    _getMaskPainter(): any;
    _removePainter(): void;
    _paint(extent?: any): void;
    _clearCache(): void;
    _clearProjection(): void;
    _repaint(): void;
    onHide(): void;
    onShapeChanged(): void;
    onPositionChanged(): void;
    onSymbolChanged(): void;
    _genSizeSymbol(): void;
    _getSizeSymbol(symbol: any): any;
    _getCompiledSymbol(): any;
    onConfig(conf: any): void;
    /**
     * Set a parent to the geometry, which is usually a MultiPolygon, GeometryCollection, etc
     * @param {GeometryCollection} geometry - parent geometry
     * @private
     */
    _setParent(geometry: any): void;
    _getParent(): Geometry;
    _fireEvent(eventName: any, param?: any): void;
    _toJSON(options?: any): {
        feature: object;
    };
    _exportGraphicOptions(options: any): {};
    _exportGeoJSONGeometry(): {
        type: string;
        coordinates: any;
    };
    _exportProperties(): any;
    _hitTestTolerance(): any;
    _getAltitude(): any;
    getAltitude(): number | Array<number>;
    setAltitude(alt: number): this;
    _genMinMaxAlt(): void;
    getMinAltitude(): number;
    getMaxAltitude(): number;
    startEdit(opts: object): void;
    endEdit(): void;
    redoEdit(): void;
    undoEdit(): void;
    cancelEdit(): void;
    isEditing(): boolean;
    setMenu(options: object): void;
    getMenu(): Menu;
    openMenu(coordinate: Coordinate): void;
    setMenuItems(items: any): void;
    getMenuItems(): void;
    closeMenu(): void;
    removeMenu(): void;
}
export default Geometry;
