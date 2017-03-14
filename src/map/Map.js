import { INTERNAL_LAYER_PREFIX } from 'core/Constants';
import {
    now,
    extend,
    isNode,
    isNil,
    isString,
    isFunction,
    isNumber,
    round,
    executeWhen
} from 'core/util';
import Class from 'core/Class';
import Browser from 'core/Browser';
import Eventable from 'core/Eventable';
import Handlerable from 'handler/Handlerable';
import Point from 'geo/Point';
import Size from 'geo/Size';
import PointExtent from 'geo/PointExtent';
import Extent from 'geo/Extent';
import Coordinate from 'geo/Coordinate';
import Layer from 'layer/Layer';
import TileLayer from 'layer/tile/TileLayer';
import TileSystem from 'layer/tile/tileinfo/TileSystem';
import Renderable from 'renderer/Renderable';
import View from './view/View';


/**
 * @property {Object} options                                   - map's options, options must be updated by config method:<br> map.config('zoomAnimation', false);
 * @property {Boolean} [options.centerCross=false]              - Display a red cross in the center of map
 * @property {Boolean} [options.clipFullExtent=false]           - clip geometries outside map's full extent
 * @property {Boolean} [options.zoomAnimation=true]             - enable zooming animation
 * @property {Number}  [options.zoomAnimationDuration=330]      - zoom animation duration.
 * @property {Boolean} [options.zoomBackground=true]            - leaves a background after zooming.
 * @property {Boolean} [options.layerZoomAnimation=true]        - also animate layers when zooming.
 * @property {Number}  [options.pointThresholdOfZoomAnimation=150] - threshold of point count to perform zoom animation.
 * @property {Boolean} [options.panAnimation=true]              - continue to animate panning when draging or touching ended.
 * @property {Boolean} [options.panAnimationDuration=600]       - duration of pan animation.
 * @property {Boolean} [options.zoomable=true]                  - whether to enable map zooming.
 * @property {Boolean} [options.enableInfoWindow=true]          - whether to enable infowindow on this map.
 * @property {Boolean} [options.hitDetect=true]                 - whether to enable hit detecting of layers for cursor style on this map, disable it to improve performance.
 * @property {Number}  [options.maxZoom=null]                   - the maximum zoom the map can be zooming to.
 * @property {Number}  [options.minZoom=null]                   - the minimum zoom the map can be zooming to.
 * @property {Extent} [options.maxExtent=null]         - when maxExtent is set, map will be restricted to the give max extent and bouncing back when user trying to pan ouside the extent.
 *
 * @property {Boolean} [options.draggable=true]                         - disable the map dragging if set to false.
 * @property {Boolean} [options.doublClickZoom=true]                    - whether to allow map to zoom by double click events.
 * @property {Boolean} [options.scrollWheelZoom=true]                   - whether to allow map to zoom by scroll wheel events.
 * @property {Boolean} [options.touchZoom=true]                         - whether to allow map to zoom by touch events.
 * @property {Boolean} [options.autoBorderPanning=false]                - whether to pan the map automatically if mouse moves on the border of the map
 * @property {Boolean} [options.geometryEvents=true]                    - enable/disable firing geometry events
 *
 * @property {Boolean}        [options.control=true]                    - whether allow map to add controls.
 * @property {Boolean|Object} [options.attributionControl=false]        - display the attribution control on the map if set to true or a object as the control construct option.
 * @property {Boolean|Object} [options.zoomControl=false]               - display the zoom control on the map if set to true or a object as the control construct option.
 * @property {Boolean|Object} [options.scaleControl=false]              - display the scale control on the map if set to true or a object as the control construct option.
 * @property {Boolean|Object} [options.overviewControl=false]           - display the overview control on the map if set to true or a object as the control construct option.
 *
 * @property {String} [options.renderer=canvas]                 - renderer type. Don't change it if you are not sure about it. About renderer, see [TODO]{@link tutorial.renderer}.
 * @memberOf Map
 * @instance
 */
const options = {
    'centerCross': false,

    'clipFullExtent': false,

    'zoomInCenter' : false,
    'zoomAnimation': (function () {
        return !isNode;
    })(),
    'zoomAnimationDuration': 330,
    //still leave background after zooming, set it to false if baseLayer is a transparent layer
    'zoomBackground': false,
    //controls whether other layers than base tilelayer will show during zoom animation.
    'layerZoomAnimation': true,

    'pointThresholdOfZoomAnimation': 200,

    'panAnimation': (function () {
        return !isNode;
    })(),
    //default pan animation duration
    'panAnimationDuration': 600,

    'zoomable': true,
    'enableInfoWindow': true,

    'hitDetect': (function () {
        return !Browser.mobile;
    })(),

    'maxZoom': null,
    'minZoom': null,
    'maxExtent': null,

    'checkSize': true,

    'renderer': 'canvas'
};

/**
 * The central class of the library, to create a map on a container.
 * @category map
 * @extends Class
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
 *          new maptalks.VectorLayer('v', [new maptalks.Marker([180, 0]])
 *      ]
 * });
 */
class Map extends Handlerable(Eventable(Renderable(Class))) {

    /**
     * @param {(string|HTMLElement|object)} container - The container to create the map on, can be:<br>
     *                                          1. A HTMLElement container.<br/>
     *                                          2. ID of a HTMLElement container.<br/>
     *                                          3. A canvas compatible container in node,
     *                                          e.g. [node-canvas]{@link https://github.com/Automattic/node-canvas},
     *                                              [canvas2svg]{@link https://github.com/gliffy/canvas2svg}
     * @param {Object} options - construct options
     * @param {(Number[]|Coordinate)} options.center - initial center of the map.
     * @param {Number} options.zoom - initial zoom of the map.
     * @param {Object} [options.view=null] - map's view config, default is using projection EPSG:3857 with resolutions used by google map/osm.
     * @param {Layer} [options.baseLayer=null] - base layer that will be set to map initially.
     * @param {Layer[]} [options.layers=null] - layers that will be added to map initially.
     * @param {*} options.* - any other option defined in [Map.options]{@link Map#options}      [description]
     */
    constructor(container, options) {
        if (!options) {
            throw new Error('Invalid options when creating map.');
        }
        if (!options['center']) {
            throw new Error('Invalid center when creating map.');
        }
        // copy options
        const opts = extend({}, options);
        const zoom = opts['zoom'];
        delete opts['zoom'];
        const center = new Coordinate(opts['center']);
        delete opts['center'];

        const baseLayer = opts['baseLayer'];
        delete opts['baseLayer'];
        const layers = opts['layers'];
        delete opts['layers'];

        super(opts);

        this._loaded = false;
        if (isString(container)) {
            this._containerDOM = document.getElementById(container);
            if (!this._containerDOM) {
                throw new Error('invalid container when creating map: \'' + container + '\'');
            }
        } else {
            this._containerDOM = container;
            if (isNode) {
                //Reserve container's constructor in node for canvas creating.
                this.CanvasClass = this._containerDOM.constructor;
            }
        }

        if (!isNode) {
            if (this._containerDOM.childNodes && this._containerDOM.childNodes.length > 0) {
                if (this._containerDOM.childNodes[0].className === 'maptalks-wrapper') {
                    throw new Error('Container is already loaded with another map instance, use map.remove() to clear it.');
                }
            }
        }

        this._panels = {};

        //Layers
        this._baseLayer = null;
        this._layers = [];

        this._zoomLevel = zoom;
        this._center = center;

        this.setView(opts['view']);

        if (baseLayer) {
            this.setBaseLayer(baseLayer);
        }
        if (layers) {
            this.addLayer(layers);
        }

        this._mapViewPoint = new Point(0, 0);

        this._initRenderer();
        this._getRenderer().initContainer();
        this._updateMapSize(this._getContainerDomSize());

        this._Load();
    }

    /**
     * Add hooks for additional codes when map's loading complete, useful for plugin developping.
     * @param {Function} fn
     * @returns {Map}
     * @protected
     */
    static addOnLoadHook(fn) { // (Function) || (String, args...)
        const args = Array.prototype.slice.call(arguments, 1);
        var onload = typeof fn === 'function' ? fn : function () {
            this[fn].apply(this, args);
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
        return this._loaded;
    }

    /**
     * Whether the map is rendered by canvas
     * @return {Boolean}
     * @protected
     * @example
     * var isCanvas = map.isCanvasRender();
     */
    isCanvasRender() {
        var renderer = this._getRenderer();
        if (renderer) {
            return renderer.isCanvasRender();
        }
        return false;
    }

    /**
     * Get the view of the Map.
     * @return {View} map's view
     */
    getView() {
        if (!this._view) {
            return null;
        }
        return this._view;
    }

    /**
     * Change the view of the map. <br>
     * A view is a series of settings to decide the map presentation:<br>
     * 1. the projection.<br>
     * 2. zoom levels and resolutions. <br>
     * 3. full extent.<br>
     * There are some [predefined views]{@link http://www.foo.com}, and surely you can [define a custom one.]{@link http://www.foo.com}.<br>
     * View can also be updated by map.config('view', view);
     * @param {View} view - view settings
     * @returns {Map} this
     * @fires Map#viewchange
     * @example
     *  map.setView({
            projection:'EPSG:4326',
            resolutions: (function() {
                var resolutions = [];
                for (var i=0; i < 19; i++) {
                    resolutions[i] = 180/(Math.pow(2, i)*128);
                }
                return resolutions;
            })()
     *  });
       @example
     *  map.config('view', {
            projection:'EPSG:4326',
            resolutions: (function() {
                var resolutions = [];
                for (var i=0; i < 19; i++) {
                    resolutions[i] = 180/(Math.pow(2, i)*128);
                }
                return resolutions;
            })()
        });
     */
    setView(view) {
        var oldView = this.options['view'];
        if (oldView && !view) {
            return this;
        }
        this._center = this.getCenter();
        this.options['view'] = view;
        this._view = new View(view);
        if (this.options['view'] && isFunction(this.options['view']['projection'])) {
            var projection = this._view.getProjection();
            //save projection code for map profiling (toJSON/fromJSON)
            this.options['view']['projection'] = projection['code'];
        }
        this._resetMapStatus();
        /**
         * viewchange event, fired when map's view is updated.
         *
         * @event Map#viewchange
         * @type {Object}
         * @property {String} type - viewchange
         * @property {Map} target - map
         * @property {Map} old - the old view
         * @property {Map} new - the new view changed to
         */
        this._fireEvent('viewchange', {
            'old': oldView,
            'new': extend({}, this.options['view'])
        });
        return this;
    }

    /**
     * Callback when any option is updated
     * @private
     * @param  {Object} conf - options to update
     * @return {Map}   this
     */
    onConfig(conf) {
        if (!isNil(conf['view'])) {
            this.setView(conf['view']);
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
        return this._view.getProjection();
    }

    /**
     * Get map's full extent, which is defined in map's view. <br>
     * eg: {'left': -180, 'right' : 180, 'top' : 90, 'bottom' : -90}
     * @return {Extent}
     */
    getFullExtent() {
        return this._view.getFullExtent();
    }

    /**
     * Set map's cursor style, cursor style is same with CSS.
     * @param {String} cursor - cursor style
     * @returns {Map} this
     * @example
     * map.setCursor('url(cursor.png) 4 12, auto');
     */
    setCursor(cursor) {
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
    getCenter() {
        if (!this._loaded || !this._prjCenter) {
            return this._center;
        }
        var projection = this.getProjection();
        return projection.unproject(this._prjCenter);
    }

    /**
     * Set a new center to the map.
     * @param {Coordinate} center
     * @return {Map} this
     */
    setCenter(center) {
        if (!center) {
            return this;
        }
        center = new Coordinate(center);
        if (!this._verifyExtent(center)) {
            return this;
        }
        if (!this._loaded) {
            this._center = center;
            return this;
        }
        this.onMoveStart();
        var projection = this.getProjection();
        var _pcenter = projection.project(center);
        this._setPrjCenterAndMove(_pcenter);
        this.onMoveEnd();
        return this;
    }

    /**
     * Get map's size (width and height) in pixel.
     * @return {Size}
     */
    getSize() {
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
        return new PointExtent(0, 0, this.width, this.height);
    }

    /**
     * Get the geographical extent of map's current view extent.
     *
     * @return {Extent}
     */
    getExtent() {
        return this._pointToExtent(this._get2DExtent());
    }

    /**
     * Get the projected geographical extent of map's current view extent.
     *
     * @return {Extent}
     */
    getProjExtent() {
        var extent2D = this._get2DExtent();
        return new Extent(
            this._pointToPrj(extent2D.getMin()),
            this._pointToPrj(extent2D.getMax())
        );
    }

    /**
     * Get the max extent that the map is restricted to.
     * @return {Extent}
     */
    getMaxExtent() {
        if (!this.options['maxExtent']) {
            return null;
        }
        return new Extent(this.options['maxExtent']);
    }

    /**
     * Sets the max extent that the map is restricted to.
     * @param {Extent}
     * @return {Map} this
     * @example
     * map.setMaxExtent(map.getExtent());
     */
    setMaxExtent(extent) {
        if (extent) {
            var maxExt = new Extent(extent);
            this.options['maxExtent'] = maxExt;
            var center = this.getCenter();
            if (!this._verifyExtent(center)) {
                this.panTo(maxExt.getCenter());
            }
        } else {
            delete this.options['maxExtent'];
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
     * @return {Number} zoom fit for scale starting from fromZoom
     */
    getZoomForScale(scale, fromZoom) {
        if (isNil(fromZoom)) {
            fromZoom = this.getZoom();
        }
        var res = this._getResolution(fromZoom),
            resolutions = this._getResolutions(),
            minZoom = this.getMinZoom(),
            maxZoom = this.getMaxZoom(),
            min = Number.MAX_VALUE,
            hit = -1;
        for (var i = resolutions.length - 1; i >= 0; i--) {
            var test = Math.abs(res / resolutions[i] - scale);
            if (test < min) {
                min = test;
                hit = i;
            }
        }
        if (isNumber(minZoom) && hit < minZoom) {
            hit = minZoom;
        }
        if (isNumber(maxZoom) && hit > maxZoom) {
            hit = maxZoom;
        }
        return hit;
    }

    getZoomFromRes(res) {
        var resolutions = this._getResolutions(),
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

        var l = resolutions.length;
        for (var i = 0; i < l - 1; i++) {
            if (!resolutions[i]) {
                continue;
            }
            var gap = Math.abs(resolutions[i + 1] - resolutions[i]);
            var test = Math.abs(res - resolutions[i]);
            if (gap >= test) {
                return i + test / gap;
            }
        }
        return l - 1;
    }

    /**
     * Sets zoom of the map
     * @param {Number} zoom
     * @returns {Map} this
     */
    setZoom(zoom) {
        var me = this;
        executeWhen(function () {
            if (me._loaded && me.options['zoomAnimation']) {
                me._zoomAnimation(zoom);
            } else {
                me._zoom(zoom);
            }
        }, function () {
            return !me._zooming;
        });
        return this;
    }

    /**
     * Get the max zoom that the map can be zoom to.
     * @return {Number}
     */
    getMaxZoom() {
        if (!isNil(this.options['maxZoom'])) {
            return this.options['maxZoom'];
        }
        var view = this.getView();
        if (!view) {
            return null;
        }
        return view.getResolutions().length - 1;
    }

    /**
     * Sets the max zoom that the map can be zoom to.
     * @param {Number} maxZoom
     * @returns {Map} this
     */
    setMaxZoom(maxZoom) {
        var viewMaxZoom = this._view.getMaxZoom();
        if (maxZoom > viewMaxZoom) {
            maxZoom = viewMaxZoom;
        }
        if (maxZoom < this._zoomLevel) {
            this.setZoom(maxZoom);
        }
        this.options['maxZoom'] = maxZoom;
        return this;
    }

    /**
     * Get the min zoom that the map can be zoom to.
     * @return {Number}
     */
    getMinZoom() {
        if (!isNil(this.options['minZoom'])) {
            return this.options['minZoom'];
        }
        return 0;
    }

    /**
     * Sets the min zoom that the map can be zoom to.
     * @param {Number} minZoom
     * @return {Map} this
     */
    setMinZoom(minZoom) {
        var viewMinZoom = this._view.getMinZoom();
        if (minZoom < viewMinZoom) {
            minZoom = viewMinZoom;
        }
        this.options['minZoom'] = minZoom;
        return this;
    }

    /**
     * zoom in
     * @return {Map} this
     */
    zoomIn() {
        var me = this;
        executeWhen(function () {
            me.setZoom(me.getZoom() + 1);
        }, function () {
            return !me._zooming;
        });
        return this;
    }

    /**
     * zoom out
     * @return {Map} this
     */
    zoomOut() {
        var me = this;
        executeWhen(function () {
            me.setZoom(me.getZoom() - 1);
        }, function () {
            return !me._zooming;
        });
        return this;
    }

    /**
     * Whether the map is zooming
     * @return {Boolean}
     */
    isZooming() {
        return !!this._zooming;
    }

    /**
     * Sets the center and zoom at the same time.
     * @param {Coordinate} center
     * @param {Number} zoom
     * @return {Map} this
     */
    setCenterAndZoom(center, zoom) {
        if (this._zoomLevel !== zoom) {
            this.setCenter(center);
            if (!isNil(zoom)) {
                this.setZoom(zoom);
            }
        } else {
            this.setCenter(center);
        }
        return this;
    }


    /**
     * Caculate the zoom level that contains the given extent with the maximum zoom level possible.
     * @param {Extent} extent
     * @return {Number} zoom fit for the extent
     */
    getFitZoom(extent) {
        if (!extent || !(extent instanceof Extent)) {
            return this._zoomLevel;
        }
        //It's a point
        if (extent['xmin'] === extent['xmax'] && extent['ymin'] === extent['ymax']) {
            return this.getMaxZoom();
        }
        var projection = this.getProjection(),
            x = Math.abs(extent['xmin'] - extent['xmax']),
            y = Math.abs(extent['ymin'] - extent['ymax']),
            projectedExtent = projection.project({
                x: x,
                y: y
            }),
            resolutions = this._getResolutions(),
            xz = -1,
            yz = -1;
        for (var i = this.getMinZoom(), len = this.getMaxZoom(); i < len; i++) {
            if (round(projectedExtent.x / resolutions[i]) >= this.width) {
                if (xz === -1) {
                    xz = i;
                }
            }
            if (round(projectedExtent.y / resolutions[i]) >= this.height) {
                if (yz === -1) {
                    yz = i;
                }
            }
            if (xz > -1 && yz > -1) {
                break;
            }
        }
        var ret = xz < yz ? xz : yz;
        if (ret === -1) {
            ret = xz < yz ? yz : xz;
        }
        if (ret === -1) {
            return this.getMaxZoom();
        }
        return ret;
    }

    /**
     * Get map's resolution
     * @param {Number} zoom - zoom or current zoom if not given
     * @return {Number} resolution
     */
    getResolution(zoom) {
        return this._getResolution(zoom);
    }

    /**
     * Get scale of resolutions from zoom to max zoom
     * @param {Number} zoom - zoom or current zoom if not given
     * @return {Number} scale
     */
    getScale(zoom) {
        var z = (isNil(zoom) ? this.getZoom() : zoom);
        var max = this._getResolution(this.getMaxZoom()),
            res = this._getResolution(z);
        return res / max;
    }

    /**
     * Set the map to be fit for the given extent with the max zoom level possible.
     * @param  {Extent} extent - extent
     * @param  {Number} zoomOffset - zoom offset
     * @return {Map} - this
     */
    fitExtent(extent, zoomOffset) {
        if (!extent) {
            return this;
        }
        zoomOffset = zoomOffset || 0;
        var zoom = this.getFitZoom(extent);
        zoom += zoomOffset;
        var center = new Extent(extent).getCenter();
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
    setBaseLayer(baseLayer) {
        var isChange = false;
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
        if (baseLayer instanceof TileLayer) {
            baseLayer.config({
                'renderWhenPanning': true
            });
            if (!baseLayer.options['tileSystem']) {
                baseLayer.config('tileSystem', TileSystem.getDefault(this.getProjection()));
            }
        }
        baseLayer._bindMap(this, -1);
        this._baseLayer = baseLayer;

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
    getLayers(filter) {
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
    getLayer(id) {
        if (!id || !this._layerCache || !this._layerCache[id]) {
            return null;
        }
        return this._layerCache[id];
    }

    /**
     * Add a new layer on the top of the map.
     * @param  {Layer|Layer[]} layer - one or more layers to add
     * @return {Map} this
     * @fires Map#addlayer
     */
    addLayer(layers) {
        if (!layers) {
            return this;
        }
        if (!Array.isArray(layers)) {
            return this.addLayer([layers]);
        }
        if (!this._layerCache) {
            this._layerCache = {};
        }
        for (var i = 0, len = layers.length; i < len; i++) {
            var layer = layers[i];
            var id = layer.getId();
            if (isNil(id)) {
                throw new Error('Invalid id for the layer: ' + id);
            }
            if (this._layerCache[id]) {
                throw new Error('Duplicate layer id in the map: ' + id);
            }
            this._layerCache[id] = layer;
            layer._bindMap(this, this._layers.length);
            this._layers.push(layer);
            if (this._loaded) {
                layer.load();
            }
        }
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
    removeLayer(layers) {
        if (!layers) {
            return this;
        }
        if (!Array.isArray(layers)) {
            return this.removeLayer([layers]);
        }
        for (var i = 0, len = layers.length; i < len; i++) {
            var layer = layers[i];
            if (!(layer instanceof Layer)) {
                layer = this.getLayer(layer);
            }
            if (!layer) {
                continue;
            }
            var map = layer.getMap();
            if (!map || map !== this) {
                continue;
            }
            this._removeLayer(layer, this._layers);
            if (this._loaded) {
                layer._doRemove();
            }
            var id = layer.getId();
            if (this._layerCache) {
                delete this._layerCache[id];
            }
            layer.fire('remove');
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
    sortLayers(layers) {
        if (!layers || !Array.isArray(layers)) {
            return this;
        }
        var layersToOrder = [];
        var minZ = Number.MAX_VALUE;
        for (var i = 0; i < layers.length; i++) {
            var layer = layers[i];
            if (isString(layers[i])) {
                layer = this.getLayer(layer);
            }
            if (!(layer instanceof Layer) || !layer.getMap() || layer.getMap() !== this) {
                throw new Error('It must be a layer added to this map to order.');
            }
            if (layer.getZIndex() < minZ) {
                minZ = layer.getZIndex();
            }
            layersToOrder.push(layer);
        }
        for (var ii = 0; ii < layersToOrder.length; ii++) {
            layersToOrder[ii].setZIndex(minZ + ii);
        }
        return this;
    }

    /**
     * Exports image from the map's canvas.
     * @param {Object} [options=undefined] - options
     * @param {String} [options.mimeType=image/png] - mime type of the image
     * @param {Boolean} [options.save=false] - whether pop a file save dialog to save the export image.
     * @param {String} [options.filename=export] - specify the file name, if options.save is true.
     * @return {String} image of base64 format.
     */
    toDataURL(options) {
        if (!options) {
            options = {};
        }
        var mimeType = options['mimeType'];
        if (!mimeType) {
            mimeType = 'image/png';
        }
        var save = options['save'];
        var renderer = this._getRenderer();
        if (renderer && renderer.toDataURL) {
            var file = options['filename'];
            if (!file) {
                file = 'export';
            }
            var dataURL = renderer.toDataURL(mimeType);
            if (save && dataURL) {
                var imgURL = dataURL;

                var dlLink = document.createElement('a');
                dlLink.download = file;
                dlLink.href = imgURL;
                dlLink.dataset.downloadurl = [mimeType, dlLink.download, dlLink.href].join(':');

                document.body.appendChild(dlLink);
                dlLink.click();
                document.body.removeChild(dlLink);
            }
            return dataURL;
        }
        return null;
    }


    /**
     * Converts a coordinate to the 2D point in current zoom or in the specific zoom. <br>
     * The 2D point's coordinate system's origin is the same with map's origin.
     * @param  {Coordinate} coordinate - coordinate
     * @param  {Number} [zoom=undefined]       - zoom level
     * @return {Point}  2D point
     * @example
     * var point = map.coordinateToPoint(new Coordinate(121.3, 29.1));
     */
    coordinateToPoint(coordinate, zoom) {
        var prjCoord = this.getProjection().project(coordinate);
        return this._prjToPoint(prjCoord, zoom);
    }

    /**
     * Converts a 2D point in current zoom or a specific zoom to a coordinate.
     * @param  {Point} point - 2D point
     * @param  {Number} zoom  - zoom level
     * @return {Coordinate} coordinate
     * @example
     * var coord = map.pointToCoordinate(new Point(4E6, 3E4));
     */
    pointToCoordinate(point, zoom) {
        var prjCoord = this._pointToPrj(point, zoom);
        return this.getProjection().unproject(prjCoord);
    }

    /**
     * Converts a geographical coordinate to view point.<br>
     * A view point is a point relative to map's mapPlatform panel's position. <br>
     * @param {Coordinate} coordinate
     * @return {Point}
     */
    coordinateToViewPoint(coordinate) {
        return this._prjToViewPoint(this.getProjection().project(coordinate));
    }

    /**
     * Converts a view point to the geographical coordinate.
     * @param {Point} viewPoint
     * @return {Coordinate}
     */
    viewPointToCoordinate(viewPoint) {
        return this.getProjection().unproject(this._viewPointToPrj(viewPoint));
    }

    /**
     * Convert a geographical coordinate to the container point. <br>
     *  A container point is a point relative to map container's top-left corner. <br>
     * @param {Coordinate}
     * @return {Point}
     */
    coordinateToContainerPoint(coordinate) {
        var pCoordinate = this.getProjection().project(coordinate);
        return this._prjToContainerPoint(pCoordinate);
    }

    /**
     * Converts a container point to geographical coordinate.
     * @param {Point}
     * @return {Coordinate}
     */
    containerPointToCoordinate(containerPoint) {
        var pCoordinate = this._containerPointToPrj(containerPoint);
        return this.getProjection().unproject(pCoordinate);
    }

    /**
     * Converts a container point to the view point.
     *
     * @param {Point}
     * @returns {Point}
     */
    containerPointToViewPoint(containerPoint) {
        return containerPoint.substract(this.offsetPlatform());
    }

    /**
     * Converts a view point to the container point.
     *
     * @param {Point}
     * @returns {Point}
     */
    viewPointToContainerPoint(viewPoint) {
        return viewPoint.add(this.offsetPlatform());
    }

    /**
     * Converts a container point extent to the geographic extent.
     * @param  {PointExtent} containerExtent - containeproints extent
     * @return {Extent}  geographic extent
     */
    containerToExtent(containerExtent) {
        var extent2D = new PointExtent(
            this._containerPointToPoint(containerExtent.getMin()),
            this._containerPointToPoint(containerExtent.getMax())
        );
        return this._pointToExtent(extent2D);
    }

    /**
     * Checks if the map container size changed and updates the map if so.
     * @return {Map} this
     * @fires Map#resize
     */
    checkSize() {
        const justStart = ((now() - this._initTime) < 1500) && this.width === 0 || this.height === 0;

        const watched = this._getContainerDomSize(),
            oldHeight = this.height,
            oldWidth = this.width;
        if (watched['width'] === oldWidth && watched['height'] === oldHeight) {
            return this;
        }
        const center = this.getCenter();
        this._updateMapSize(watched);
        let resizeOffset = new Point((oldWidth - watched.width) / 2, (oldHeight - watched.height) / 2);
        this._offsetCenterByPixel(resizeOffset);

        const hided = (watched['width'] === 0 ||  watched['height'] === 0 || oldWidth === 0 || oldHeight === 0);

        if (justStart || hided) {
            this._eventSuppressed = true;
            this.setCenter(center);
            this._eventSuppressed = false;
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
     * Converts geographical distances to the pixel length.<br>
     * The value varis with difference zoom level.
     *
     * @param  {Number} xDist - distance on X axis.
     * @param  {Number} yDist - distance on Y axis.
     * @return {Size} result.width: pixel length on X axis; result.height: pixel length on Y axis
     */
    distanceToPixel(xDist, yDist, zoom) {
        const projection = this.getProjection();
        if (!projection) {
            return null;
        }
        const scale = this.getScale();
        const center = this.getCenter(),
            target = projection.locate(center, xDist, yDist);
        const p0 = this.coordinateToContainerPoint(center, zoom),
            p1 = this.coordinateToContainerPoint(target, zoom);
        p1._sub(p0)._multi(scale)._abs();
        return new Size(p1.x, p1.y);
    }

    /**
     * Converts pixel size to geographical distance.
     *
     * @param  {Number} width - pixel width
     * @param  {Number} height - pixel height
     * @return {Number}  distance - Geographical distance
     */
    pixelToDistance(width, height, zoom) {
        const projection = this.getProjection();
        if (!projection) {
            return null;
        }
        // const center = this.getCenter();
        // const target = this.containerPointToCoordinate(new Point(this.width / 2 + width, this.height / 2 + height));
        var center = this.getCenter(),
            pcenter = this._getPrjCenter(),
            res = this._getResolution(zoom);
        var pTarget = new Coordinate(pcenter.x + width * res, pcenter.y + height * res);
        var target = projection.unproject(pTarget);
        return projection.measureLength(target, center);
    }

    /**
     * Computes the coordinate from the given meter distance.
     * @param  {Coordinate} coordinate - source coordinate
     * @param  {Number} dx           - meter distance on X axis
     * @param  {Number} dy           - meter distance on Y axis
     * @return {Coordinate} Result coordinate
     */
    locate(coordinate, dx, dy) {
        return this.getProjection().locate(new Coordinate(coordinate), dx, dy);
    }

    /**
     * Computes the coordinate from the given pixel distance.
     * @param  {Coordinate} coordinate - source coordinate
     * @param  {Number} px           - pixel distance on X axis
     * @param  {Number} py           - pixel distance on Y axis
     * @return {Coordinate} Result coordinate
     */
    locateByPoint(coordinate, px, py) {
        const point = this.coordinateToPoint(coordinate);
        return this.pointToCoordinate(point._add(px, py));
    }

    /**
     * Return map's main panel
     * @returns {HTMLElement}
     */
    getMainPanel() {
        return this._getRenderer().getMainPanel();
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
        this._registerDomEvents(true);
        this._clearHandlers();
        this.removeBaseLayer();
        var layers = this.getLayers();
        for (var i = 0; i < layers.length; i++) {
            layers[i].remove();
        }
        if (this._getRenderer()) {
            this._getRenderer().remove();
        }
        this._clearAllListeners();
        if (this._containerDOM.innerHTML) {
            this._containerDOM.innerHTML = '';
        }
        delete this._panels;
        delete this._containerDOM;
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
    onMoveStart(param) {
        this._originCenter = this.getCenter();
        this._enablePanAnimation = false;
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
        this._fireEvent('moveend', this._parseEvent(param ? param['domEvent'] : null, 'moveend'));
        if (!this._verifyExtent(this.getCenter())) {
            var moveTo = this._originCenter;
            if (!this._verifyExtent(moveTo)) {
                moveTo = this.getMaxExtent().getCenter();
            }
            this.panTo(moveTo);
        }
    }

    //-----------------------------------------------------------
    /**
     * try to change cursor when map is not setCursored
     * @private
     * @param  {String} cursor css cursor
     */
    _trySetCursor(cursor) {
        if (!this._cursor && !this._priorityCursor) {
            if (!cursor) {
                cursor = 'default';
            }
            this._setCursorToPanel(cursor);
        }
        return this;
    }

    _setPriorityCursor(cursor) {
        if (!cursor) {
            var hasCursor = false;
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

    _setCursorToPanel(cursor) {
        var panel = this.getMainPanel();
        if (panel && panel.style && panel.style.cursor !== cursor) {
            panel.style.cursor = cursor;
        }
    }

    /**
     * Get map's extent in view points.
     * @param {Number} zoom - zoom
     * @return {PointExtent}
     * @private
     */
    _get2DExtent(zoom) {
        var c1 = this._containerPointToPoint(new Point(0, 0), zoom),
            c2 = this._containerPointToPoint(new Point(this.width, 0), zoom),
            c3 = this._containerPointToPoint(new Point(this.width, this.height), zoom),
            c4 = this._containerPointToPoint(new Point(0, this.height), zoom);
        var xmin = Math.min(c1.x, c2.x, c3.x, c4.x),
            xmax = Math.max(c1.x, c2.x, c3.x, c4.x),
            ymin = Math.min(c1.y, c2.y, c3.y, c4.y),
            ymax = Math.max(c1.y, c2.y, c3.y, c4.y);
        return new PointExtent(xmin, ymin, xmax, ymax);
    }

    /**
     * Converts a view point extent to the geographic extent.
     * @param  {PointExtent} extent2D - view points extent
     * @return {Extent}  geographic extent
     * @protected
     */
    _pointToExtent(extent2D) {
        return new Extent(
            this.pointToCoordinate(extent2D.getMin()),
            this.pointToCoordinate(extent2D.getMax())
        );
    }

    _setPrjCenterAndMove(pcenter) {
        var offset = this._getPixelDistance(pcenter);
        this._setPrjCenter(pcenter);
        this.offsetPlatform(offset);
    }

    //remove a layer from the layerList
    _removeLayer(layer, layerList) {
        if (!layer || !layerList) {
            return;
        }
        var index = layerList.indexOf(layer);
        if (index > -1) {
            layerList.splice(index, 1);

            for (var j = 0, jlen = layerList.length; j < jlen; j++) {
                if (layerList[j].setZIndex) {
                    layerList[j].setZIndex(j);
                }
            }
        }
    }

    _sortLayersByZIndex(layerList) {
        layerList.sort(function (a, b) {
            return a.getZIndex() - b.getZIndex();
        });
    }

    /**
     * Gets pixel lenth from pcenter to map's current center.
     * @param  {Coordinate} pcenter - a projected coordinate
     * @return {Point}
     * @private
     */
    _getPixelDistance(pCoord) {
        var center = this._getPrjCenter();
        var pxCenter = this._prjToContainerPoint(center);
        var pxCoord = this._prjToContainerPoint(pCoord);
        var dist = new Point(-pxCoord.x + pxCenter.x, pxCenter.y - pxCoord.y);
        return dist;
    }

    _fireEvent(eventName, param) {
        if (this._eventSuppressed) {
            return;
        }
        //fire internal events at first
        this.fire('_' + eventName, param);
        this.fire(eventName, param);
    }

    _Load() {
        this._resetMapStatus();
        this._registerDomEvents();
        this._loadAllLayers();
        this._getRenderer().onLoad();
        if (this.options['pitch']) {
            this.setPitch(this.options['pitch']);
            delete this.options['pitch'];
        }
        this._loaded = true;
        this._callOnLoadHooks();
        this._initTime = now();
        /**
         * load event, fired when the map completes loading.
         *
         * @event Map#load
         * @type {Object}
         * @property {String} type - load
         * @property {Map} target - map
         */
        this._fireEvent('load');
    }

    _initRenderer() {
        var renderer = this.options['renderer'];
        var clazz = Map.getRendererClass(renderer);
        this._renderer = new clazz(this);
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
    _getLayers(filter) {
        var layers = this._baseLayer ? [this._baseLayer].concat(this._layers) : this._layers;
        var result = [];
        for (var i = 0; i < layers.length; i++) {
            if (!filter || filter.call(this, layers[i])) {
                result.push(layers[i]);
            }
        }
        return result;
    }

    _eachLayer(fn) {
        if (arguments.length < 2) {
            return;
        }
        var layerLists = Array.prototype.slice.call(arguments, 1);
        if (layerLists && !Array.isArray(layerLists)) {
            layerLists = [layerLists];
        }
        var layers = [];
        for (var i = 0, len = layerLists.length; i < len; i++) {
            layers = layers.concat(layerLists[i]);
        }
        for (var j = 0, jlen = layers.length; j < jlen; j++) {
            fn.call(fn, layers[j]);
        }
    }

    //Check and reset map's status when map'sview is changed.
    _resetMapStatus() {
        var maxZoom = this.getMaxZoom(),
            minZoom = this.getMinZoom();
        var viewMaxZoom = this._view.getMaxZoom(),
            viewMinZoom = this._view.getMinZoom();
        if (!maxZoom || maxZoom === -1 || maxZoom > viewMaxZoom) {
            this.setMaxZoom(viewMaxZoom);
        }
        if (!minZoom || minZoom === -1 || minZoom < viewMinZoom) {
            this.setMinZoom(viewMinZoom);
        }
        maxZoom = this.getMaxZoom();
        minZoom = this.getMinZoom();
        if (maxZoom < minZoom) {
            this.setMaxZoom(minZoom);
        }
        if (!this._zoomLevel || this._zoomLevel > maxZoom) {
            this._zoomLevel = maxZoom;
        }
        if (this._zoomLevel < minZoom) {
            this._zoomLevel = minZoom;
        }
        delete this._prjCenter;
        var projection = this.getProjection();
        this._prjCenter = projection.project(this._center);
    }

    _getContainerDomSize() {
        if (!this._containerDOM) {
            return null;
        }
        var containerDOM = this._containerDOM,
            width, height;
        if (!isNil(containerDOM.width) && !isNil(containerDOM.height)) {
            width = containerDOM.width;
            height = containerDOM.height;
            if (Browser.retina && containerDOM['layer']) {
                //is a canvas tile of CanvasTileLayer
                width /= 2;
                height /= 2;
            }
        } else if (!isNil(containerDOM.clientWidth) && !isNil(containerDOM.clientHeight)) {
            width = parseInt(containerDOM.clientWidth, 0);
            height = parseInt(containerDOM.clientHeight, 0);
        } else {
            throw new Error('can not get size of container');
        }
        return new Size(width, height);
    }

    _updateMapSize(mSize) {
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

    _setPrjCenter(pcenter) {
        this._prjCenter = pcenter;
        this._calcMatrices();
    }

    _verifyExtent(center) {
        if (!center) {
            return false;
        }
        var maxExt = this.getMaxExtent();
        if (!maxExt) {
            return true;
        }
        return maxExt.contains(center);
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
    _offsetCenterByPixel(pixel) {
        var pos = new Point(this.width / 2 - pixel.x, this.height / 2 - pixel.y);
        var pCenter = this._containerPointToPrj(pos);
        this._setPrjCenter(pCenter);
        return pCenter;
    }

    /**
     * offset map platform panel.
     *
     * @param  {Point} offset - offset in pixel to move
     * @return {Map} this
     */
    /**
     * Gets map platform panel's current view point.
     * @return {Point}
     */
    offsetPlatform(offset) {
        if (!offset) {
            return this._mapViewPoint;
        } else {
            this._getRenderer().offsetPlatform(offset);
            this._mapViewPoint = this._mapViewPoint.add(offset);
            return this;
        }
    }

    _resetMapViewPoint() {
        this._mapViewPoint = new Point(0, 0);
    }

    /**
     * Get map's current resolution
     * @return {Number} resolution
     * @private
     */
    _getResolution(zoom) {
        if (isNil(zoom)) {
            zoom = this.getZoom();
        }
        return this._view.getResolution(zoom);
    }

    _getResolutions() {
        return this._view.getResolutions();
    }

    /**
     * Converts the projected coordinate to a 2D point in the specific zoom
     * @param  {Coordinate} pCoord - projected Coordinate
     * @param  {Number} zoom   - zoom level
     * @return {Point} 2D point
     * @private
     */
    _prjToPoint(pCoord, zoom) {
        zoom = (isNil(zoom) ? this.getZoom() : zoom);
        return this._view.getTransformation().transform(pCoord, this._getResolution(zoom));
    }

    /**
     * Converts the 2D point to projected coordinate
     * @param  {Point} point - 2D point
     * @param  {Number} zoom   - zoom level
     * @return {Coordinate} projected coordinate
     * @private
     */
    _pointToPrj(point, zoom) {
        zoom = (isNil(zoom) ? this.getZoom() : zoom);
        return this._view.getTransformation().untransform(point, this._getResolution(zoom));
    }

    /**
     * Convert point at zoom to point at current zoom
     * @param  {Point} point point
     * @param  {Number} zoom point's zoom
     * @return {Point} point at current zoom
     * @private
     */
    _pointToPoint(point, zoom) {
        if (!isNil(zoom)) {
            return point.multi(this._getResolution(zoom) / this._getResolution());
        }
        return point.copy();
    }

    /**
     * transform container point to geographical projected coordinate
     *
     * @param  {Point} containerPoint
     * @return {Coordinate}
     * @private
     */
    _containerPointToPrj(containerPoint) {
        return this._pointToPrj(this._containerPointToPoint(containerPoint));
    }

    /**
     * transform view point to geographical projected coordinate
     * @param  {Point} viewPoint
     * @return {Coordinate}
     * @private
     */
    _viewPointToPrj(viewPoint) {
        return this._containerPointToPrj(this.viewPointToContainerPoint(viewPoint));
    }

    /**
     * transform geographical projected coordinate to container point
     * @param  {Coordinate} pCoordinate
     * @return {Point}
     * @private
     */
    _prjToContainerPoint(pCoordinate) {
        return this._pointToContainerPoint(this._prjToPoint(pCoordinate));
    }

    /**
     * transform geographical projected coordinate to view point
     * @param  {Coordinate} pCoordinate
     * @return {Point}
     * @private
     */
    _prjToViewPoint(pCoordinate) {
        var containerPoint = this._prjToContainerPoint(pCoordinate);
        return this._containerPointToViewPoint(containerPoint);
    }

    //destructive containerPointToViewPoint
    _containerPointToViewPoint(containerPoint) {
        if (!containerPoint) {
            return null;
        }
        var platformOffset = this.offsetPlatform();
        return containerPoint._sub(platformOffset);
    }

    _viewPointToPoint(viewPoint, zoom) {
        return this._containerPointToPoint(this.viewPointToContainerPoint(viewPoint), zoom);
    }

    _pointToViewPoint(point, zoom) {
        return this._prjToViewPoint(this._pointToPrj(point, zoom));
    }

    /* eslint no-extend-native: 0 */
    _callOnLoadHooks() {
        const proto = Map.prototype;
        for (let i = 0, l = proto._onLoadHooks.length; i < l; i++) {
            proto._onLoadHooks[i].call(this);
        }
    }
}

Map.mergeOptions(options);

export default Map;
