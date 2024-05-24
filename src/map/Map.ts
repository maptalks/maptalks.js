import { INTERNAL_LAYER_PREFIX } from '../core/Constants';
import {
    now,
    extend,
    IS_NODE,
    isNil,
    isString,
    isFunction,
    sign,
    UID,
    b64toBlob,
    isNumber,
    isObject,
    isArrayHasData
} from '../core/util';
import Class from '../core/Class';
import Browser from '../core/Browser';
import Eventable from '../core/Eventable';
import Handlerable from '../handler/Handlerable';
import Point from '../geo/Point';
import Size from '../geo/Size';
import PointExtent from '../geo/PointExtent';
import Extent from '../geo/Extent';
import Coordinate from '../geo/Coordinate';
import Layer from '../layer/Layer';
import Renderable from '../renderer/Renderable';
import SpatialReference, { type SpatialReferenceType } from './spatial-reference/SpatialReference';
import { computeDomPosition, MOUSEMOVE_THROTTLE_TIME } from '../core/util/dom';
import EPSG9807, { type EPSG9807ProjectionType } from '../geo/projection/Projection.EPSG9807.js';
import { AnimationOptionsType, EasingType } from '../core/Animation';

const TEMP_COORD = new Coordinate(0, 0);
const TEMP_POINT = new Point(0, 0);
const REDRAW_OPTIONS_PROPERTIES = ['centerCross', 'fog', 'fogColor', 'debugSky'];
/**
 * @property {Object} options                                   - map's options, options must be updated by config method:<br> map.config('zoomAnimation', false);
 * @property {Boolean} [options.centerCross=false]              - Display a red cross in the center of map
 * @property {Boolean} [options.seamlessZoom=true]             - whether to use seamless zooming mode
 * @property {Boolean} [options.zoomInCenter=false]             - whether to fix in the center when zooming
 * @property {Number}  [options.zoomOrigin=null]                - zoom origin in container point, e.g. [400, 300]
 * @property {Boolean} [options.zoomAnimation=true]             - enable zooming animation
 * @property {Number}  [options.zoomAnimationDuration=330]      - zoom animation duration.
 * @property {Boolean} [options.panAnimation=true]              - continue to animate panning when draging or touching ended.
 * @property {Boolean} [options.panAnimationDuration=600]       - duration of pan animation.
 * @property {Boolean} [options.rotateAnimation=true]           - continue to animate rotating when draging or touching rotation ended.
 * @property {Boolean} [options.rotateAnimationDuration=800]    - duration of rotate animation.
 * @property {Boolean} [options.zoomable=true]                  - whether to enable map zooming.
 * @property {Boolean} [options.enableInfoWindow=true]          - whether to enable infowindow on this map.
 * @property {Boolean} [options.hitDetect=true]                 - whether to enable hit detecting of layers for cursor style on this map, disable it to improve performance.
 * @property {Boolean} [options.hitDetectLimit=5]               - the maximum number of layers to perform hit detect.
 * @property {Boolean} [options.fpsOnInteracting=25]            - fps when map is interacting, some slow layers will not be drawn on interacting when fps is low. Set to 0 to disable it.
 * @property {Boolean} [options.layerCanvasLimitOnInteracting=-1]    - limit of layer canvas to draw on map when interacting, set it to improve perf.
 * @property {Number}  [options.maxZoom=null]                   - the maximum zoom the map can be zooming to.
 * @property {Number}  [options.minZoom=null]                   - the minimum zoom the map can be zooming to.
 * @property {Extent}  [options.maxExtent=null]         - when maxExtent is set, map will be restricted to the give max extent and bouncing back when user trying to pan ouside the extent.
 * @property {Boolean} [options.fixCenterOnResize=true]        - whether to fix map center when map is resized
 *
 * @property {Number}  [options.maxPitch=80]                    - max pitch
 * @property {Number}  [options.maxVisualPitch=70]              - the max pitch to be visual
 *
 * @property {Extent}  [options.viewHistory=true]               -  whether to record view history
 * @property {Extent}  [options.viewHistoryCount=10]            -  the count of view history record.
 *
 * @property {Boolean} [options.draggable=true]                         - disable the map dragging if set to false.
 * @property {Boolean} [options.dragPan=true]                           - if true, map can be dragged to pan.
 * @property {Boolean} [options.dragRotate=true]                        - default true. If true, map can be dragged to rotate by right click or ctrl + left click.
 * @property {Boolean} [options.dragPitch=true]                         - default true. If true, map can be dragged to pitch by right click or ctrl + left click.
 * @property {Boolean} [options.dragRotatePitch=true]                   - if true, map is dragged to pitch and rotate at the same time.
 * @property {Number}  [options.switchDragButton=false]                 - switch to use left click (or touch on mobile) to rotate map and right click to move map.
 * @property {Boolean} [options.touchGesture=true]                      - whether to allow map to zoom/rotate/tilt by two finger touch gestures.
 * @property {Boolean} [options.touchZoom=true]                         - whether to allow map to zoom by touch pinch.
 * @property {Boolean} [options.touchRotate=true]                       - whether to allow map to rotate by touch pinch.
 * @property {Boolean} [options.touchPitch=true]                        - whether to allow map to pitch by touch pinch.
 * @property {Boolean} [options.touchZoomRotate=false]                  - if true, map is to zoom and rotate at the same time by touch pinch.
 * @property {Boolean} [options.doubleClickZoom=true]                    - whether to allow map to zoom by double click events.
 * @property {Boolean} [options.scrollWheelZoom=true]                   - whether to allow map to zoom by scroll wheel events.
 * @property {Boolean} [options.geometryEvents=true]                    - enable/disable firing geometry events
 * @property {Number}  [options.clickTimeThreshold=280]                 - time threshold between mousedown(touchstart) and mouseup(touchend) to determine if it's a click event
 *
 * @property {Boolean}        [options.control=true]                    - whether allow map to add controls.
 * @property {Boolean|Object} [options.attribution=true]                - whether to display the attribution control on the map. if true, attribution display maptalks info; if object, you can specify positon or your base content, and both;
 * @property {Boolean|Object} [options.zoomControl=false]               - display the zoom control on the map if set to true or a object as the control construct option.
 * @property {Boolean|Object} [options.scaleControl=false]              - display the scale control on the map if set to true or a object as the control construct option.
 * @property {Boolean|Object} [options.overviewControl=false]           - display the overview control on the map if set to true or a object as the control construct option.
 *
 * @property {Boolean}        [options.fog=true]                        - whether to draw fog in far distance.
 * @property {Number[]}       [options.fogColor=[233, 233, 233]]        - color of fog: [r, g, b]
 *
 * @property {String} [options.renderer=canvas]                 - renderer type. Don't change it if you are not sure about it. About renderer, see [TODO]{@link tutorial.renderer}.
 * @property {Number} [options.devicePixelRatio=null]           - device pixel ratio to override device's default one
 * @property {Number} [options.heightFactor=1]           - the factor for height/altitude calculation,This affects the height calculation of all layers(vectortilelayer/gllayer/threelayer/3dtilelayer)
 * @property {Boolean} [options.cameraInfiniteFar=false]           - Increase camera far plane to infinite. Enable this option may reduce map's performance.
 * @property {Boolean} [options.stopRenderOnOffscreen=true]           - whether to stop map rendering when container is offscreen
 * @property {Boolean} [options.originLatitudeForAltitude=40]         - default latitude for map.altitudeToPoint method
 * @property {Number} [options.mousemoveThrottleTime=48]         - mousemove event interval time(ms)
 * @property {Number} [options.maxFPS=0]         - 0 means no frame is locked, otherwise the frame is locked
 * @memberOf Map
 * @instance
 */
const options: MapOptionsType = {
    'maxVisualPitch': 70,
    'maxPitch': 80,
    'centerCross': false,

    'zoomInCenter': false,
    'zoomOrigin': null,
    'zoomAnimation': (function () {
        return !IS_NODE;
    })(),
    'zoomAnimationDuration': 330,

    'panAnimation': (function () {
        return !IS_NODE;
    })(),

    //default pan animation duration
    'panAnimationDuration': 600,

    'rotateAnimation': (function () {
        return !IS_NODE;
    })(),

    'zoomable': true,
    'enableInfoWindow': true,

    'hitDetect': (function () {
        return !Browser.mobile;
    })(),

    'hitDetectLimit': 5,

    'fpsOnInteracting': 25,

    'layerCanvasLimitOnInteracting': -1,

    'maxZoom': null,
    'minZoom': null,
    'maxExtent': null,
    'fixCenterOnResize': true,

    'checkSize': true,
    'checkSizeInterval': 1000,

    'renderer': 'canvas',

    'cascadePitches': [10, 60],
    'renderable': true,

    'clickTimeThreshold': 280,

    'stopRenderOnOffscreen': true,
    'preventWheelScroll': true,
    'preventTouch': true,
    //for plugin layer,such as threelayer
    'supportPluginEvent': true,

    'switchDragButton': false,
    'mousemoveThrottleTime': MOUSEMOVE_THROTTLE_TIME,
    'maxFPS': 0,
    'debug': false
};

/**
 * The central class of the library, to create a map on a container.
 *
 * @category map
 *
 * @mixes Eventable
 * @mixes Handlerable
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
export class Map extends Handlerable(Eventable(Renderable(Class))) {
    VERSION: string;
    private _loaded: boolean;
    private _panels: Record<string, PanelDom>;
    private _baseLayer: Layer;
    private _layers: Array<Layer>;
    private _zoomLevel: number;
    private _center: Coordinate;
    private _centerZ: number;
    private _mapViewPoint: Point;
    isMap: boolean;
    private _containerDOM: HTMLDivElement | HTMLCanvasElement;
    private _spatialReference: SpatialReference;
    private _originLng: number;
    private _altitudeOriginDirty: boolean;
    private _glScale: number;
    private _cursor: string;
    private _prjCenter: Coordinate;
    private centerAltitude: number;
    width: number;
    height: number;
    private _prjMaxExtent: PointExtent;
    private _glRes: number;
    private _zooming: boolean;
    private _layerCache: { [key: string]: Layer };
    private _mapViewCoord: Coordinate;
    private _eventSilence: boolean;
    private _moving: boolean;
    private _originCenter: Coordinate;
    private _suppressRecenter: boolean;
    private _dragRotating: boolean;
    CanvasClass: any;
    private _priorityCursor: string;
    private _initTime: number;
    private _renderer: any;
    private _containerDomContentRect: DOMRect;
    private _mapRes: number;
    private _onLoadHooks: Array<(...args) => void>;
    private cameraCenterDistance: number;
    options: MapOptionsType;
    static VERSION: string;
    JSON_VERSION: '1.0';


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
    constructor(container: MapContainerType,
        options: MapCreateOptionsType) {
        if (!options) {
            throw new Error('Invalid options when creating map.');
        }
        if (!options['center']) {
            throw new Error('Invalid center when creating map.');
        }
        // prepare options
        const opts = extend({} as any, options) as MapOptionsType;
        const zoom = opts['zoom'];
        delete opts['zoom'];
        const center = new Coordinate(opts['center']);
        delete opts['center'];

        const baseLayer = opts['baseLayer'];
        delete opts['baseLayer'];
        const layers = opts['layers'];
        delete opts['layers'];
        super(opts);

        /**
         * @property {String}  - Version of library
         * @constant
         * @static
         */
        this.VERSION = Map.VERSION;

        Object.defineProperty(this, 'id', {
            value: UID(),
            writable: false
        });

        this._loaded = false;
        this._initContainer(container);

        this._panels = {};

        //Layers
        this._baseLayer = null;
        this._layers = [];

        this._zoomLevel = zoom;
        this._center = center;
        this._centerZ = center.z;

        this.setSpatialReference(opts['spatialReference'] || opts['view']);


        this._mapViewPoint = new Point(0, 0);

        this._initRenderer();
        this._updateMapSize(this._getContainerDomSize());

        if (baseLayer) {
            this.setBaseLayer(baseLayer);
        }
        if (layers) {
            this.addLayer(layers);
        }

        this.setMaxExtent(opts['maxExtent']);

        this._Load();
        this.proxyOptions();
        this.isMap = true;
    }

    /**
     * Add hooks for additional codes when map's loading complete, useful for plugin developping.
     * Note that it can only be called before the map is created.
     * @param {Function | any} fn
     * @returns {Map}
     */
    static addOnLoadHook(fn: string | ((...args) => void), ...args) { // (Function) || (String, args...)
        // const args = Array.prototype.slice.call(arguments, 1);
        const onload = typeof fn === 'function' ? fn : function () {
            this[fn].call(this, ...args);
        };
        this.prototype._onLoadHooks = this.prototype._onLoadHooks || [];
        this.prototype._onLoadHooks.push(onload);
        return this;
    }

    /**
     * Whether the map is loaded or not.
     * @return {Boolean}
     */
    isLoaded() {
        return !!this._loaded;
    }

    /**
     * Get map's container
     * @returns {HTMLElement}
     */
    getContainer() {
        return this._containerDOM;
    }

    /**
     * Get the spatial reference of the Map.
     * @return {SpatialReference} map's spatial reference
     */
    getSpatialReference() {
        return this._spatialReference;
    }

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
    setSpatialReference(ref: SpatialReferenceType) {
        const oldRef = this.options['spatialReference'];
        if (this._loaded && SpatialReference.equals(oldRef, ref)) {
            return this;
        }
        this._updateSpatialReference(ref, oldRef);
        return this;
    }

    _updateSpatialReference(ref: SpatialReferenceType, oldRef) {
        if (isString(ref)) {
            ref = SpatialReference.getPreset(ref);
        }
        ref = extend({}, ref);
        this._center = this.getCenter();
        this.options['spatialReference'] = ref;
        this._spatialReference = new SpatialReference(ref);
        const projection = this._spatialReference.getProjection();
        if (this.options['spatialReference'] && isFunction(this.options['spatialReference']['projection'])) {
            //save projection code for map profiling (toJSON/fromJSON)
            this.options['spatialReference']['projection'] = projection['code'];
        }
        this._resetMapStatus();
        if (EPSG9807.is(projection.code)) {
            this._originLng = (projection as EPSG9807ProjectionType).centralMeridian;
            this._altitudeOriginDirty = true;
        }
        /**
         * spatialreferencechange event, fired when map's spatial reference is updated.
         *
         * @event Map#spatialreferencechange
         * @type {Object}
         * @property {String} type - spatialreferencechange
         * @property {Map} target - map
         * @property {Map} old - the old spatial reference
         * @property {Map} new - the new spatial reference changed to
         */
        this._fireEvent('spatialreferencechange', {
            'old': oldRef,
            'new': extend({} as any, this.options['spatialReference'])
        });
        return this;
    }

    // _syncWorld() {
    //     const projection = this.getProjection();
    //     if (!projection) {
    //         return false;
    //     }
    //     const pcenter = this._getPrjCenter();
    //     if (projection.isOutSphere(pcenter)) {
    //         const wrapped = projection.wrapCoord(pcenter);
    //         this._setPrjCenter(wrapped);
    //         this._fireEvent('syncworld', { 'old' : pcenter.toArray(), 'new' : wrapped.toArray() });
    //         return true;
    //     }
    //     return false;
    // }

    /**
     * Callback when any option is updated
     * @param  {Object} conf - options to update
     * @return {Map}   this
     */
    onConfig(conf: { [key: string]: any }) {
        const ref = conf['spatialReference'] || conf['view'];
        if (!isNil(ref)) {
            this._updateSpatialReference(ref, null);
        }
        let needUpdate = false;
        for (let i = 0, len = REDRAW_OPTIONS_PROPERTIES.length; i < len; i++) {
            const key = REDRAW_OPTIONS_PROPERTIES[i];
            if (!isNil(conf[key])) {
                needUpdate = true;
                break;
            }
        }
        if (!needUpdate) {
            return this;
        }
        const renderer = this.getRenderer();
        if (renderer) {
            renderer.setToRedraw();
        }
        return this;
    }

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
    getProjection() {
        if (!this._spatialReference) {
            return null;
        }
        return this._spatialReference.getProjection();
    }

    /**
     * Get map's full extent, which is defined in map's spatial reference. <br>
     * eg: {'left': -180, 'right' : 180, 'top' : 90, 'bottom' : -90}
     * @return {Extent}
     */
    getFullExtent() {
        if (!this._spatialReference) {
            return null;
        }
        return this._spatialReference.getFullExtent();
    }

    /**
     * Set map's cursor style, cursor style is same with CSS.
     * @param {String} cursor - cursor style
     * @returns {Map} this
     * @example
     * map.setCursor('url(cursor.png) 4 12, auto');
     */
    setCursor(cursor: string) {
        delete this._cursor;
        this._trySetCursor(cursor);
        this._cursor = cursor;
        return this;
    }

    /**
     * Reset map's cursor style.
     * @return {Map} this
     * @example
     * map.resetCursor();
     */
    resetCursor() {
        return this.setCursor(null);
    }

    /**
     * Get center of the map.
     * @return {Coordinate}
     */
    getCenter(): Coordinate {
        if (!this._loaded || !this._prjCenter) {
            return this._center;
        }
        const projection = this.getProjection();
        const center = projection.unproject(this._prjCenter);
        center.x = Math.round(center.x * 1E8) / 1E8;
        center.y = Math.round(center.y * 1E8) / 1E8;
        center.z = this._centerZ;
        if (this.centerAltitude) {
            center.z = this.centerAltitude;
        }
        return center;
    }

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
    setCenter(center: Coordinate, padding?: MapPaddingType) {
        if (!center) {
            return this;
        }
        center = new Coordinate(center);
        if (padding) {
            center = this._getCenterByPadding(center, this.getZoom(), padding);
        }
        const projection = this.getProjection();
        const pcenter = projection.project(center);
        if (!this._verifyExtent(pcenter)) {
            return this;
        }
        if (!this._loaded) {
            this._center = center;
            return this;
        }
        this._centerZ = center.z;
        this.onMoveStart();
        this._setPrjCenter(pcenter);
        this.onMoveEnd(this._parseEventFromCoord(this.getCenter()));
        return this;
    }

    /**
     * Get map's size (width and height) in pixel.
     * @return {Size}
     */
    getSize(): Size {
        if (isNil(this.width) || isNil(this.height)) {
            return this._getContainerDomSize();
        }
        return new Size(this.width, this.height);
    }

    /**
     * Get container extent of the map
     * @return {PointExtent}
     */
    getContainerExtent() {
        let visualHeight = this.height;
        const pitch = this.getPitch(),
            maxVisualPitch = this.options['maxVisualPitch'];
        if (maxVisualPitch && pitch > maxVisualPitch) {
            visualHeight = this._getVisualHeight(maxVisualPitch);
        }
        return new PointExtent(0, this.height - visualHeight, this.width, this.height);
    }

    _getVisualHeight(visualPitch) {
        // const pitch = this.getPitch();
        // const visualDistance = this.height / 2 * Math.tan(visualPitch * Math.PI / 180);
        // return this.height / 2 + visualDistance *  Math.tan((90 - pitch) * Math.PI / 180);
        visualPitch = visualPitch || 1E-2;

        const pitch = (90 - this.getPitch()) * Math.PI / 180;
        const fov = this.getFov() * Math.PI / 180;
        visualPitch *= Math.PI / 180;

        const cameraToCenter = this.cameraCenterDistance / this.getGLScale();
        const tanB = Math.tan(fov / 2);
        const tanP = Math.tan(visualPitch);

        const visualDistance = (cameraToCenter * tanB) / (1 / tanP - tanB) / Math.sin(visualPitch);
        const x = cameraToCenter * (Math.sin(pitch) * visualDistance / (cameraToCenter + Math.cos(pitch) * visualDistance));

        return this.height / 2 + x;
    }

    /**
     * Get the geographical extent of map's current view extent.
     *
     * @return {Extent}
     */
    getExtent() {
        return this.pointToExtent(this.get2DExtent());
    }

    /**
     * Get the projected geographical extent of map's current view extent.
     *
     * @return {Extent}
     */
    getProjExtent() {
        const extent2D = this.get2DExtent();
        return new Extent(
            this._pointToPrj(extent2D.getMin()),
            this._pointToPrj(extent2D.getMax())
        );
    }

    /**
     * Alias for getProjExtent
     *
     * @return {Extent}
     */
    getPrjExtent() {
        return this.getProjExtent();
    }

    /**
     * Get the max extent that the map is restricted to.
     * @return {Extent}
     */
    getMaxExtent() {
        if (!this.options['maxExtent']) {
            return null;
        }
        return new Extent(this.options['maxExtent'], this.getProjection());
    }

    /**
     * Sets the max extent that the map is restricted to.
     * @param {Extent}
     * @return {Map} this
     * @example
     * map.setMaxExtent(map.getExtent());
     */
    setMaxExtent(extent: Extent) {
        if (extent) {
            const maxExt = new Extent(extent, this.getProjection());
            this.options['maxExtent'] = maxExt;
            const projection = this.getProjection();
            this._prjMaxExtent = maxExt.convertTo(c => projection.project(c));
            if (!this._verifyExtent(this._getPrjCenter())) {
                if (this._loaded) {
                    this._panTo(this._prjMaxExtent.getCenter());
                } else {
                    this._center = projection.unproject(this._prjMaxExtent.getCenter());
                }

            }
        } else {
            delete this.options['maxExtent'];
            delete this._prjMaxExtent;
        }
        return this;
    }

    /**
     * Get map's current zoom.
     * @return {Number}
     */
    getZoom() {
        return this._zoomLevel;
    }

    /**
     * Caculate the target zoom if scaling from "fromZoom" by "scale"
     * @param  {Number} scale
     * @param  {Number} fromZoom
     * @param  {Boolean} isFraction - can return fractional zoom
     * @return {Number} zoom fit for scale starting from fromZoom
     */
    getZoomForScale(scale: number, fromZoom?: number, isFraction?: boolean) {
        const zoom = this.getZoom();
        if (isNil(fromZoom)) {
            fromZoom = zoom;
        }
        if (scale === 1 && fromZoom === zoom) {
            return zoom;
        }
        const res = this._getResolution(fromZoom),
            targetRes = res / scale;
        const scaleZoom = this.getZoomFromRes(targetRes);
        if (isFraction) {
            return scaleZoom;
        } else {
            const delta = 1E-6; //avoid precision
            return this.getSpatialReference().getZoomDirection() < 0 ?
                Math.ceil(scaleZoom - delta) : Math.floor(scaleZoom + delta);
        }
    }

    getZoomFromRes(res: number): number {
        const resolutions = this._getResolutions(),
            minRes = this._getResolution(this.getMinZoom()),
            maxRes = this._getResolution(this.getMaxZoom());
        if (minRes <= maxRes) {
            if (res <= minRes) {
                return this.getMinZoom();
            } else if (res >= maxRes) {
                return this.getMaxZoom();
            }
        } else if (res >= minRes) {
            return this.getMinZoom();
        } else if (res <= maxRes) {
            return this.getMaxZoom();
        }

        const l = resolutions.length;
        for (let i = 0; i < l - 1; i++) {
            if (!resolutions[i]) {
                continue;
            }
            const gap = resolutions[i + 1] - resolutions[i];
            const test = res - resolutions[i];
            if (sign(gap) === sign(test) && Math.abs(gap) >= Math.abs(test)) {
                return i + test / gap;
            }
        }
        return l - 1;
    }

    /**
     * Sets zoom of the map
     * @param {Number} zoom
     * @param {Object} [options=null] options
     * @param {Boolean} [options.animation=true] whether zoom is animation, true by default
     * @returns {Map} this
     */
    setZoom(zoom: number, options = { 'animation': true }) {
        if (isNaN(zoom) || isNil(zoom)) {
            return this;
        }
        zoom = +zoom;
        if (this._loaded && this.options['zoomAnimation'] && options['animation']) {
            this._zoomAnimation(zoom);
        } else {
            this._zoom(zoom);
        }
        return this;
    }

    /**
     * Get the max zoom that the map can be zoom to.
     * @return {Number}
     */
    getMaxZoom(): number {
        if (!isNil(this.options['maxZoom'])) {
            return this.options['maxZoom'];
        }
        return this.getMaxNativeZoom();
    }

    /**
     * Sets the max zoom that the map can be zoom to.
     * @param {Number} maxZoom
     * @returns {Map} this
     */
    setMaxZoom(maxZoom: number) {
        const viewMaxZoom = this.getMaxNativeZoom();
        if (maxZoom > viewMaxZoom) {
            maxZoom = viewMaxZoom;
        }
        if (maxZoom !== null && maxZoom < this._zoomLevel) {
            this.setZoom(maxZoom);
            maxZoom = +maxZoom;
        }
        this.options['maxZoom'] = maxZoom;
        return this;
    }

    /**
     * Get the min zoom that the map can be zoom to.
     * @return {Number}
     */
    getMinZoom(): number {
        if (!isNil(this.options['minZoom'])) {
            return this.options['minZoom'];
        }
        return this._spatialReference.getMinZoom();
    }

    /**
     * Sets the min zoom that the map can be zoom to.
     * @param {Number} minZoom
     * @return {Map} this
     */
    setMinZoom(minZoom: number) {
        if (minZoom !== null) {
            minZoom = +minZoom;
            const viewMinZoom = this._spatialReference.getMinZoom();
            if (minZoom < viewMinZoom) {
                minZoom = viewMinZoom;
            }
            if (minZoom > this._zoomLevel) {
                this.setZoom(minZoom);
            }
        }
        this.options['minZoom'] = minZoom;
        return this;
    }

    /**
     * Maximum zoom the map has
     * @return {Number}
     */
    getMaxNativeZoom(): number {
        const ref = this.getSpatialReference();
        if (!ref) {
            return null;
        }
        return ref.getMaxZoom();
    }

    /**
     * Resolution for world point in WebGL context
     * @returns {Number}
     */
    getGLRes(): number {
        if (this._glRes) {
            return this._glRes;
        }
        const fullExtent = this.getSpatialReference().getFullExtent();
        this._glRes = (fullExtent.right - fullExtent.left) / Math.pow(2, 19);
        return this._glRes;
        // return this._getResolution(14);
        // return this._getResolution(this.getMaxNativeZoom() / 2);
    }

    /**
     * Caculate scale from gl zoom to given zoom (default by current zoom)
     * @param {Number} [zoom=undefined] target zoom, current zoom by default
     * @returns {Number}
     * @examples
     * const point = map.coordToPoint(map.getCenter());
     * // convert to point in gl zoom
     * const glPoint = point.multi(this.getGLScale());
     */
    getGLScale(zoom?: number): number {
        if (isNil(zoom)) {
            zoom = this.getZoom();
        }
        return this._getResolution(zoom) / this.getGLRes();
    }

    /**
     * zoom in
     * @return {Map} this
     */
    zoomIn() {
        return this.setZoom(this.getZoom() + 1);
    }

    /**
     * zoom out
     * @return {Map} this
     */
    zoomOut() {
        return this.setZoom(this.getZoom() - 1);
    }

    /**
     * Whether the map is zooming
     * @return {Boolean}
     */
    isZooming() {
        return !!this._zooming;
    }

    /**
     * Whether the map is being interacted
     * @return {Boolean}
     */
    isInteracting() {
        return this.isZooming() || this.isMoving() || this.isRotating();
    }

    /**
     * Sets the center and zoom at the same time.
     * @param {Coordinate} center
     * @param {Number} zoom
     * @return {Map} this
     */
    setCenterAndZoom(center: Coordinate, zoom?: number) {
        if (!isNil(zoom) && this._zoomLevel !== zoom) {
            this.setCenter(center);
            this.setZoom(zoom, { animation: false });
        } else {
            this.setCenter(center);
        }
        return this;
    }

    /**
     * Get the padding Size
     * @param  {Object} options
     * @param  {Number} [options.paddingLeft] - Sets the amount of padding in the left of a map container
     * @param  {Number} [options.paddingTop] - Sets the amount of padding in the top of a map container
     * @param  {Number} [options.paddingRight] - Sets the amount of padding in the right of a map container
     * @param  {Number} [options.paddingBottom] - Sets the amount of padding in the bottom of a map container
     * @returns {Object|null}
     */
    _getPaddingSize(options = {}) {
        if (options['paddingLeft'] || options['paddingTop'] || options['paddingRight'] || options['paddingBottom']) {
            return {
                width: (options['paddingLeft'] || 0) + (options['paddingRight'] || 0),
                height: (options['paddingTop'] || 0) + (options['paddingBottom'] || 0)
            };
        }
        return null;
    }
    /**
     * Caculate the zoom level that contains the given extent with the maximum zoom level possible.
     * @param {Extent} extent
     * @param  {Boolean} [isFraction] - can return fractional zoom
     * @param  {Object} [padding] [padding] - padding
     * @param  {Object} [padding.paddingLeft] - Sets the amount of padding in the left of a map container
     * @param  {Object} [padding.paddingTop] - Sets the amount of padding in the top of a map container
     * @param  {Object} [padding.paddingRight] - Sets the amount of padding in the right of a map container
     * @param  {Object} [padding.paddingBottom] - Sets the amount of padding in the bottom of a map container
     * @return {Number} zoom fit for scale starting from fromZoom
     */
    getFitZoom(extent: Extent, isFraction?: boolean, padding?: MapPaddingType) {
        if (!extent || !(extent instanceof Extent)) {
            return this._zoomLevel;
        }
        //It's a point
        if (extent['xmin'] === extent['xmax'] && extent['ymin'] === extent['ymax']) {
            return this.getMaxZoom();
        }
        let size = this.getSize();
        const paddingSize = this._getPaddingSize(padding);
        if (paddingSize) {
            const rect = {
                width: size.width - (paddingSize.width || 0),
                height: size.height - (paddingSize.height || 0)
            };
            size = new Size(rect.width, rect.height);
        }
        const containerExtent = extent.convertTo(p => this.coordToPoint(p));
        const w = containerExtent.getWidth(),
            h = containerExtent.getHeight();
        const scaleX = size['width'] / w,
            scaleY = size['height'] / h;
        const scale = this.getSpatialReference().getZoomDirection() < 0 ?
            Math.max(scaleX, scaleY) : Math.min(scaleX, scaleY);
        const zoom = this.getZoomForScale(scale, null, isFraction);
        return zoom;
    }

    /**
     * Get map's current view (center/zoom/pitch/bearing)
     * @return {Object} { center : *, zoom : *, pitch : *, bearing : * }
     */
    getView(): MapViewType {
        return {
            'center': this.getCenter().toArray() as any,
            'zoom': this.getZoom(),
            'pitch': this.getPitch(),
            'bearing': this.getBearing()
        };
    }

    /**
     * Set map's center/zoom/pitch/bearing at one time
     * @param {Object} view - a object containing center/zoom/pitch/bearing
     * return {Map} this
     */
    setView(view: MapViewType) {
        if (!view) {
            return this;
        }
        if (view['center']) {
            this.setCenter(view['center'] as Coordinate);
        }
        if (view['zoom'] !== null && !isNaN(+view['zoom'])) {
            this.setZoom(+view['zoom'], { 'animation': false });
        }
        if (view['pitch'] !== null && !isNaN(+view['pitch'])) {
            this.setPitch(+view['pitch']);
        }
        if (view['pitch'] !== null && !isNaN(+view['bearing'])) {
            this.setBearing(+view['bearing']);
        }
        return this;
    }

    /**
     * Get map's resolution
     * @param {Number} zoom - zoom or current zoom if not given
     * @return {Number} resolution
     */
    getResolution(zoom?: number) {
        return this._getResolution(zoom);
    }

    /**
     * Get scale of resolutions from zoom to max zoom
     * @param {Number} zoom - zoom or current zoom if not given
     * @return {Number} scale
     */
    getScale(zoom?: number) {
        const z = (isNil(zoom) ? this.getZoom() : zoom);
        const max = this._getResolution(this.getMaxNativeZoom()),
            res = this._getResolution(z);
        return res / max;
    }

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
    _getCenterByPadding(center: Coordinate, zoom?: number, padding?: MapPaddingType) {
        const point = this.coordinateToPoint(center, zoom);
        const { paddingLeft = 0, paddingRight = 0, paddingTop = 0, paddingBottom = 0 } = padding || {};
        let pX = 0;
        let pY = 0;
        if (paddingLeft || paddingRight) {
            pX = (paddingRight - paddingLeft) / 2;
        }
        if (paddingTop || paddingBottom) {
            pY = (paddingTop - paddingBottom) / 2;
        }
        const newPoint = new Point({
            x: point.x + pX,
            y: point.y + pY
        });
        return this.pointToCoordinate(newPoint, zoom);
    }

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
     * @param  {Boolean} [options.isFraction=false] - can locate to fractional zoom
     * @param  {Function} step - step function for animation
     * @return {Map | player} - this
     */
    fitExtent(extent: Extent, zoomOffset?: number, options?: MapFitType, step?: (frame) => void) {
        options = (options || {} as any);
        if (!extent) {
            return this;
        }
        extent = new Extent(extent, this.getProjection());
        const zoom = this.getFitZoom(extent, options.isFraction || false, options) + (zoomOffset || 0);
        let center = extent.getCenter();
        if (this._getPaddingSize(options)) {
            center = this._getCenterByPadding(center, zoom, options);
        }
        if (typeof (options['animation']) === 'undefined' || options['animation'])
            return this._animateTo({
                center,
                zoom
            }, {
                'duration': options['duration'] || this.options['zoomAnimationDuration'],
                'easing': options['easing'] || 'out',
            }, step);
        else
            return this.setCenterAndZoom(center, zoom);
    }

    /**
     * Get the base layer of the map.
     * @return {Layer}
     */
    getBaseLayer() {
        return this._baseLayer;
    }

    /**
     * Sets a new base layer to the map.<br>
     * Some events will be thrown such as baselayerchangestart, baselayerload, baselayerchangeend.
     * @param  {Layer} baseLayer - new base layer
     * @return {Map} this
     * @fires Map#setbaselayer
     * @fires Map#baselayerchangestart
     * @fires Map#baselayerchangeend
     */
    setBaseLayer(baseLayer: Layer) {
        let isChange = false;
        if (this._baseLayer) {
            isChange = true;
            /**
             * baselayerchangestart event, fired when base layer is changed.
             *
             * @event Map#baselayerchangestart
             * @type {Object}
             * @property {String} type - baselayerchangestart
             * @property {Map} target - map
             */
            this._fireEvent('baselayerchangestart');
            this._baseLayer.remove();
        }
        if (!baseLayer) {
            delete this._baseLayer;
            /**
             * baselayerchangeend event, fired when base layer is changed.
             *
             * @event Map#baselayerchangeend
             * @type {Object}
             * @property {String} type - baselayerchangeend
             * @property {Map} target - map
             */
            this._fireEvent('baselayerchangeend');
            /**
             * setbaselayer event, fired when base layer is set.
             *
             * @event Map#setbaselayer
             * @type {Object}
             * @property {String} type - setbaselayer
             * @property {Map} target - map
             */
            this._fireEvent('setbaselayer');
            return this;
        }

        this._baseLayer = baseLayer;
        baseLayer._bindMap(this, -1);

        function onbaseLayerload() {
            /**
             * baselayerload event, fired when base layer is loaded.
             *
             * @event Map#baselayerload
             * @type {Object}
             * @property {String} type - baselayerload
             * @property {Map} target - map
             */
            this._fireEvent('baselayerload');
            if (isChange) {
                isChange = false;
                this._fireEvent('baselayerchangeend');
            }
        }

        this._baseLayer.on('layerload', onbaseLayerload, this);
        if (this._loaded) {
            this._baseLayer.load();
        }
        this._fireEvent('setbaselayer');
        return this;
    }

    /**
     * Remove the base layer from the map
     * @return {Map} this
     * @fires Map#baselayerremove
     */
    removeBaseLayer() {
        if (this._baseLayer) {
            this._baseLayer.remove();
            delete this._baseLayer;
            /**
             * baselayerremove event, fired when base layer is removed.
             *
             * @event Map#baselayerremove
             * @type {Object}
             * @property {String} type - baselayerremove
             * @property {Map} target - map
             */
            this._fireEvent('baselayerremove');
        }
        return this;
    }

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
    getLayers(filter?: (layer: Layer) => boolean): Array<Layer> {
        return this._getLayers(function (layer) {
            if (layer === this._baseLayer || layer.getId().indexOf(INTERNAL_LAYER_PREFIX) >= 0) {
                return false;
            }
            if (filter) {
                return filter(layer);
            }
            return true;
        });
    }

    /**
     * Get the layer with the given id.
     * @param  {String} id - layer id
     * @return {Layer}
     */
    getLayer(id: string): Layer | null {
        if (!id) {
            return null;
        }
        const layer = this._layerCache ? this._layerCache[id] : null;
        if (layer) {
            return layer;
        }
        const baseLayer = this.getBaseLayer();
        if (baseLayer && baseLayer.getId() === id) {
            return baseLayer;
        }
        return null;
    }

    /**
     * Add a new layer on the top of the map.
     * @param  {Layer|Layer[]} layer - one or more layers to add
     * @return {Map} this
     * @fires Map#addlayer
     */
    addLayer(layers: Layer | Array<Layer>, ...otherLayers: Array<Layer>): this {
        if (!layers) {
            return this;
        }

        if (!Array.isArray(layers)) {
            layers = [layers];
            // layers = Array.prototype.slice.call(arguments, 0);
            // return this.addLayer(layers);
        }
        if (otherLayers && otherLayers.length) {
            layers = layers.concat(otherLayers);
        }
        if (!this._layerCache) {
            this._layerCache = {};
        }
        const mapLayers = this._layers;
        for (let i = 0, len = layers.length; i < len; i++) {
            const layer = layers[i];
            const id = layer.getId();
            if (isNil(id)) {
                throw new Error('Invalid id for the layer: ' + id);
            }

            if (layer.getMap() === this) {
                continue;
            }
            if (this._layerCache[id]) {
                throw new Error('Duplicate layer id in the map: ' + id);
            }
            this._layerCache[id] = layer;
            layer._bindMap(this);
            mapLayers.push(layer);
            if (this._loaded) {
                layer.load();
            }
        }

        this._sortLayersByZIndex();

        /**
         * addlayer event, fired when adding layers.
         *
         * @event Map#addlayer
         * @type {Object}
         * @property {String} type - addlayer
         * @property {Map} target - map
         * @property {Layer[]} layers - layers to add
         */
        this._fireEvent('addlayer', {
            'layers': layers
        });
        return this;
    }

    /**
     * Remove a layer from the map
     * @param  {String|String[]|Layer|Layer[]} layer - one or more layers or layer ids
     * @return {Map} this
     * @fires Map#removelayer
     */
    removeLayer(layers: Layer | Array<Layer>): this {
        if (!layers) {
            return this;
        }
        if (!Array.isArray(layers)) {
            return this.removeLayer([layers]);
        }
        const removed = [];
        for (let i = 0, len = layers.length; i < len; i++) {
            let layer = layers[i];
            if (!(layer instanceof Layer)) {
                layer = this.getLayer(layer);
            }
            if (!layer) {
                continue;
            }
            const map = layer.getMap();
            if (!map || (map as any) !== this) {
                continue;
            }
            removed.push(layer);
            this._removeLayer(layer, this._layers);
            if (this._loaded) {
                layer._doRemove();
            }
            const id = layer.getId();
            if (this._layerCache) {
                delete this._layerCache[id];
            }
        }
        if (removed.length > 0) {
            const renderer = this.getRenderer();
            if (renderer) {
                renderer.setLayerCanvasUpdated();
            }
            this.once('frameend', () => {
                removed.forEach(layer => {
                    layer.fire('remove');
                });
            });
        }
        /**
         * removelayer event, fired when removing layers.
         *
         * @event Map#removelayer
         * @type {Object}
         * @property {String} type - removelayer
         * @property {Map} target - map
         * @property {Layer[]} layers - layers to remove
         */
        this._fireEvent('removelayer', {
            'layers': layers
        });
        return this;
    }

    /**
     * Sort layers according to the order provided, the last will be on the top.
     * @param  {string[]|Layer[]} layers - layers or layer ids to sort
     * @return {Map} this
     * @example
     * map.addLayer([layer1, layer2, layer3]);
     * map.sortLayers([layer2, layer3, layer1]);
     * map.sortLayers(['3', '2', '1']); // sort by layer ids.
     */
    sortLayers(layers: Array<Layer>) {
        if (!layers || !Array.isArray(layers)) {
            return this;
        }
        const layersToOrder = [];
        let minZ = Number.MAX_VALUE;
        for (let i = 0, l = layers.length; i < l; i++) {
            let layer = layers[i];
            if (isString(layers[i])) {
                layer = this.getLayer(layer as any);
            }
            if (!(layer instanceof Layer) || !layer.getMap() || layer.getMap() as any !== this) {
                throw new Error('It must be a layer added to this map to order.');
            }
            if (layer.getZIndex() < minZ) {
                minZ = layer.getZIndex();
            }
            layersToOrder.push(layer);
        }
        for (let i = 0, l = layersToOrder.length; i < l; i++) {
            layersToOrder[i].setZIndex(minZ + i);
        }

        return this;
    }

    /**
     * Exports image from the map's canvas.
     * @param {Object} [options=undefined] - options
     * @param {String} [options.mimeType=image/png] - mime type of the image: image/png, image/jpeg, image/webp
     * @param {String} [options.quality=0.92] - A Number between 0 and 1 indicating the image quality to use for image formats that use lossy compression such as image/jpeg and image/webp.
     * @param {Boolean} [options.save=false] - whether pop a file save dialog to save the export image.
     * @param {String} [options.fileName=export] - specify the file name, if options.save is true.
     * @return {String} image of base64 format.
     */
    toDataURL(options?: MapDataURLType): string | null {
        if (!options) {
            options = {};
        }
        let mimeType = options['mimeType'];
        if (!mimeType) {
            mimeType = 'image/png';
        }
        const save = options['save'];
        const renderer = this._getRenderer();
        if (renderer && renderer.toDataURL) {
            let file = options['fileName'];
            if (!file) {
                file = 'export';
            }
            const dataURL = renderer.toDataURL(mimeType, options.quality || 0.92);
            if (save && dataURL) {
                let imgURL;
                if (typeof Blob !== 'undefined' && typeof atob !== 'undefined') {
                    const blob = b64toBlob(dataURL.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, ''), mimeType);
                    imgURL = URL.createObjectURL(blob);
                } else {
                    imgURL = dataURL;
                }
                const dlLink = document.createElement('a');
                dlLink.download = file;
                dlLink.href = imgURL;

                document.body.appendChild(dlLink);
                dlLink.click();
                document.body.removeChild(dlLink);
            }
            return dataURL;
        }
        return null;
    }

    /**
     * shorter alias for coordinateToPoint
     */
    coordToPoint(coordinate: Coordinate, zoom?: number, out?: Point) {
        return this.coordinateToPoint(coordinate, zoom, out);
    }

    /**
     * shorter alias for coordinateToPointAtRes
     */
    coordToPointAtRes(coordinate: Coordinate, res?: number, out?: Point) {
        return this.coordinateToPointAtRes(coordinate, res, out);
    }

    /**
     * shorter alias for pointToCoordinate
     */
    pointToCoord(point: Point, zoom?: number, out?: Coordinate) {
        return this.pointToCoordinate(point, zoom, out);
    }

    /**
     * shorter alias for pointAtResToCoordinate
     */
    pointAtResToCoord(point: Point, res?: number, out?: Coordinate) {
        return this.pointAtResToCoordinate(point, res, out);
    }


    /**
     * shorter alias for coordinateToViewPoint
     */
    coordToViewPoint(coordinate: Coordinate, out?: Point, altitude?: number) {
        return this.coordinateToViewPoint(coordinate, out, altitude);
    }

    /**
     * shorter alias for viewPointToCoordinate
     */
    viewPointToCoord(viewPoint: Point, out?: Coordinate) {
        return this.viewPointToCoordinate(viewPoint, out);
    }

    /**
     * shorter alias for coordinateToContainerPoint
     */
    coordToContainerPoint(coordinate: Coordinate, zoom?: number, out?: Point) {
        return this.coordinateToContainerPoint(coordinate, zoom, out);
    }


    /**
     * shorter alias for containerPointToCoordinate
     */
    containerPointToCoord(containerPoint: Point, out?: Coordinate) {
        return this.containerPointToCoordinate(containerPoint, out);
    }

    /**
     * Converts a container point to the view point.
     * Usually used in plugin development.
     * @param {Point}
     * @param  {Point} [out=undefined]    - optional point to receive result
     * @returns {Point}
     */
    containerPointToViewPoint(containerPoint: Point, out?: Point) {
        if (out) {
            out.set(containerPoint.x, containerPoint.y);
        } else {
            out = containerPoint.copy() as Point;
        }
        return out._sub(this.getViewPoint());
    }

    /**
     * Converts a view point to the container point.
     * Usually used in plugin development.
     * @param {Point}
     * @param  {Point} [out=undefined]    - optional point to receive result
     * @returns {Point}
     */
    viewPointToContainerPoint(viewPoint: Point, out?: Point) {
        if (out) {
            out.set(viewPoint.x, viewPoint.y);
        } else {
            out = viewPoint.copy() as Point;
        }
        return out._add(this.getViewPoint());
    }

    /**
     * Checks if the map container size changed and updates the map if so.
     * @return {Map} this
     * @fires Map#resize
     */
    checkSize(force?: boolean) {
        const justStart = ((now() - this._initTime) < 1500) && this.width === 0 || this.height === 0;

        const watched = this._getContainerDomSize(),
            oldHeight = this.height,
            oldWidth = this.width;
        if (!force && watched['width'] === oldWidth && watched['height'] === oldHeight) {
            return this;
        }
        // refresh map's dom position
        computeDomPosition(this._containerDOM);
        const center = this.getCenter();

        if (!this.options['fixCenterOnResize']) {
            // fix northwest's geo coordinate
            const vh = this._getVisualHeight(this.getPitch());
            const nwCP = new Point(0, this.height - vh);
            const nwCoord = this._containerPointToPrj(nwCP);
            this._updateMapSize(watched);
            const vhAfter = this._getVisualHeight(this.getPitch());
            const nwCPAfter = new Point(0, this.height - vhAfter);
            this._setPrjCoordAtContainerPoint(nwCoord, nwCPAfter);
            // when size changed, center is updated but panel's offset remains.
            this._mapViewCoord = this._getPrjCenter();
        } else {
            this._updateMapSize(watched);
        }

        const hided = (watched['width'] === 0 || watched['height'] === 0 || oldWidth === 0 || oldHeight === 0);

        if (justStart || hided) {
            this._eventSilence = true;
            this.setCenter(center);
            delete this._eventSilence;
        }
        /**
         * resize event when map container's size changes
         * @event Map#resize
         * @type {Object}
         * @property {String} type - resize
         * @property {Map} target - map fires the event
         */
        this._fireEvent('resize');

        return this;
    }



    /**
     * Computes the coordinate from the given meter distance.
     * @param  {Coordinate} coordinate - source coordinate
     * @param  {Number} dx           - meter distance on X axis
     * @param  {Number} dy           - meter distance on Y axis
     * @return {Coordinate} Result coordinate
     */
    locate(coordinate: Coordinate, dx: number, dy: number): Coordinate {
        return (this.getProjection() as any)._locate(new Coordinate(coordinate), dx, dy);
    }


    /**
     * Return map's main panel
     * @returns {HTMLElement}
     */
    getMainPanel(): HTMLDivElement | null {
        const renderer = this._getRenderer();
        if (!renderer) {
            return null;
        }
        return renderer.getMainPanel();
    }

    /**
     * Returns map panels.
     * @return {Object}
     */
    getPanels() {
        return this._panels;
    }

    /**
     * Remove the map
     * @return {Map} this
     */
    remove() {
        if (this.isRemoved()) {
            return this;
        }
        this._fireEvent('removestart');
        this._removeDomEvents();
        this._clearHandlers();
        this.removeBaseLayer();
        const layers = this.getLayers();
        for (let i = 0; i < layers.length; i++) {
            layers[i].remove();
        }
        if (this._getRenderer()) {
            this._getRenderer().remove();
        }
        if (this._containerDOM.childNodes && this._containerDOM.childNodes.length > 0) {
            Array.prototype.slice.call(this._containerDOM.childNodes, 0)
                .filter(node => node.className === 'maptalks-wrapper')
                .forEach(node => this._containerDOM.removeChild(node));
        }
        delete this._panels;
        delete this._containerDOM;
        delete this._renderer;
        this._fireEvent('removeend');
        this._clearAllListeners();
        return this;
    }

    /**
     * whether the map is removed
     * @return {Boolean}
     */
    isRemoved() {
        return !this._containerDOM;
    }

    /**
     * Whether the map is moving
     * @return {Boolean}
     */
    isMoving() {
        return !!this._moving;
    }

    /**
     * The callback function when move started
     * @private
     * @fires Map#movestart
     */
    onMoveStart(param?: any) {
        if (this._mapAnimPlayer) {
            this._stopAnim(this._mapAnimPlayer);
        }
        const prjCenter = this._getPrjCenter();
        if (!this._originCenter || this._verifyExtent(prjCenter)) {
            this._originCenter = prjCenter;
        }
        this._moving = true;
        this._trySetCursor('move');
        /**
         * movestart event
         * @event Map#movestart
         * @type {Object}
         * @property {String} type - movestart
         * @property {Map} target - map fires the event
         * @property {Coordinate} coordinate - coordinate of the event
         * @property {Point} containerPoint  - container point of the event
         * @property {Point} viewPoint       - view point of the event
         * @property {Event} domEvent                 - dom event
         */
        this._fireEvent('movestart', this._parseEvent(param ? param['domEvent'] : null, 'movestart'));
    }

    onMoving(param) {
        /**
         * moving event
         * @event Map#moving
         * @type {Object}
         * @property {String} type - moving
         * @property {Map} target - map fires the event
         * @property {Coordinate} coordinate - coordinate of the event
         * @property {Point} containerPoint  - container point of the event
         * @property {Point} viewPoint       - view point of the event
         * @property {Event} domEvent                 - dom event
         */
        this._fireEvent('moving', this._parseEvent(param ? param['domEvent'] : null, 'moving'));
    }

    onMoveEnd(param) {
        this._moving = false;
        if (!this._suppressRecenter) {
            this._recenterOnTerrain();
        }


        this._trySetCursor('default');
        /**
         * moveend event
         * @event Map#moveend
         * @type {Object}
         * @property {String} type - moveend
         * @property {Map} target - map fires the event
         * @property {Coordinate} coordinate - coordinate of the event
         * @property {Point} containerPoint  - container point of the event
         * @property {Point} viewPoint       - view point of the event
         * @property {Event} domEvent                 - dom event
         */
        this._fireEvent('moveend', (param && param['domEvent']) ? this._parseEvent(param['domEvent'], 'moveend') : param);
        if (!this._verifyExtent(this._getPrjCenter()) && this._originCenter) {
            const moveTo = this._originCenter;
            this._panTo(moveTo);
        }
    }

    onDragRotateStart(param) {
        this._dragRotating = true;
        /**
         * dragrotatestart event
         * @event Map#dragrotatestart
         * @type {Object}
         * @property {String} type - dragrotatestart
         * @property {Map} target - map fires the event
         * @property {Coordinate} coordinate - coordinate of the event
         * @property {Point} containerPoint  - container point of the event
         * @property {Point} viewPoint       - view point of the event
         * @property {Event} domEvent                 - dom event
         */
        this._fireEvent('dragrotatestart', this._parseEvent(param ? param['domEvent'] : null, 'dragrotatestart'));
    }

    onDragRotating(param) {
        /**
         * dragrotating event
         * @event Map#dragrotating
         * @type {Object}
         * @property {String} type - dragrotating
         * @property {Map} target - map fires the event
         * @property {Coordinate} coordinate - coordinate of the event
         * @property {Point} containerPoint  - container point of the event
         * @property {Point} viewPoint       - view point of the event
         * @property {Event} domEvent                 - dom event
         */
        this._fireEvent('dragrotating', this._parseEvent(param ? param['domEvent'] : null, 'dragrotating'));
    }

    onDragRotateEnd(param) {
        this._dragRotating = false;
        /**
         * dragrotateend event
         * @event Map#dragrotateend
         * @type {Object}
         * @property {String} type - dragrotateend
         * @property {Map} target - map fires the event
         * @property {Coordinate} coordinate - coordinate of the event
         * @property {Point} containerPoint  - container point of the event
         * @property {Point} viewPoint       - view point of the event
         * @property {Event} domEvent                 - dom event
         */
        this._fireEvent('dragrotateend', this._parseEvent(param ? param['domEvent'] : null, 'dragrotateend'));
    }

    isDragRotating() {
        return !!this._dragRotating;
    }

    /**
     * Test if given box is out of current screen
     * @param {Number[] | PointExtent} box - [minx, miny, maxx, maxy]
     * @param {Number} padding - test padding
     * @returns {Boolean}
     */
    isOffscreen(box: PointExtent | Array<number>, viewportPadding = 0) {
        const { width, height } = this;
        const screenRightBoundary = width + viewportPadding;
        const screenBottomBoundary = height + viewportPadding;
        let { xmin, ymin, xmax, ymax } = (box as PointExtent);
        if (Array.isArray(box)) {
            [xmin, ymin, xmax, ymax] = box;
        }
        return xmax < viewportPadding || xmin >= screenRightBoundary || ymax < viewportPadding || ymin > screenBottomBoundary;
    }

    getRenderer() {
        return this._getRenderer();
    }

    /**
     * Get map's devicePixelRatio, you can override it by setting devicePixelRatio in options.
     * @returns {Number}
     */
    getDevicePixelRatio(): number {
        return this.options['devicePixelRatio'] || Browser.devicePixelRatio || 1;
    }

    /**
     * Set map's devicePixelRatio
     * @param {Number} dpr
     * @returns {Map} this
     */
    setDevicePixelRatio(dpr: number) {
        if (isNumber(dpr) && dpr > 0 && dpr !== this.options['devicePixelRatio']) {
            this.options['devicePixelRatio'] = dpr;
            this.checkSize(true);
        }
        return this;
    }

    //-----------------------------------------------------------

    _initContainer(container: MapContainerType) {
        if (isString(container)) {
            this._containerDOM = document.getElementById(container) as HTMLDivElement;
            if (!this._containerDOM) {
                throw new Error('Invalid container when creating map: \'' + container + '\'');
            }
        } else {
            this._containerDOM = container as HTMLDivElement;
            if (IS_NODE) {
                //Reserve container's constructor in node for canvas creating.
                this.CanvasClass = this._containerDOM.constructor;
            }
        }

        if (this._containerDOM.childNodes && this._containerDOM.childNodes.length > 0) {
            //@ts-expect-error I don't know either
            if (this._containerDOM.childNodes[0].className === 'maptalks-wrapper') {
                throw new Error('Container is already loaded with another map instance, use map.remove() to clear it.');
            }
        }
    }

    /**
     * try to change cursor when map is not setCursored
     * @private
     * @param  {String} cursor css cursor
     */
    _trySetCursor(cursor: string) {
        if (!this._cursor && !this._priorityCursor) {
            if (!cursor) {
                cursor = 'default';
            }
            this._setCursorToPanel(cursor);
        }
        return this;
    }

    _setPriorityCursor(cursor: string) {
        if (!cursor) {
            let hasCursor = false;
            if (this._priorityCursor) {
                hasCursor = true;
            }
            delete this._priorityCursor;
            if (hasCursor) {
                this.setCursor(this._cursor);
            }
        } else {
            this._priorityCursor = cursor;
            this._setCursorToPanel(cursor);
        }
        return this;
    }

    _setCursorToPanel(cursor: string) {
        const panel = this.getMainPanel();
        if (panel && panel.style && panel.style.cursor !== cursor) {
            panel.style.cursor = cursor;
        }
    }


    //remove a layer from the layerList
    _removeLayer(layer: Layer, layerList: Array<Layer>) {
        if (!layer || !layerList) {
            return;
        }
        const index = layerList.indexOf(layer);
        if (index > -1) {
            layerList.splice(index, 1);
        }
    }

    _sortLayersByZIndex() {
        if (!this._layers) {
            return;
        }
        for (let i = 0, l = this._layers.length; i < l; i++) {

            // this._layers[i]._order = i;
            const layer = this._layers[i] as any;
            layer._order = i;
            if (layer.sortLayersByZIndex) {
                layer.sortLayersByZIndex();
            }
        }
        this._layers.sort(function (a, b) {
            const c = a.getZIndex() - b.getZIndex();
            if (c === 0) {
                return (a as any)._order - (b as any)._order;
            }
            return c;
        });
    }


    _fireEvent(eventName: string, param?: { [key: string]: any }) {
        if (this._eventSilence) {
            return;
        }
        //fire internal events at first
        const underline = '_';
        if (eventName[0] !== underline) {
            this.fire(underline + eventName, param);
        }
        this.fire(eventName, param);
    }

    _Load() {
        this._resetMapStatus();
        if (this.options['pitch']) {
            this.setPitch(this.options['pitch']);
            delete this.options['pitch'];
        }
        if (this.options['bearing']) {
            this.setBearing(this.options['bearing']);
            delete this.options['bearing'];
        }
        delete this._glRes;
        this._loadAllLayers();
        this._getRenderer().onLoad();
        this._loaded = true;
        this._callOnLoadHooks();
        this._initTime = now();
    }

    _initRenderer() {
        const renderer = this.options['renderer'];
        const clazz = Map.getRendererClass(renderer) as any;
        this._renderer = new clazz(this);
        this._renderer.load();
    }

    _getRenderer() {
        return this._renderer;
    }

    _loadAllLayers() {
        function loadLayer(layer) {
            if (layer) {
                layer.load();
            }
        }
        if (this._baseLayer) {
            this._baseLayer.load();
        }
        this._eachLayer(loadLayer, this.getLayers());
    }

    /**
     * Gets layers that fits for the filter
     * @param  {fn} filter - filter function
     * @return {Layer[]}
     * @private
     */
    _getLayers(filter?: (layer: Layer) => boolean) {
        const layers = this._baseLayer ? [this._baseLayer].concat(this._layers) : this._layers;
        const result = [];
        for (let i = 0; i < layers.length; i++) {
            if (!filter || filter.call(this, layers[i])) {
                result.push(layers[i]);
            }
        }
        return result;
    }

    _eachLayer(fn, ...layerLists) {
        if (arguments.length < 2) {
            return;
        }
        // let layerLists = Array.prototype.slice.call(arguments, 1);
        if (layerLists && !Array.isArray(layerLists)) {
            layerLists = [layerLists];
        }
        let layers = [];
        for (let i = 0, len = layerLists.length; i < len; i++) {
            layers = layers.concat(layerLists[i]);
        }
        for (let j = 0, jlen = layers.length; j < jlen; j++) {
            fn.call(fn, layers[j]);
        }
    }

    _onLayerEvent(param) {
        if (!param) {
            return;
        }
        if (param['type'] === 'idchange') {
            delete this._layerCache[param['old']];
            this._layerCache[param['new']] = param['target'];
        }
    }

    //Check and reset map's status when map's spatial reference is changed.
    _resetMapStatus() {
        let maxZoom = this.getMaxZoom(),
            minZoom = this.getMinZoom();
        const viewMaxZoom = this._spatialReference.getMaxZoom(),
            viewMinZoom = this._spatialReference.getMinZoom();
        if (isNil(maxZoom) || maxZoom === -1 || maxZoom > viewMaxZoom) {
            this.setMaxZoom(viewMaxZoom);
        }
        if (isNil(minZoom) || minZoom === -1 || minZoom < viewMinZoom) {
            this.setMinZoom(viewMinZoom);
        }
        maxZoom = this.getMaxZoom();
        minZoom = this.getMinZoom();
        if (maxZoom < minZoom) {
            this.setMaxZoom(minZoom);
        }
        if (isNil(this._zoomLevel) || this._zoomLevel > maxZoom) {
            this._zoomLevel = maxZoom;
        }
        if (this._zoomLevel < minZoom) {
            this._zoomLevel = minZoom;
        }
        delete this._prjCenter;
        delete this._glRes;
        const projection = this.getProjection();
        this._prjCenter = projection.project(this._center);
        this._prjCenter.z = this._center.z;
        this._calcMatrices();
        const renderer = this._getRenderer();
        if (renderer) {
            renderer.resetContainer();
        }
    }

    setContainerDomRect(domRect: DOMRect) {
        this._containerDomContentRect = domRect;
    }

    _getContainerDomSize(): Size | null {
        if (!this._containerDOM) {
            return null;
        }
        const containerDOM = this._containerDOM;
        let width, height;
        if (this._containerDomContentRect) {
            width = this._containerDomContentRect.width;
            height = this._containerDomContentRect.height;
            return new Size(width, height);
        }
        //is Canvas
        const canvasDom = containerDOM as HTMLCanvasElement;
        if (!isNil(canvasDom.width) && !isNil(canvasDom.height)) {
            width = canvasDom.width;
            height = canvasDom.height;
            const dpr = this.getDevicePixelRatio();
            if (dpr !== 1 && containerDOM['layer']) {
                //is a canvas tile of CanvasTileLayer
                width /= dpr;
                height /= dpr;
            }
        } else if (!isNil(containerDOM.clientWidth) && !isNil(containerDOM.clientHeight)) {
            width = parseInt(containerDOM.clientWidth + '', 0);
            height = parseInt(containerDOM.clientHeight + '', 0);
        } else {
            throw new Error('can not get size of container');
        }
        return new Size(width, height);
    }

    _updateMapSize(mSize: Size) {
        this.width = mSize['width'];
        this.height = mSize['height'];
        this._getRenderer().updateMapSize(mSize);
        this._calcMatrices();
        return this;
    }

    /**
     * Gets projected center of the map
     * @return {Coordinate}
     * @private
     */
    _getPrjCenter() {
        return this._prjCenter;
    }

    _setPrjCenter(pcenter: Coordinate) {
        this._prjCenter = pcenter;
        if (this.isInteracting() && !this.isMoving()) {
            // when map is not moving, map's center is updated but map platform won't
            // mapViewCoord needs to be synced
            this._mapViewCoord = pcenter;
        }
        this._calcMatrices();
    }

    _setPrjCoordAtContainerPoint(coordinate: Coordinate, point: Point) {
        if (!this.centerAltitude && point.x === this.width / 2 && point.y === this.height / 2) {
            return this;
        }
        const p = this._containerPointToPoint(point);
        const t = p._sub(this._prjToPoint(this._getPrjCenter()));
        const pcenter = this._pointToPrj(this._prjToPoint(coordinate)._sub(t));
        this._setPrjCenter(pcenter);
        return this;
    }

    _setPrjCoordAtOffsetToCenter(prjCoord: Coordinate, offset: Point) {
        const pcenter = this._pointToPrj(this._prjToPoint(prjCoord)._sub(offset));
        this._setPrjCenter(pcenter);
        return this;
    }

    _verifyExtent(prjCenter: Coordinate) {
        if (!prjCenter) {
            return false;
        }
        const maxExt = this._prjMaxExtent;
        if (!maxExt) {
            return true;
        }
        return maxExt.contains(prjCenter);
    }

    /**
     * Move map's center by pixels.
     * @param  {Point} pixel - pixels to move, the relation between value and direction is as:
     * -1,1 | 1,1
     * ------------
     *-1,-1 | 1,-1
     * @private
     * @returns {Coordinate} the new projected center.
     */
    _offsetCenterByPixel(pixel: Point) {
        const pos = TEMP_POINT.set(this.width / 2 - pixel.x, this.height / 2 - pixel.y);
        const coord = this._containerPointToPrj(pos, TEMP_COORD);
        const containerCenter = TEMP_POINT.set(this.width / 2, this.height / 2);
        this._setPrjCoordAtContainerPoint(coord, containerCenter);
    }

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
    offsetPlatform(offset?: Point): Point {
        if (!offset) {
            return this._mapViewPoint;
        } else {
            this._getRenderer().offsetPlatform(offset);
            this._mapViewCoord = this._getPrjCenter();
            this._mapViewPoint = this._mapViewPoint.add(offset) as Point;
            return this._mapViewPoint;
        }
    }

    /**
     * Get map's view point, adding in frame offset
     * @return {Point} map view point
     */
    getViewPoint(): Point {
        const offset = this.getViewPointFrameOffset();
        let panelOffset = this.offsetPlatform();
        if (offset) {
            panelOffset = (panelOffset as any).add(offset);
        }
        return panelOffset;
    }


    _resetMapViewPoint() {
        this._mapViewPoint = new Point(0, 0);
        // mapViewCoord is the proj coordinate of current view point
        this._mapViewCoord = this._getPrjCenter();
    }

    /**
     * Get map's current resolution
     * @return {Number} resolution
     * @private
     */
    _getResolution(zoom?: number) {
        if ((zoom === undefined || zoom === this._zoomLevel) && this._mapRes !== undefined) {
            return this._mapRes;
        }
        if (isNil(zoom)) {
            zoom = this._zoomLevel;
        }
        return this._spatialReference.getResolution(zoom);
    }

    _getResolutions() {
        return this._spatialReference.getResolutions();
    }

    /**
     * Converts the projected coordinate to a 2D point in the specific zoom
     * @param  {Coordinate} pCoord - projected Coordinate
     * @param  {Number} zoom   - point's zoom level
     * @return {Point} 2D point
     * @private
     */
    _prjToPoint(pCoord, zoom?: number, out?: Point) {
        zoom = (isNil(zoom) ? this.getZoom() : zoom);
        const res = this._getResolution(zoom);
        return this._prjToPointAtRes(pCoord, res, out);
    }

    _prjToPointAtRes(pCoord: Coordinate, res?: number, out?: Point): Point {
        return this._spatialReference.getTransformation().transform(pCoord, res, out);
    }

    /**
     * Converts the projected coordinate to a 2D point in the specific resolution
     * @param  {Coordinate} pCoord - projected Coordinate
     * @param  {Number} res   - point's resolution
     * @return {Point} 2D point
     * @private
     */
    _prjsToPointsAtRes(pCoords: Array<Coordinate>, res?: number, resultPoints = []): Array<Point> {
        const transformation = this._spatialReference.getTransformation();
        const pts = [];
        for (let i = 0, len = pCoords.length; i < len; i++) {
            const pt = transformation.transform(pCoords[i], res, resultPoints[i]);
            pts.push(pt);
        }
        return pts;
    }

    /**
     * Converts the 2D point to projected coordinate
     * @param  {Point} point - 2D point
     * @param  {Number} zoom   - point's zoom level
     * @return {Coordinate} projected coordinate
     * @private
     */
    _pointToPrj(point: Point, zoom?: number, out?: Coordinate): Coordinate {
        zoom = (isNil(zoom) ? this.getZoom() : zoom);
        const res = this._getResolution(zoom);
        return this._pointToPrjAtRes(point, res, out);
    }

    _pointToPrjAtRes(point: Point, res?: number, out?: Coordinate): Coordinate {
        return this._spatialReference.getTransformation().untransform(point, res, out);
    }

    /**
     * Convert point at zoom to point at current zoom
     * @param  {Point} point point
     * @param  {Number} zoom point's zoom
     * @return {Point} point at current zoom
     * @private
     */
    _pointToPoint(point: Point, zoom?: number, out?: Point): Point {
        if (!isNil(zoom)) {
            return this._pointAtResToPoint(point, this._getResolution(zoom), out);
        }
        if (out) {
            out.x = point.x;
            out.y = point.y;
        } else {
            out = point.copy() as Point;
        }
        return out;
    }

    _pointAtResToPoint(point: Point, res?: number, out?: Point): Point {
        if (out) {
            out.x = point.x;
            out.y = point.y;
        } else {
            out = point.copy() as Point;
        }
        return out._multi(res / this._getResolution());
    }

    /**
     * Convert point at current zoom to point at target res
     * @param  {Point} point point
     * @param  {Number} res target res
     * @return {Point} point at target res
     * @private
     */
    _pointToPointAtRes(point: Point, res?: number, out?: Point): Point {
        if (out) {
            out.x = point.x;
            out.y = point.y;
        } else {
            out = point.copy() as Point;
        }
        return out._multi(this._getResolution() / res);
    }

    /**
     * transform container point to geographical projected coordinate
     *
     * @param  {Point} containerPoint
     * @return {Coordinate}
     * @private
     */
    _containerPointToPrj(containerPoint: Point, out?: Coordinate) {
        return this._pointToPrj(this._containerPointToPoint(containerPoint, undefined, out as Point), undefined, out);
    }


    /* eslint no-extend-native: 0 */
    _callOnLoadHooks() {
        const proto = Map.prototype;
        if (!proto._onLoadHooks) {
            return;
        }
        for (let i = 0, l = proto._onLoadHooks.length; i < l; i++) {
            proto._onLoadHooks[i].call(this);
        }
    }
    //fix prj value when current view is world wide
    _fixPrjOnWorldWide(prjCoord: Coordinate) {
        const projection = this.getProjection() as any;
        if (projection && projection.fullExtent && prjCoord) {
            const { left, bottom, top, right } = projection.fullExtent || {};
            if (isNumber(left)) {
                prjCoord.x = Math.max(left, prjCoord.x);
            }
            if (isNumber(right)) {
                prjCoord.x = Math.min(right, prjCoord.x);
            }
            if (isNumber(bottom)) {
                prjCoord.y = Math.max(bottom, prjCoord.y);
            }
            if (isNumber(top)) {
                prjCoord.y = Math.min(top, prjCoord.y);
            }
        }
        return this;
    }

    /**
     * Export the map's json, a snapshot of the map in JSON format.<br>
     * It can be used to reproduce the instance by [fromJSON]{@link Map#fromJSON} method
     * @param  {Object} [options=null] - export options
     * @param  {Boolean|Object} [options.baseLayer=null] - whether to export base layer's JSON, if yes, it will be used as layer's toJSON options.
     * @param  {Boolean|Extent} [options.clipExtent=null] - if set with an extent instance, only the geometries intersectes with the extent will be exported.
     *                                                             If set to true, map's current extent will be used.
     * @param  {Boolean|Object|Object[]} [options.layers=null] - whether to export other layers' JSON, if yes, it will be used as layer's toJSON options.
     *                                                        It can also be an array of layer export options with a "id" attribute to filter the layers to export.
     * @return {Object} layer's JSON
     */
    toJSON(options?: MapOptionsType): { [key: string]: any } {
        if (!options) {
            options = {};
        }
        const json = {
            'jsonVersion': this['JSON_VERSION'],
            'version': this.VERSION,
            'extent': this.getExtent().toJSON()
        };
        json['options'] = this.config();
        json['options']['center'] = this.getCenter();
        json['options']['zoom'] = this.getZoom();
        json['options']['bearing'] = this.getBearing();
        json['options']['pitch'] = this.getPitch();

        const baseLayer = this.getBaseLayer();
        if ((isNil(options['baseLayer']) || options['baseLayer']) && baseLayer) {
            json['baseLayer'] = baseLayer.toJSON(options['baseLayer']);
        }
        const extraLayerOptions = {};
        if (options['clipExtent']) {
            //if clipExtent is set, only geometries intersecting with extent will be exported.
            //clipExtent's value can be an extent or true (map's current extent)
            if (options['clipExtent'] === true) {
                extraLayerOptions['clipExtent'] = this.getExtent();
            } else {
                extraLayerOptions['clipExtent'] = options['clipExtent'];
            }
        }
        const layersJSON = [];
        if (isNil(options['layers']) || (options['layers'] && !Array.isArray(options['layers']))) {
            const layers = this.getLayers();
            for (let i = 0, len = layers.length; i < len; i++) {
                if (!layers[i].toJSON) {
                    continue;
                }
                const opts = extend({}, isObject(options['layers']) ? options['layers'] : {}, extraLayerOptions);
                layersJSON.push(layers[i].toJSON(opts));
            }
            json['layers'] = layersJSON;
        } else if (isArrayHasData(options['layers'])) {
            const layers = options['layers'];
            for (let i = 0; i < layers.length; i++) {
                const exportOption = layers[i];
                const layer = this.getLayer(exportOption['id']);
                if (!layer.toJSON) {
                    continue;
                }
                const opts = extend({}, exportOption['options'], extraLayerOptions);
                layersJSON.push(layer.toJSON(opts));
            }
            json['layers'] = layersJSON;
        } else {
            json['layers'] = [];
        }
        return json;
    }

    /**
     * Reproduce a map from map's profile JSON.
     * @param {(string|HTMLElement|object)} container - The container to create the map on, can be:<br>
     *                                          1. A HTMLElement container.<br/>
     *                                          2. ID of a HTMLElement container.<br/>
     *                                          3. A canvas compatible container in node,
     *                                          e.g. [node-canvas]{@link https://github.com/Automattic/node-canvas},
     *                                              [canvas2svg]{@link https://github.com/gliffy/canvas2svg}
     * @param  {Object} mapJSON - map's profile JSON
     * @param  {Object} [options=null] - options
     * @param  {Object} [options.baseLayer=null] - whether to import the baseLayer
     * @param  {Object} [options.layers=null]    - whether to import the layers
     * @return {Map}
     * @static
     * @function
     * @example
     * var map = Map.fromJSON('map', mapProfile);
     */
    static fromJSON(container: MapContainerType, profile: { [key: string]: any }, options?: MapOptionsType) {
        if (!container || !profile) {
            return null;
        }
        if (!options) {
            options = {};
        }
        const map = new Map(container, profile['options']);
        if (isNil(options['baseLayer']) || options['baseLayer']) {
            const baseLayer = Layer.fromJSON(profile['baseLayer']);
            if (baseLayer) {
                map.setBaseLayer(baseLayer);
            }
        }
        if (isNil(options['layers']) || options['layers']) {
            const layers = [];
            const layerJSONs = profile['layers'];
            for (let i = 0; i < layerJSONs.length; i++) {
                const layer = Layer.fromJSON(layerJSONs[i]);
                layers.push(layer);
            }
            map.addLayer(layers);
        }

        return map;
    }

}

Map.mergeOptions(options);

export default Map;

export type MapOptionsType = {
    // center: Array<number> | Coordinate;
    // zoom: number;
    baseLayer?: Layer;
    layers?: Array<Layer>;
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
    control?: boolean;
    attribution?: boolean;
    zoomControl?: boolean;
    scaleControl?: boolean;
    overviewControl?: boolean;
    fog?: boolean;
    fogColor?: any; // fixme 确认类型
    devicePixelRatio?: number;
    heightFactor?: number;
    cameraInfiniteFar?: boolean;
    originLatitudeForAltitude?: number;

    viewHistory?: boolean;
    viewHistoryCount?: number;
    seamlessZoom?: boolean;
    maxVisualPitch?: number;
    maxPitch?: number;
    centerCross?: boolean;
    zoomInCenter?: boolean;
    zoomOrigin?: Array<number>;
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
    checkSize?: boolean;
    checkSizeInterval?: number;
    renderer?: 'canvas' | 'gl';
    cascadePitches?: Array<number>;
    renderable?: boolean;
    clickTimeThreshold?: number;
    stopRenderOnOffscreen?: boolean;
    preventWheelScroll?: boolean;
    preventTouch?: boolean;
    supportPluginEvent?: boolean;
    switchDragButton?: boolean;
    mousemoveThrottleTime?: number;
    maxFPS?: number;
    debug?: boolean;
    spatialReference?: SpatialReferenceType,
    autoPanAtEdge?: boolean;
    boxZoom?: boolean;
    boxZoomSymbol?: {
        'markerType': string;
        'markerLineWidth': number;
        'markerLineColor': string;
        'markerLineDasharray': Array<number>;
        'markerFillOpacity': number;
        'markerFill': string;
        'markerWidth': number;
        'markerHeight': number;
    };
    onlyVisibleGeometryEvents?: boolean;
    compassControl?: boolean;
    layerSwitcherControl?: boolean;
    navControl?: boolean;
    resetControl?: boolean;

}

export type MapCreateOptionsType = {
    center: Array<number> | Coordinate;
    zoom: number
} & MapOptionsType;

export type MapPaddingType = {
    paddingLeft: number;
    paddingRight: number;
    paddingTop: number;
    paddingBottom: number;
}

export type MapViewType = {
    center?: Array<number> | Coordinate,
    zoom?: number;
    pitch?: number;
    bearing?: number;
    height?: number;
}

export type MapFitType = {
    isFraction?: boolean;
    animation?: boolean;
    duration?: number;
    easing?: EasingType
} & MapPaddingType;

export type MapDataURLType = {
    mimeType?: string;
    fileName?: string;
    quality?: number;
    save?: boolean;
}

export type MapAnimationOptionsType = AnimationOptionsType;

export type MapIdentifyOptionsType = {
    tolerance?: number;
    eventTypes?: Array<string>;
    layers?: Array<Layer>;
    count?: number;
    includeInvisible?: boolean;
    includeInternals?: boolean;


}

export type MapContainerType = string | HTMLDivElement | HTMLCanvasElement | { [key: string]: any };

export type PanelDom = (HTMLDivElement | HTMLElement) & { layerDOM: HTMLElement; uiDOM: HTMLElement; }
