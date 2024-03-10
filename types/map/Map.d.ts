import Class from '../core/Class';
import Point from '../geo/Point';
import Size from '../geo/Size';
import PointExtent from '../geo/PointExtent';
import Extent from '../geo/Extent';
import Coordinate from '../geo/Coordinate';
import Layer from '../layer/Layer';
import SpatialReference from './spatial-reference/SpatialReference';
import MapRenderer from './../renderer/map/MapRenderer';
import { Player } from './../core/Animation';
import MapCanvasRenderer from './../renderer/map/MapCanvasRenderer';
import { MapDataURLType, MapPanelsType, MapViewType } from './../types';
import { Geometry } from '../geometry'
import CollisionIndex from '../core/CollisionIndex'

interface MapInterface {
    getFov(): number;
    setFov(fov: number): any;
    getBearing(): number;
    setBearing(bearing: number): any;
    setPitch(pitch: number): any;
    getPitch(): number;
    isTransforming(): boolean;
    getFrustumAltitude(): number;
    updateCenterAltitude(): number;
    getViewHistory(): Array<any>;
    hasNextView(): boolean;
    zoomToNextView(): any;
    hasPreviousView(): boolean;
    zoomToPreviousView(): any;
    animateTo(view: MapViewType, options: object, step: Function): any;
    flyTo(view: MapViewType, options: object, step: Function): any;
    isAnimating(): boolean;
    isRotating(): boolean;
    isFullScreen(): boolean;
    requestFullScreen(dom: HTMLElement): boolean;
    cancelFullScreen(): any;
    panTo(coordinate: Coordinate, options?: any, step?: any): any;
    panBy(offset: Point, options?: any, step?: any): any;
    coordinateToPoint(coordinate: Coordinate, zoom?: number, out?: Point): Point;
    coordinateToPointAtRes(coordinate: Coordinate, res?: number, out?: Point): Point;
    pointToCoordinate(point: Point, zoom?: number, out?: Coordinate): Coordinate;
    pointAtResToCoordinate(point: Point, res?: number, out?: Coordinate): Coordinate;
    coordinateToViewPoint(coordinate: Coordinate, out?: Point, altitude?: number): Point;
    viewPointToCoordinate(viewPoint: Point, out?: Coordinate): Coordinate;
    coordinateToContainerPoint(coordinate: Coordinate, zoom?: number, out?: Point): Point;
    coordinateToContainerPointAtRes(coordinate: Coordinate, res?: number, out?: Point): Point;
    coordinatesToContainerPoints(coordinates: Array<Coordinate>, zoom?: number): Array<Point>;
    coordinatesToContainerPointsAtRes(coordinates: Array<Coordinate>, resolution?: number): Array<Point>;
    containerPointToCoordinate(containerPoint: Point, out?: Coordinate): Coordinate;
    containerToExtent(containerExtent: PointExtent): Extent;
    distanceToPixel(xDist: number, yDist: number, zoom?: number): Size;
    distanceToPoint(xDist: number, yDist: number, zoom?: number, paramCenter?: Coordinate): Point;
    distanceToPointAtRes(xDist: number, yDist: number, res?: number, paramCenter?: Coordinate, out?: Point): Point;
    altitudeToPoint(altitude: number, res?: number, originCenter?: Coordinate): number;
    pointAtResToAltitude(point: number, res?: number, originCenter?: Coordinate): number;
    pixelToDistance(width: number, height: number): number;
    pointToDistance(dx: number, dy: number, zoom?: number): number;
    pointAtResToDistance(dx: number, dy: number, res?: number, paramCenter?: Coordinate): number;
    locateByPoint(coordinate: Coordinate, px: number, py: number): Coordinate;
    _pointAtResToContainerPoint(point: Point, res: number, altitude?: number, out?: Point): Point;
    _containerPointToPoint(point: Point, zoom?: number, out?: Point): Point;
    _pointToContainerPoint(point: Point, zoom?: number, altitude?: number, out?: Point): Point;
    _get2DExtent(zoom?: number, out?: Extent): Extent;
    _get2DExtentAtRes(res?: number, out?: Extent): Extent;
    _pointsAtResToContainerPoints(cPoints: Array<Point>, glRes: number, altitudes: number | Array<number>, pts: Array<Point>): Array<Point>;
    _prjToContainerPoint(pCoordinate: Coordinate, zoom?: number, out?: Point, altitude?: number): Point;
    _animateTo(view: MapViewType, options?: object, step?: Function): any;
    onZoomStart(nextZoom: number, origin: Point): any;
    onZooming(nextZoom: number, origin: Point, startScale?: number): any;
    onZoomEnd(nextZoom: number, origin: Point): any;
    _checkZoomOrigin(origin: Point): Point;
    _checkZoom(nextZoom: number): number;
    _ignoreEvent(domEvent: MouseEvent): boolean;
    _stopAnim(player: Player): any;
    _getActualEvent(e: MouseEvent): any;
    _isEventOutMap(e: MouseEvent): boolean;
    _panTo(prjCoord: Coordinate, options: object): any;
    _setBearing(bearing: number): any;
    _setPitch(pitch: number): any;
    _zoomAnimation(nextZoom: number, origin: Point, startScale?: number): any;
}
export type MapOptionsType = {
    centerCross?: boolean;
    seamlessZoom?: boolean;
    zoomInCenter?: boolean;
    zoomOrigin?: any;
    zoomAnimation?: boolean;
    zoomAnimationDuration?: number;
    panAnimation?: boolean;
    panAnimationDuration?: number;
    rotateAnimation?: boolean;
    rotateAnimationDuration?: number;
    zoomable?: boolean;
    enableInfoWindow?: boolean;
    hitDetect?: boolean;
    hitDetectLimit?: number;
    fpsOnInteracting?: number;
    layerCanvasLimitOnInteracting?: number;
    maxZoom?: number;
    minZoom?: number;
    maxExtent?: Extent;
    fixCenterOnResize?: boolean;
    maxPitch?: number;
    maxVisualPitch?: number;
    viewHistory?: boolean;
    viewHistoryCount?: number;
    draggable?: boolean;
    dragPan?: boolean;
    dragRotate?: boolean;
    dragPitch?: boolean;
    dragRotatePitch?: boolean;
    touchGesture?: boolean;
    touchZoom?: boolean;
    touchRotate?: boolean;
    touchPitch?: boolean;
    touchZoomRotate?: boolean;
    doubleClickZoom?: boolean;
    scrollWheelZoom?: boolean;
    geometryEvents?: boolean;
    clickTimeThreshold?: number;
    control?: boolean;
    attribution?: boolean;
    zoomControl?: boolean;
    scaleControl?: boolean;
    overviewControl?: boolean;
    fog?: boolean;
    fogColor?: Array<number>;
    renderer?: string;
    devicePixelRatio?: number;
    heightFactor?: number;
    cameraInfiniteFar?: boolean;
    stopRenderOnOffscreen?: boolean;
    center: Array<number>;
    zoom: number;
    baseLayer?: Layer;
};
declare const Map_base: {
    new(...args: any[]): {
        computeLength(coord1: Coordinate, coord2: Coordinate): any;
        computeGeometryLength(geometry: Geometry): any;
        computeGeometryArea(geometry: Geometry): any;
        identify(opts: any, callback: any): any;
        identifyAtPoint(opts: any, callback: any): any;
        _identify(opts: any, callback: any, fn: any): any;
    };
} & {
    new(...args: any[]): {
        _collisionIndex: CollisionIndex;
        collisionFrameTime: number;
        _uiCollidesQueue: number[];
        uiList: any[];
        getCollisionIndex(): CollisionIndex;
        createCollisionIndex(): CollisionIndex;
        clearCollisionIndex(): any;
        _insertUICollidesQueue(): any;
        uiCollides(): any;
        _addUI(ui: any): any;
        _removeUI(ui: any): number;
    };
} & {
    new(...args: any[]): {
        _handlers: any[];
        addHandler(name: any, handlerClass: any): any;
        removeHandler(name: any): any;
        _clearHandlers(): void;
    };
} & {
    new(...args: any[]): {
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
    new(...args: any[]): {};
    registerRenderer(name: any, clazz: any): any & typeof Class;
    getRendererClass(name: any): any;
} & typeof Class;
/**
 * The central class of the library, to create a map on a container.
 * @category map
 * @extends Class
 *
 * @mixes Eventable
 * @mixes Handlerable
 * @mixes MapCollision
 * @mixes MapTopo
 * @mixes ui.Menuable
 * @mixes Renderable
 *
 * @example
 * var map = new maptalks.Map("map",{
 *      center:     [180,0],
 *      zoom:  4,
 *      baseLayer : new maptalks.TileLayer("base",{
 *          urlTemplate:'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
 *          subdomains:['a','b','c']
 *      }),
 *      layers : [
 *          new maptalks.VectorLayer('v', [new maptalks.Marker([180, 0])])
 *      ]
 * });
 */
declare class Map extends Map_base implements MapInterface {
    static VERSION: string;
    VERSION: string;
    _loaded: boolean;
    _panels: MapPanelsType;
    _baseLayer: Layer;
    _layers: Array<Layer>;
    _zoomLevel: number;
    _center: any;
    _mapViewPoint: Point;
    _containerDOM: HTMLElement;
    _spatialReference: SpatialReference;
    _cursor: string;
    _prjCenter: Point;
    centerAltitude: number;
    width: number;
    height: number;
    cameraCenterDistance: number;
    _prjMaxExtent: PointExtent;
    _glRes: number;
    _zooming: boolean;
    _layerCache: any;
    _initTime: number;
    _mapViewCoord: Point;
    _eventSilence: boolean;
    renderer: MapRenderer;
    _moving: boolean;
    _mapAnimPlayer: Player;
    _animPlayer: Player;
    _originCenter: Point;
    _suppressRecenter: boolean;
    _dragRotating: boolean;
    CanvasClass: any;
    _priorityCursor: string;
    _renderer: MapCanvasRenderer;
    _containerDomContentRect: DOMRect;
    _mapRes: number;
    cameraPosition: any;
    projViewMatrix: any;
    domCssMatrix: any;
    cameraLookAt: any;
    _glScale: number;
    cascadeFrustumMatrix0: any;
    cascadeFrustumMatrix1: any;
    options: MapOptionsType;
    /**
     * @param {(string|HTMLElement|object)} container - The container to create the map on, can be:<br>
     *                                          1. A HTMLElement container.<br/>
     *                                          2. ID of a HTMLElement container.<br/>
     *                                          3. Any canvas compatible container
     * @param {Object} options - construct options
     * @param {(Number[]|Coordinate)} options.center - initial center of the map.
     * @param {Number} options.zoom - initial zoom of the map.
     * @param {Object} [options.spatialReference=null] - map's spatial reference, default is using projection EPSG:3857 with resolutions used by google map/osm.
     * @param {Layer} [options.baseLayer=null] - base layer that will be set to map initially.
     * @param {Layer[]} [options.layers=null] - layers that will be added to map initially.
     * @param {*} options.* - any other option defined in [Map.options]{@link Map#options}      [description]
     */
    constructor(container: string | HTMLDivElement | HTMLCanvasElement, options: MapOptionsType);
    static fromJSON(container: any, profile: any, options: any): Map;
    /**
     * Add hooks for additional codes when map's loading complete, useful for plugin developping.
     * Note that it can only be called before the map is created.
     * @param {Function} fn
     * @returns {Map}
     * @protected
     */
    static addOnLoadHook(fn: any): typeof Map;
    toJSON(options?: object): object;
    /**
     * Whether the map is loaded or not.
     * @return {Boolean}
     */
    isLoaded(): boolean;
    /**
     * Get map's container
     * @returns {HTMLElement}
     */
    getContainer(): HTMLElement;
    /**
     * Get the spatial reference of the Map.
     * @return {SpatialReference} map's spatial reference
     */
    getSpatialReference(): SpatialReference;
    /**
     * Change the spatial reference of the map. <br>
     * A SpatialReference is a series of settings to decide the map presentation:<br>
     * 1. the projection.<br>
     * 2. zoom levels and resolutions. <br>
     * 3. full extent.<br>
     * There are some [predefined spatial references]{@link http://www.foo.com}, and surely you can [define a custom one.]{@link http://www.foo.com}.<br>
     * SpatialReference can also be updated by map.config('spatialReference', spatialReference);
     * @param {SpatialReference} spatialReference - spatial reference
     * @returns {Map} this
     * @fires Map#spatialreferencechange
     * @example
     *  map.setSpatialReference({
            projection:'EPSG:4326',
            resolutions: (function() {
                const resolutions = [];
                for (let i=0; i < 19; i++) {
                    resolutions[i] = 180/(Math.pow(2, i)*128);
                }
                return resolutions;
            })()
     *  });
       @example
     *  map.config('spatialReference', {
            projection:'EPSG:4326',
            resolutions: (function() {
                const resolutions = [];
                for (let i=0; i < 19; i++) {
                    resolutions[i] = 180/(Math.pow(2, i)*128);
                }
                return resolutions;
            })()
        });
     */
    setSpatialReference(ref: any): this;
    _updateSpatialReference(ref: any, oldRef: any): this;
    /**
     * Callback when any option is updated
     * @private
     * @param  {Object} conf - options to update
     * @return {Map}   this
     */
    onConfig(conf: any): this;
    /**
     * Get the projection of the map. <br>
     * Projection is an algorithm for map projection, e.g. well-known [Mercator Projection]{@link https://en.wikipedia.org/wiki/Mercator_projection} <br>
     * A projection must have 2 methods: <br>
     * 1. project(coordinate) - project the input coordinate <br>
     * 2. unproject(coordinate) - unproject the input coordinate <br>
     * Projection also contains measuring method usually extended from a measurer: <br>
     * 1. measureLength(coord1, coord2) - compute length between 2 coordinates.  <br>
     * 2. measureArea(coords[]) - compute area of the input coordinates. <br>
     * 3. locate(coord, distx, disty) - compute the coordinate from the coord with xdist on axis x and ydist on axis y.
     * @return {Object}
     */
    getProjection(): any;
    /**
     * Get map's full extent, which is defined in map's spatial reference. <br>
     * eg: {'left': -180, 'right' : 180, 'top' : 90, 'bottom' : -90}
     * @return {Extent}
     */
    getFullExtent(): Extent | null;
    /**
     * Set map's cursor style, cursor style is same with CSS.
     * @param {String} cursor - cursor style
     * @returns {Map} this
     * @example
     * map.setCursor('url(cursor.png) 4 12, auto');
     */
    setCursor(cursor: string): this;
    /**
     * Reset map's cursor style.
     * @return {Map} this
     * @example
     * map.resetCursor();
     */
    resetCursor(): this;
    /**
     * Get center of the map.
     * @return {Coordinate}
     */
    getCenter(): Coordinate;
    /**
     * Set a new center to the map.
     * @param {Coordinate} center
     * @param  {Object} [padding]
     * @param  {Number} [padding.paddingLeft] - Sets the amount of padding in the left of a map container
     * @param  {Number} [padding.paddingTop] - Sets the amount of padding in the top of a map container
     * @param  {Number} [padding.paddingRight] - Sets the amount of padding in the right of a map container
     * @param  {Number} [padding.paddingBottom] - Sets the amount of padding in the bottom of a map container
     * @return {Map} this
     */
    setCenter(center: any, padding?: any): this;
    /**
     * Get map's size (width and height) in pixel.
     * @return {Size}
     */
    getSize(): Size;
    /**
     * Get container extent of the map
     * @return {PointExtent}
     */
    getContainerExtent(): PointExtent;
    _getVisualHeight(visualPitch: any): number;
    /**
     * Get the geographical extent of map's current view extent.
     *
     * @return {Extent}
     */
    getExtent(): Extent;
    /**
     * Get the projected geographical extent of map's current view extent.
     *
     * @return {Extent}
     */
    getProjExtent(): Extent;
    /**
     * Alias for getProjExtent
     *
     * @return {Extent}
     */
    getPrjExtent(): Extent;
    /**
     * Get the max extent that the map is restricted to.
     * @return {Extent}
     */
    getMaxExtent(): Extent | null;
    /**
     * Sets the max extent that the map is restricted to.
     * @param {Extent}
     * @return {Map} this
     * @example
     * map.setMaxExtent(map.getExtent());
     */
    setMaxExtent(extent: Extent | Array<number>): this;
    /**
     * Get map's current zoom.
     * @return {Number}
     */
    getZoom(): number;
    /**
     * Caculate the target zoom if scaling from "fromZoom" by "scale"
     * @param  {Number} scale
     * @param  {Number} fromZoom
     * @param  {Boolean} isFraction - can return fractional zoom
     * @return {Number} zoom fit for scale starting from fromZoom
     */
    getZoomForScale(scale: any, fromZoom: any, isFraction: any): number;
    getZoomFromRes(res: number): number;
    /**
     * Sets zoom of the map
     * @param {Number} zoom
     * @param {Object} [options=null] options
     * @param {Boolean} [options.animation=true] whether zoom is animation, true by default
     * @returns {Map} this
     */
    setZoom(zoom: number, options?: {
        animation: boolean;
    }): this;
    /**
     * Get the max zoom that the map can be zoom to.
     * @return {Number}
     */
    getMaxZoom(): number;
    /**
     * Sets the max zoom that the map can be zoom to.
     * @param {Number} maxZoom
     * @returns {Map} this
     */
    setMaxZoom(maxZoom: number): this;
    /**
     * Get the min zoom that the map can be zoom to.
     * @return {Number}
     */
    getMinZoom(): number;
    /**
     * Sets the min zoom that the map can be zoom to.
     * @param {Number} minZoom
     * @return {Map} this
     */
    setMinZoom(minZoom: number): this;
    /**
     * Maximum zoom the map has
     * @return {Number}
     */
    getMaxNativeZoom(): number;
    /**
     * Resolution for world point in WebGL context
     * @returns {Number}
     */
    getGLRes(): number;
    /**
     * Caculate scale from gl zoom to given zoom (default by current zoom)
     * @param {Number} [zoom=undefined] target zoom, current zoom by default
     * @returns {Number}
     * @examples
     * const point = map.coordToPoint(map.getCenter());
     * // convert to point in gl zoom
     * const glPoint = point.multi(this.getGLScale());
     */
    getGLScale(zoom?: number): number;
    /**
     * zoom in
     * @return {Map} this
     */
    zoomIn(): this;
    /**
     * zoom out
     * @return {Map} this
     */
    zoomOut(): this;
    /**
     * Whether the map is zooming
     * @return {Boolean}
     */
    isZooming(): boolean;
    /**
     * Whether the map is being interacted
     * @return {Boolean}
     */
    isInteracting(): boolean;
    /**
     * Sets the center and zoom at the same time.
     * @param {Coordinate} center
     * @param {Number} zoom
     * @return {Map} this
     */
    setCenterAndZoom(center: Coordinate | Array<number>, zoom: number): this;
    /**
     * Get the padding Size
     * @param  {Object} options
     * @param  {Number} [options.paddingLeft] - Sets the amount of padding in the left of a map container
     * @param  {Number} [options.paddingTop] - Sets the amount of padding in the top of a map container
     * @param  {Number} [options.paddingRight] - Sets the amount of padding in the right of a map container
     * @param  {Number} [options.paddingBottom] - Sets the amount of padding in the bottom of a map container
     * @returns {Object|null}
     */
    _getPaddingSize(options?: {}): {
        width: any;
        height: any;
    };
    /**
     * Caculate the zoom level that contains the given extent with the maximum zoom level possible.
     * @param {Extent} extent
     * @param  {Boolean} isFraction - can return fractional zoom
     * @param  {Object} [padding] [padding] - padding
     * @param  {Object} [padding.paddingLeft] - Sets the amount of padding in the left of a map container
     * @param  {Object} [padding.paddingTop] - Sets the amount of padding in the top of a map container
     * @param  {Object} [padding.paddingRight] - Sets the amount of padding in the right of a map container
     * @param  {Object} [padding.paddingBottom] - Sets the amount of padding in the bottom of a map container
     * @return {Number} zoom fit for scale starting from fromZoom
     */
    getFitZoom(extent: any, isFraction?: any, padding?: any): number;
    /**
     * Get map's current view (center/zoom/pitch/bearing)
     * @return {Object} { center : *, zoom : *, pitch : *, bearing : * }
     */
    getView(): MapViewType;
    /**
     * Set map's center/zoom/pitch/bearing at one time
     * @param {Object} view - a object containing center/zoom/pitch/bearing
     * return {Map} this
     */
    setView(view: MapViewType): this;
    /**
     * Get map's resolution
     * @param {Number} zoom - zoom or current zoom if not given
     * @return {Number} resolution
     */
    getResolution(zoom?: number): number;
    /**
     * Get scale of resolutions from zoom to max zoom
     * @param {Number} zoom - zoom or current zoom if not given
     * @return {Number} scale
     */
    getScale(zoom?: number): number;
    /**
     * Get center by the padding.
     * @private
     * @param  {Coordinate} center
     * @param  {Number} zoom
     * @param  {Object} padding
     * @param  {Number} [padding.paddingLeft] - Sets the amount of padding in the left of a map container
     * @param  {Number} [padding.paddingTop] - Sets the amount of padding in the top of a map container
     * @param  {Number} [padding.paddingRight] - Sets the amount of padding in the right of a map container
     * @param  {Number} [padding.paddingBottom] - Sets the amount of padding in the bottom of a map container
     * @return {Coordinate}
     */
    _getCenterByPadding(center: any, zoom: any, padding?: {}): Coordinate;
    /**
     * Set the map to be fit for the given extent with the max zoom level possible.
     * @param  {Extent} extent - extent
     * @param  {Number} zoomOffset - zoom offset
     * @param  {Object} [options={}] - options
     * @param  {Object} [options.animation]
     * @param  {Object} [options.duration]
     * @param  {Object} [options.zoomAnimationDuration]
     * @param  {Object} [options.easing='out']
     * @param  {Number} [options.paddingLeft] - Sets the amount of padding in the left of a map container
     * @param  {Number} [options.paddingTop] - Sets the amount of padding in the top of a map container
     * @param  {Number} [options.paddingRight] - Sets the amount of padding in the right of a map container
     * @param  {Number} [options.paddingBottom] - Sets the amount of padding in the bottom of a map container
     * @return {Map} - this
     */
    fitExtent(extent: Extent | Array<number>, zoomOffset?: number, options?: any, step?: any): void | this;
    /**
     * Get the base layer of the map.
     * @return {Layer}
     */
    getBaseLayer(): Layer;
    /**
     * Sets a new base layer to the map.<br>
     * Some events will be thrown such as baselayerchangestart, baselayerload, baselayerchangeend.
     * @param  {Layer} baseLayer - new base layer
     * @return {Map} this
     * @fires Map#setbaselayer
     * @fires Map#baselayerchangestart
     * @fires Map#baselayerchangeend
     */
    setBaseLayer(baseLayer: Layer): this;
    /**
     * Remove the base layer from the map
     * @return {Map} this
     * @fires Map#baselayerremove
     */
    removeBaseLayer(): this;
    /**
     * Get the layers of the map, except base layer (which should be by getBaseLayer). <br>
     * A filter function can be given to filter layers, e.g. exclude all the VectorLayers.
     * @param {Function} [filter=undefined] - a filter function of layers, return false to exclude the given layer.
     * @return {Layer[]}
     * @example
     * var vectorLayers = map.getLayers(function (layer) {
     *     return (layer instanceof VectorLayer);
     * });
     */
    getLayers(filter?: Function): Array<Layer>;
    /**
     * Get the layer with the given id.
     * @param  {String} id - layer id
     * @return {Layer}
     */
    getLayer(id: string | number): Layer | null;
    /**
     * Add a new layer on the top of the map.
     * @param  {Layer|Layer[]} layer - one or more layers to add
     * @return {Map} this
     * @fires Map#addlayer
     */
    addLayer(layers: Layer | Array<Layer>): any;
    /**
     * Remove a layer from the map
     * @param  {String|String[]|Layer|Layer[]} layer - one or more layers or layer ids
     * @return {Map} this
     * @fires Map#removelayer
     */
    removeLayer(layers: Layer | Array<Layer>): any;
    /**
     * Sort layers according to the order provided, the last will be on the top.
     * @param  {string[]|Layer[]} layers - layers or layer ids to sort
     * @return {Map} this
     * @example
     * map.addLayer([layer1, layer2, layer3]);
     * map.sortLayers([layer2, layer3, layer1]);
     * map.sortLayers(['3', '2', '1']); // sort by layer ids.
     */
    sortLayers(layers: Layer | Array<Layer>): this;
    /**
     * Exports image from the map's canvas.
     * @param {Object} [options=undefined] - options
     * @param {String} [options.mimeType=image/png] - mime type of the image: image/png, image/jpeg, image/webp
     * @param {String} [options.quality=0.92] - A Number between 0 and 1 indicating the image quality to use for image formats that use lossy compression such as image/jpeg and image/webp.
     * @param {Boolean} [options.save=false] - whether pop a file save dialog to save the export image.
     * @param {String} [options.fileName=export] - specify the file name, if options.save is true.
     * @return {String} image of base64 format.
     */
    toDataURL(options?: MapDataURLType): string | null;
    /**
     * shorter alias for coordinateToPoint
     */
    coordToPoint(coordinate: Coordinate, zoom?: number, out?: Point): Point;
    /**
     * shorter alias for coordinateToPointAtRes
     */
    coordToPointAtRes(coordinate: Coordinate, res?: number, out?: Point): Point;
    /**
     * shorter alias for pointToCoordinate
     */
    pointToCoord(point: Point, zoom?: number, out?: Coordinate): Coordinate;
    /**
     * shorter alias for pointAtResToCoordinate
     */
    pointAtResToCoord(point: Point, res?: number, out?: Point): Coordinate;
    /**
     * shorter alias for coordinateToViewPoint
     */
    coordToViewPoint(coordinate: Coordinate, out?: Point, altitude?: number): Point;
    /**
     * shorter alias for viewPointToCoordinate
     */
    viewPointToCoord(viewPoint: Point, out?: Coordinate): Coordinate;
    /**
     * shorter alias for coordinateToContainerPoint
     */
    coordToContainerPoint(coordinate: Coordinate, zoom?: number, out?: Point): Point;
    /**
     * shorter alias for containerPointToCoordinate
     */
    containerPointToCoord(containerPoint: Point, out?: Coordinate): Coordinate;
    /**
     * Converts a container point to the view point.
     * Usually used in plugin development.
     * @param {Point}
     * @param  {Point} [out=undefined]    - optional point to receive result
     * @returns {Point}
     */
    containerPointToViewPoint(containerPoint: Point, out?: Point): Point;
    /**
     * Converts a view point to the container point.
     * Usually used in plugin development.
     * @param {Point}
     * @param  {Point} [out=undefined]    - optional point to receive result
     * @returns {Point}
     */
    viewPointToContainerPoint(viewPoint: Point, out?: Point): Point;
    /**
     * Checks if the map container size changed and updates the map if so.
     * @return {Map} this
     * @fires Map#resize
     */
    checkSize(force?: boolean): this;
    /**
     * Computes the coordinate from the given meter distance.
     * @param  {Coordinate} coordinate - source coordinate
     * @param  {Number} dx           - meter distance on X axis
     * @param  {Number} dy           - meter distance on Y axis
     * @return {Coordinate} Result coordinate
     */
    locate(coordinate: Coordinate, dx: number, dy: number): Coordinate;
    /**
     * Return map's main panel
     * @returns {HTMLElement}
     */
    getMainPanel(): HTMLElement;
    /**
     * Returns map panels.
     * @return {Object}
     */
    getPanels(): MapPanelsType;
    /**
     * Remove the map
     * @return {Map} this
     */
    remove(): this;
    /**
     * whether the map is removed
     * @return {Boolean}
     */
    isRemoved(): boolean;
    /**
     * Whether the map is moving
     * @return {Boolean}
     */
    isMoving(): boolean;
    /**
     * The callback function when move started
     * @private
     * @fires Map#movestart
     */
    onMoveStart(param?: any): void;
    onMoving(param: any): void;
    onMoveEnd(param: any): void;
    onDragRotateStart(param: any): void;
    onDragRotating(param: any): void;
    onDragRotateEnd(param: any): void;
    isDragRotating(): boolean;
    /**
     * Test if given box is out of current screen
     * @param {Number[] | PointExtent} box - [minx, miny, maxx, maxy]
     * @param {Number} padding - test padding
     * @returns {Boolean}
     */
    isOffscreen(box: any, viewportPadding?: number): boolean;
    getRenderer(): MapCanvasRenderer;
    /**
     * Get map's devicePixelRatio, you can override it by setting devicePixelRatio in options.
     * @returns {Number}
     */
    getDevicePixelRatio(): number;
    /**
     * Set map's devicePixelRatio
     * @param {Number} dpr
     * @returns {Map} this
     */
    setDevicePixelRatio(dpr: number): this;
    _initContainer(container: any): void;
    /**
     * try to change cursor when map is not setCursored
     * @private
     * @param  {String} cursor css cursor
     */
    _trySetCursor(cursor: any): this;
    _setPriorityCursor(cursor: any): this;
    _setCursorToPanel(cursor: any): void;
    _removeLayer(layer: any, layerList: any): void;
    _sortLayersByZIndex(): void;
    _fireEvent(eventName: any, param?: any): void;
    _Load(): void;
    _initRenderer(): void;
    _getRenderer(): MapCanvasRenderer;
    _loadAllLayers(): void;
    /**
     * Gets layers that fits for the filter
     * @param  {fn} filter - filter function
     * @return {Layer[]}
     * @private
     */
    _getLayers(filter: any): any[];
    _eachLayer(fn: any): void;
    _onLayerEvent(param: any): void;
    _resetMapStatus(): void;
    _getContainerDomSize(): Size;
    _updateMapSize(mSize: any): this;
    /**
     * Gets projected center of the map
     * @return {Coordinate}
     * @private
     */
    _getPrjCenter(): Point;
    _setPrjCenter(pcenter: any): void;
    _setPrjCoordAtContainerPoint(coordinate: any, point: any): this;
    _verifyExtent(prjCenter: any): boolean;
    /**
     * Move map's center by pixels.
     * @param  {Point} pixel - pixels to move, the relation between value and direction is as:
     * -1,1 | 1,1
     * ------------
     *-1,-1 | 1,-1
     * @private
     * @returns {Coordinate} the new projected center.
     */
    _offsetCenterByPixel(pixel: any): void;
    /**
     * offset map panels.
     *
     * @param  {Point} offset - offset in pixel to move
     * @return {Map} this
     */
    /**
     * Gets map panel's current view point.
     * @return {Point}
     */
    offsetPlatform(offset?: any): Point | this;
    /**
     * Get map's view point, adding in frame offset
     * @return {Point} map view point
     */
    getViewPoint(): Point;
    _resetMapViewPoint(): void;
    /**
     * Get map's current resolution
     * @return {Number} resolution
     * @private
     */
    _getResolution(zoom?: any): number;
    _getResolutions(): number[];
    /**
     * Converts the projected coordinate to a 2D point in the specific zoom
     * @param  {Coordinate} pCoord - projected Coordinate
     * @param  {Number} zoom   - point's zoom level
     * @return {Point} 2D point
     * @private
     */
    _prjToPoint(pCoord: Coordinate, zoom?: number, out?: Point): Point;
    _prjToPointAtRes(pCoord: Coordinate, res?: number, out?: Point): Point;
    /**
     * Converts the projected coordinate to a 2D point in the specific resolution
     * @param  {Coordinate} pCoord - projected Coordinate
     * @param  {Number} res   - point's resolution
     * @return {Point} 2D point
     * @private
     */
    _prjsToPointsAtRes(pCoords: Array<Coordinate>, res?: number, resultPoints?: Array<Point>): Array<Point>;
    /**
     * Converts the 2D point to projected coordinate
     * @param  {Point} point - 2D point
     * @param  {Number} zoom   - point's zoom level
     * @return {Coordinate} projected coordinate
     * @private
     */
    _pointToPrj(point: Point, zoom?: number, out?: Coordinate): Coordinate;
    _pointToPrjAtRes(point: Point, res?: number, out?: Coordinate): Coordinate;
    /**
     * Convert point at zoom to point at current zoom
     * @param  {Point} point point
     * @param  {Number} zoom point's zoom
     * @return {Point} point at current zoom
     * @private
     */
    _pointToPoint(point: any, zoom: any, out: any): any;
    _pointAtResToPoint(point: any, res: any, out?: any): any;
    /**
     * Convert point at current zoom to point at target res
     * @param  {Point} point point
     * @param  {Number} res target res
     * @return {Point} point at target res
     * @private
     */
    _pointToPointAtRes(point: any, res: any, out: any): any;
    /**
     * transform container point to geographical projected coordinate
     *
     * @param  {Point} containerPoint
     * @return {Coordinate}
     * @private
     */
    _containerPointToPrj(containerPoint: Point, out?: Coordinate): Coordinate;
    _callOnLoadHooks(): void;
    _fixPrjOnWorldWide(prjCoord: any): this;
    getFov(): number;
    setFov(fov: number): void;
    getBearing(): number;
    setBearing(bearing: number): void;
    setPitch(pitch: number): void;
    getPitch(): number;
    isTransforming(): boolean;
    getFrustumAltitude(): number;
    updateCenterAltitude(): number;
    getViewHistory(): any[];
    hasNextView(): boolean;
    zoomToNextView(): void;
    hasPreviousView(): boolean;
    zoomToPreviousView(): void;
    animateTo(view: MapViewType, options: object, step: Function): void;
    flyTo(view: MapViewType, options: object, step: Function): void;
    isAnimating(): boolean;
    isRotating(): boolean;
    isFullScreen(): boolean;
    requestFullScreen(dom: HTMLElement): boolean;
    cancelFullScreen(): void;
    panTo(coordinate: Coordinate, options?: any, step?: any): void;
    panBy(offset: Point, options?: any, step?: any): void;
    coordinateToPoint(coordinate: Coordinate, zoom?: number, out?: Point): Point;
    coordinateToPointAtRes(coordinate: Coordinate, res?: number, out?: Point): Point;
    pointToCoordinate(point: Point, zoom?: number, out?: Coordinate): Coordinate;
    pointAtResToCoordinate(point: Point, res?: number, out?: Coordinate): Coordinate;
    coordinateToViewPoint(coordinate: Coordinate, out?: Point, altitude?: number): Point;
    viewPointToCoordinate(viewPoint: Point, out?: Coordinate): Coordinate;
    coordinateToContainerPoint(coordinate: Coordinate, zoom?: number, out?: Point): Point;
    coordinateToContainerPointAtRes(coordinate: Coordinate, res?: number, out?: Point): Point;
    coordinatesToContainerPoints(coordinates: Coordinate[], zoom?: number): Point[];
    coordinatesToContainerPointsAtRes(coordinates: Coordinate[], resolution?: number): Point[];
    containerPointToCoordinate(containerPoint: Point, out?: Coordinate): Coordinate;
    containerToExtent(containerExtent: PointExtent): Extent;
    distanceToPixel(xDist: number, yDist: number, zoom?: number): Size;
    distanceToPoint(xDist: number, yDist: number, zoom?: number, paramCenter?: Coordinate): Point;
    distanceToPointAtRes(xDist: number, yDist: number, res?: number, paramCenter?: Coordinate, out?: Point): Point;
    altitudeToPoint(altitude: number, res?: number, originCenter?: Coordinate): number;
    pointAtResToAltitude(point: number, res?: number, originCenter?: Coordinate): number;
    pixelToDistance(width: number, height: number): number;
    pointToDistance(dx: number, dy: number, zoom?: number): number;
    pointAtResToDistance(dx: number, dy: number, res?: number, paramCenter?: Coordinate): number;
    locateByPoint(coordinate: Coordinate, px: number, py: number): Coordinate;
    _pointAtResToContainerPoint(point: Point, res: number, altitude?: number, out?: Point): Point;
    _containerPointToPoint(point: Point, zoom?: number, out?: Point): Point;
    _pointToContainerPoint(point: Point, zoom?: number, altitude?: number, out?: Point): Point;
    _get2DExtent(zoom?: number, out?: Extent): Extent;
    _get2DExtentAtRes(res?: number, out?: Extent): Extent;
    _pointsAtResToContainerPoints(cPoints: Point[], glRes: number, altitudes: number | number[], pts: Point[]): Point[];
    _prjToContainerPoint(pCoordinate: Coordinate, zoom?: number, out?: Point, altitude?: number): Point;
    _animateTo(view: MapViewType, options?: object, step?: Function): void;
    onZoomStart(nextZoom: number, origin: Point): void;
    onZooming(nextZoom: number, origin: Point, startScale?: number): void;
    onZoomEnd(nextZoom: number, origin: Point): void;
    _checkZoomOrigin(origin: Point): Point;
    _checkZoom(nextZoom: number): number;
    _ignoreEvent(domEvent: MouseEvent): boolean;
    _stopAnim(player: Player): void;
    _getActualEvent(e: MouseEvent): void;
    _isEventOutMap(e: MouseEvent): boolean;
    _panTo(prjCoord: Coordinate, options: object): void;
    _setBearing(bearing: number): void;
    _setPitch(pitch: number): void;
    _zoomAnimation(nextZoom: number, origin: Point, startScale?: number): void;
}
export default Map;
