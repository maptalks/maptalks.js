/**
 *
 * @class
 * @category map
 * @extends {maptalks.Class}
 *
 * @param {(string|HTMLElement|object)} container - The container to create the map on, can be:<br>
 *                                          1. A HTMLElement container.<br/>
 *                                          2. ID of a HTMLElement container.<br/>
 *                                          3. A canvas compatible container in node,
 *                                          e.g. [node-canvas]{@link https://github.com/Automattic/node-canvas},
 *                                              [canvas2svg]{@link https://github.com/gliffy/canvas2svg}
 * @param {Object} options - construct options
 * @param {(Number[]|maptalks.Coordinate)} options.center - initial center of the map.
 * @param {Number} options.zoom - initial zoom of the map.
 * @param {Object} [options.view=null] - map's view state, default is the common-used by google map or osm<br/>
 *                               use projection EPSG:3857 with resolutions
 * @param {maptalks.Layer} [options.baseLayer=null] - base layer that will be set to map initially.
 * @param {maptalks.Layer[]} [options.layers=null] - layers that will be added to map initially.
 * @param {*} options.* - any other option defined in [Map.options]{@link maptalks.Map#options}
 *
 * @mixes maptalks.Eventable
 * @mixes maptalks.Handlerable
 * @mixes maptalks.Renderable
 * @mixins maptalks.ui.Menu.Mixin
 *
 * @fires maptalks.Map#load
 * @fires maptalks.Map#viewchange
 * @fires maptalks.Map#baselayerload
 * @fires maptalks.Map#baselayerchangestart
 * @fires maptalks.Map#baselayerchangeend
 * @fires maptalks.Map#resize
 * @fires maptalks.Map#movestart
 * @fires maptalks.Map#moving
 * @fires maptalks.Map#moveend
 * @classdesc
 * The central class of the library, to create a map on a container.
 * @example
 * var map = new maptalks.Map("map",{
        center:     [180,0],
        zoom:  4,
        baseLayer : new maptalks.TileLayer("base",{
            urlTemplate:'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
            subdomains:['a','b','c']
        })
    });
 */
Z.Map=Z.Class.extend(/** @lends maptalks.Map.prototype */{

    includes: [Z.Eventable,Z.Handlerable],

    /**
     * @property {Object} options                                   - map's options, options must be updated by config method, eg: map.config('zoomAnimation', false);
     * @property {Boolean} [options.clipFullExtent=false]           - clip geometries outside map's full extent
     * @property {Boolean} [options.zoomAnimation=true]             - enable zooming animation
     * @property {Number}  [options.zoomAnimationDuration=250]      - zoom animation duration.
     * @property {Boolean} [options.zoomBackground=true]            - leaves a background after zooming.
     * @property {Boolean} [options.layerZoomAnimation=true]        - also animate layers when zooming.
     * @property {Boolean} [options.updatePointsWhileTransforming=true] - update points when transforming (e.g. zoom animation), this may bring drastic low performance when rendering a large number of points.
     * @property {Boolean} [options.panAnimation=true]              - continue to animate panning when draging or touching ended.
     * @property {Boolean} [options.panAnimationDuration=600]       - duration of pan animation.
     * @property {Boolean} [options.enableZoom=true]                - whether to enable map zooming.
     * @property {Boolean} [options.enableInfoWindow=true]          - whether to enable infowindow opening on this map.
     * @property {Boolean} [options.maxZoom=null]                   - the maximum zoom the map can be zooming to.
     * @property {Boolean} [options.minZoom=null]                   - the minimum zoom the map can be zooming to.
     * @property {maptalks.Extent} [options.maxExtent=null]         - when maxExtent is set, map will be restricted to the give max extent and bouncing back when user trying to pan ouside the extent.
     *
     * options merged from handlers:
     * @property {Boolean} [options.draggable=true]                         - disable the map dragging if set to false.
     * @property {Boolean} [options.doublClickZoom=true]                    - whether to allow map to zoom by double click events.
     * @property {Boolean} [options.scrollWheelZoom=true]                   - whether to allow map to zoom by scroll wheel events.
     * @property {Boolean} [options.touchZoom=true]                         - whether to allow map to zoom by touch events.
     * @property {Boolean} [options.autoBorderPanning=false]                - whether to pan the map automatically if mouse moves on the border of the map
     * @property {Boolean} [options.geometryEvents=false]                   - enable/disable firing geometry events
     *
     * options merged from controls:
     * @property {Boolean|Object} [options.attributionControl=false]        - display the attribution control on the map if set to true or a object as the control construct option.
     * @property {Boolean|Object} [options.zoomControl=false]               - display the zoom control on the map if set to true or a object as the control construct option.
     * @property {Boolean|Object} [options.scaleControl=false]              - display the scale control on the map if set to true or a object as the control construct option.
     *
     * @property {String} [options.renderer=canvas]                 - renderer type. Don't change it if you are not sure about it. About renderer, see [TODO]{@link tutorial.renderer}.
     */
    options:{
        'clipFullExtent' : false,

        'zoomAnimation' : true,
        'zoomAnimationDuration' : 250,
        //still leave background after zooming, set it to false if baseLayer is a transparent layer
        'zoomBackground' : true,
        //controls whether other layers than base tilelayer will show during zoom animation.
        'layerZoomAnimation' : true,

        //economically transform, whether point symbolizers transforms during transformation (e.g. zoom animation)
        //set to true can prevent drastic low performance when number of point symbolizers is large.
        'updatePointsWhileTransforming' : false,

        'panAnimation':true,
        //default pan animation duration
        'panAnimationDuration' : 600,

        'enableZoom':true,
        'enableInfoWindow':true,

        'maxZoom' : null,
        'minZoom' : null,
        'maxExtent' : null,

        'renderer' : 'canvas'
    },

    //Exception definitions in English and Chinese.
    exceptionDefs:{
        'en-US':{
            'INVALID_OPTION':'Invalid options provided.',
            'INVALID_CENTER':'Invalid Center',
            'INVALID_LAYER_ID':'Invalid id for the layer',
            'DUPLICATE_LAYER_ID':'the id of the layer is duplicate with another layer'
        },
        'zh-CN':{
            'INVALID_OPTION':'无效的option.',
            'INVALID_CENTER':'无效的中心点',
            'INVALID_LAYER_ID':'图层的id无效',
            'DUPLICATE_LAYER_ID':'重复的图层id'
        }
    },


    initialize:function(container, options) {

        if (!options) {
            throw new Error(this.exceptions['INVALID_OPTION']);
        }

        if (!options['center']) {
            throw new Error(this.exceptions['INVALID_CENTER']);
        }

        this._loaded=false;
        this._container = container;

        if (Z.Util.isString(this._container)) {
            this._containerDOM = document.getElementById(this._container);
            if (!this._containerDOM) {
                throw new Error('invalid container: \''+container+'\'');
            }
        } else {
            this._containerDOM = container;
            if (Z.node) {
                //node环境中map的containerDOM即为模拟Canvas容器, 例如node-canvas
                //获取模拟Canvas类的类型, 用以在各图层的渲染器中构造Canvas
                this.CanvasClass = this._containerDOM.constructor;
            }
        }


        //Layer of Details, always derived from baseLayer
        this._panels={};

        //Layers
        this._baseLayer=null;
        this._layers = [];

        //shallow copy options
        var opts = Z.Util.extend({}, options);

        this._zoomLevel = opts['zoom'];
        delete opts['zoom'];
        this._center = new Z.Coordinate(opts['center']);
        delete opts['center'];

        var baseLayer = opts['baseLayer'];
        delete opts['baseLayer'];
        var layers = opts['layers'];
        delete opts['layers'];

        Z.Util.setOptions(this,opts);
        this.setView(opts['view']);

        if (baseLayer) {
            this.setBaseLayer(baseLayer);
        }
        if (layers) {
            this.addLayer(layers);
        }

        //a internal property to enable/disable panAnimation.
        this._enablePanAnimation = true;
        this._mapViewPoint=new Z.Point(0,0);

        this._initRenderer();
        this._getRenderer().initContainer();
        this._updateMapSize(this._getContainerDomSize());

        this._Load();
    },

    /**
     * Whether the map is loaded or not.
     * @return {Boolean}
     */
    isLoaded:function() {
        return this._loaded;
    },

    /**
     * Whether the map is rendered by canvas
     * @return {Boolean}
     * @protected
     * @example
     * var isCanvas = map.isCanvasRender();
     */
    isCanvasRender:function() {
        var renderer = this._getRenderer();
        if (renderer) {
            return renderer.isCanvasRender();
        }
        return false;
    },

    /**
     * Change the view of the map. <br>
     * A view is a series of settings to decide the map presentation:<br>
     * 1. the projection.<br>
     * 2. zoom levels and resolutions. <br>
     * 3. full extent.<br>
     * there are some [predefined views]{@link http://www.foo.com}, and surely you can [define a custom one.]{@link http://www.foo.com}
     * @param {Object} view - view settings
     * @returns {maptalks.Map} this
     */
    setView:function(view) {
        var oldView = this._view;
        if (oldView && !view) {
            return this;
        }
        this._center = this.getCenter();
        this.options['view'] =  view;
        this._view = new Z.View(view);
        if (this.options['view'] && Z.Util.isFunction(this.options['view']['projection'])) {
            var projection = this._view.getProjection();
            //save projection code for map profiling (toJSON/fromJSON)
            this.options['view']['projection'] = projection['code'];
        }
        this._resetMapStatus();
        this._fireEvent('viewchange');
        return this;
    },

    /**
     * Callback when any option is updated
     * @private
     * @param  {Object} conf - options to update
     * @return {maptalks.Map}   this
     */
    onConfig:function(conf) {
        if (!Z.Util.isNil(conf['view'])) {
            this.setView(conf['view']);
        }
        return this;
    },

    /**
     * Get the projection of the map. <br>
     * Projection is an algorithm for map projection, e.g. well-known [Mercator Projection]{@link https://en.wikipedia.org/wiki/Mercator_projection}
     * @return {Object}
     */
    getProjection:function() {
        return this._view.getProjection();
    },

    /**
     * Get map's full extent, e.g. the world's full extent. <br>
     * Any geometries outside this extent will be clipped if clipFullExtent options is set true
     * @return {maptalks.Extent}
     */
    getFullExtent:function() {
        return this._view.getFullExtent();
    },

    /**
     * Set map's cursor style, same with CSS.
     * @param {String} cursor - cursor style
     * @returns {maptalks.Map} this
     */
    setCursor:function(cursor) {
        delete this._cursor;
        this._trySetCursor(cursor);
        this._cursor = cursor;
        return this;
    },

    /**
     * Get center of the map.
     * @return {maptalks.Coordinate}
     */
    getCenter:function() {
        if (!this._loaded || !this._prjCenter) {return this._center;}
        var projection = this.getProjection();
        return projection.unproject(this._prjCenter);
    },

    /**
     * Set a new center to the map.
     * @param {maptalks.Coordinate} center
     * @return {maptalks.Map} this
     */
    setCenter:function(center) {
        if (!center) {
            return this;
        }
        if (!this._verifyExtent(center)) {
            return this;
        }
        center = new Z.Coordinate(center);
        if (!this._loaded) {
            this._center = center;
            return this;
        }
        if (this._loaded && !this._center.equals(center)) {
            this._onMoveStart();
        }
        var projection = this.getProjection();
        var _pcenter = projection.project(center);
        this._setPrjCenterAndMove(_pcenter);
        this._onMoveEnd();
        return this;
    },

    /**
     * Get map's size (width and height) in pixel.
     * @return {maptalks.Size}
     */
    getSize:function() {
        if (Z.Util.isNil(this.width) || Z.Util.isNil(this.height)) {
            return this._getContainerDomSize();
        }
        return new Z.Size(this.width, this.height);
    },

    /**
     * Get the geographical extent of map's current view extent.
     *
     * @return {maptalks.Extent}
     */
    getExtent:function() {
        var projection = this.getProjection();
        if (!projection) {
            return null;
        }
        var res = this._getResolution();
        if (Z.Util.isNil(res)) {
            return null;
        }
        var size = this.getSize();
        var w = size['width']/2,
            h = size['height']/2;
        var prjCenter = this._getPrjCenter();
        var c1 = projection.unproject(new Z.Coordinate(prjCenter.x - w*res, prjCenter.y + h*res));
        var c2 = projection.unproject(new Z.Coordinate(prjCenter.x + w*res, prjCenter.y - h*res));
        return new Z.Extent(c1,c2);
    },

    /**
     * Get the max extent that the map is restricted to.
     * @return {maptalks.Extent}
     */
    getMaxExtent:function() {
        if (!this.options['maxExtent']) {
            return null;
        }
        return this.options['maxExtent'].copy();
    },

    /**
     * Sets the max extent that the map is restricted to.
     * @param {maptalks.Extent}
     * @return {maptalks.Map} this
     */
    setMaxExtent:function(extent) {
        if (extent) {
            var maxExt = new Z.Extent(extent);
            this.options['maxExtent'] = maxExt;
            var center = this.getCenter();
            if (!this._verifyExtent(center)) {
                this.panTo(maxExt.getCenter());
            }
        } else {
            delete this.options['maxExtent'];
        }
        return this;
    },

    /**
     * Get map's current zoom.
     * @return {Number}
     */
    getZoom:function() {
        return this._zoomLevel;
    },

    /**
     * Caculate the target zoom if scaling from "fromZoom" by "scale"
     * @param  {Number} scale
     * @param  {Number} fromZoom
     * @return {Number}
     */
    getZoomForScale:function(scale, fromZoom) {
        if (Z.Util.isNil(fromZoom)) {
            fromZoom = this.getZoom();
        }
        var res = this._getResolution(fromZoom),
            resolutions = this._getResolutions(),
            min = Number.MAX_VALUE,
            hit = -1;
        for (var i = resolutions.length - 1; i >= 0; i--) {
            var test = Math.abs(res/resolutions[i]-scale);
            if (test < min) {
                min = test;
                hit = i;
            }
        }
        return hit;
    },

    /**
     * Sets the zoom of the map
     * @param {Number} zoom
     * @returns {maptalks.Map} this
     */
    setZoom:function(zoom) {
        if (this.options['zoomAnimation']) {
            this._zoomAnimation(zoom);
        } else {
            this._zoom(zoom);
        }
        return this;
    },

    /**
     * Get the max zoom that the map can be zoom to.
     * @return {Number}
     */
    getMaxZoom:function() {
        return this.options['maxZoom'];
    },

    /**
     * Sets the max zoom that the map can be zoom to.
     * @param {Number} maxZoom
     * @returns {maptalks.Map} this
     */
    setMaxZoom:function(maxZoom) {
        var viewMaxZoom = this._view.getMaxZoom();
        if (maxZoom > viewMaxZoom) {
            maxZoom = viewMaxZoom;
        }
        if (maxZoom < this._zoomLevel) {
            this.setZoom(maxZoom);
        }
        this.options['maxZoom'] = maxZoom;
        return this;
    },

    /**
     * Get the min zoom that the map can be zoom to.
     * @return {Number}
     */
    getMinZoom:function() {
        return this.options['minZoom'];
    },

    /**
     * Sets the min zoom that the map can be zoom to.
     * @param {Number} minZoom
     * @return {maptalks.Map} this
     */
    setMinZoom:function(minZoom) {
        var viewMinZoom = this._view.getMinZoom();
        if (minZoom < viewMinZoom) {
            minZoom = viewMinZoom;
        }
        this.options['minZoom']=minZoom;
        return this;
    },

    /**
     * zoom in
     * @return {maptalks.Map} this
     */
    zoomIn: function() {
        this.setZoom(this.getZoom() + 1);
        return this;
    },

    /**
     * zoom out
     * @return {maptalks.Map} this
     */
    zoomOut: function() {
        this.setZoom(this.getZoom() - 1);
        return this;
    },

    /**
     * Sets the center and zoom at the same time.
     * @param {maptalks.Coordinate} center
     * @param {Number} zoomLevel
     * @return {maptalks.Map} this
     */
    setCenterAndZoom:function(center,zoomLevel) {
        if (this._zoomLevel != zoomLevel) {
            this.setCenter(center);
            this.setZoom(zoomLevel);
        } else {
            this.setCenter(center);
        }
        return this;
    },


    /**
     * Caculate the zoom level that contains the given extent with the maximum zoom level possible.
     * @param {maptalks.Extent} extent
     * @return {Number}
     */
    getFitZoom: function(extent) {
        if (!extent || !(extent instanceof Z.Extent)) {
            return this._zoomLevel;
        }
        //点类型
        if (extent['xmin'] == extent['xmax'] && extent['ymin'] == extent['ymax']) {
            return this.getMaxZoom();
        }
        try {
            var projection = this.getProjection();
            var x = Math.abs(extent["xmin"] - extent["xmax"]);
            var y = Math.abs(extent["ymin"] - extent["ymax"]);
            var projectedExtent = projection.project({x:x, y:y});
            var resolutions = this._getResolutions();
            var xz = -1;
            var yz = -1;
            for ( var i = this.getMinZoom(), len = this.getMaxZoom(); i < len; i++) {
                if (Z.Util.round(projectedExtent.x / resolutions[i]) >= this.width) {
                    if (xz == -1) {
                        xz = i;
                    }
                }
                if (Z.Util.round(projectedExtent.y / resolutions[i]) >= this.height) {
                    if (yz == -1) {
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
            // return ret - 2;
            return ret;
        } catch (exception) {
            return this.getZoom();
        }
    },

    /**
     * Get the base layer of the map.
     * @return {maptalks.Layer}
     */
    getBaseLayer:function() {
        return this._baseLayer;
    },

    /**
     * Sets a new base layer to the map.<br>
     * Some events will be thrown such as baselayerchangestart, baselayerload, baselayerchangeend.
     * @param  {maptalks.Layer} baseLayer - new base layer
     * @return {maptalks.Map} this
     */
    setBaseLayer:function(baseLayer) {
        var isChange = false;
        if (this._baseLayer) {
            isChange = true;
            this._fireEvent('baselayerchangestart');
            this._baseLayer.remove();
        }
        if (baseLayer instanceof Z.TileLayer) {
            baseLayer.config({
                'renderWhenPanning':true
            });
            if (!baseLayer.options['tileSystem']) {
                baseLayer.config('tileSystem', Z.TileSystem.getDefault(this.getProjection()));
            }
        }
        baseLayer._bindMap(this,-1);
        this._baseLayer = baseLayer;
        function onbaseLayerload() {
            this._fireEvent('baselayerload');
            if (isChange) {
                isChange = false;
                this._fireEvent('baselayerchangeend');
            }
        }
        this._baseLayer.on('layerload',onbaseLayerload,this);
        if (this._loaded) {
            this._baseLayer.load();
        }
        return this;
    },

    /**
     * Get the layers of the map, not including base layer (by getBaseLayer). <br>
     * A filter function can be given to exclude certain layers, eg exclude all the VectorLayers.
     * @param {function} [filter=null] - a filter function of layers, return false to exclude the given layer.
     * @return {maptalks.Layer[]}
     */
    getLayers:function(filter) {
        return this._getLayers(function(layer) {
            if (layer === this._baseLayer || layer.getId().indexOf(Z.internalLayerPrefix) >= 0) {
                return false;
            }
            if (filter) {
                return filter(layer);
            }
            return true;
        });
    },

    /**
     * Get the layer with the given id.
     * @param  {String} id - layer id
     * @return {maptalks.Layer}
     */
    getLayer:function(id) {
        if (!id || !this._layerCache || !this._layerCache[id]) {
            return null;
        }
        return this._layerCache[id];
    },

    /**
     * Add a new layer on the top of the map.
     * @param  {maptalks.Layer} layer - Any valid layer object
     * @return {maptalks.Map} this
     */
    addLayer:function(layers){
        if (!layers) {
            return this;
        }
        if (!Z.Util.isArray(layers)) {
            return this.addLayer([layers]);
        }
        if (!this._layerCache) {
            this._layerCache = {};
        }
        for (var i=0,len=layers.length;i<len;i++) {
            var layer = layers[i];
            var id = layer.getId();
            if (Z.Util.isNil(id)) {
                throw new Error(this.exceptions['INVALID_LAYER_ID']+':'+id);
            }
            if (this._layerCache[id]) {
                throw new Error(this.exceptions['DUPLICATE_LAYER_ID']+':'+id);
            }
            this._layerCache[id] = layer;
            layer._bindMap(this, this._layers.length);
            this._layers.push(layer);
            if (this._loaded) {
                layer.load();
            }
        }
        return this;
    },

    /**
     * Remove a layer from the map
     * @param  {string|maptalks.Layer} layer - id of the layer or a layer object
     * @return {maptalks.Map} this
     */
    removeLayer: function(layer) {
        if (!(layer instanceof Z.Layer)) {
            layer = this.getLayer(layer);
        }
        if (!layer) {
            return this;
        }
        var map = layer.getMap();
        if (!map || map != this) {
            return this;
        }
        this._removeLayer(layer, this._layers);
        if (this._loaded) {
            layer._onRemove();
        }
        var id = layer.getId();
        if (this._layerCache) {
            delete this._layerCache[id];
        }
        return this;
    },

    /**
     * Sort layers according to the order provided, the last will be on the top.
     * @param  {string[]|maptalks.Layer[]} layers - layers or layer ids to sort
     * @return {maptalks.Map} this
     */
    sortLayers:function(layers) {
        if (!layers || !Z.Util.isArray(layers)) {
            return this;
        }
        var layersToOrder = [];
        var minZ = Number.MAX_VALUE;
        for (var i = 0; i < layers.length; i++) {
            var layer = layers[i];
            if (Z.Util.isString(layers[i])) {
                layer = this.getLayer(layer);
            }
            if (!(layer instanceof Z.Layer) || !layer.getMap() || layer.getMap() !== this) {
                throw new Error('It must be a layer added to this map to order.');
            }
            if (layer.getZIndex() < minZ) {
                minZ = layer.getZIndex();
            }
            layersToOrder.push(layer);
        }
        for (var ii = 0; ii < layersToOrder.length; ii++) {
            layersToOrder[ii].setZIndex(minZ+ii);
        }
        return this;
    },

    /**
     * Exports image from the map's canvas.
     * @param {Object} options - options
     * @param {String} [options.mimeType=image/png] - mime type of the image
     * @param {Boolean} [options.save=false] - whether pop a file save dialog to save the export image.
     * @param {String} [options.filename=export] - specify the file name, if options.save is true.
     * @return {String} image of base64 format.
     */
    toDataURL: function(options) {
        if (!options) {
            options = {};
        }
        var mimeType = options['mimeType'];
        if (!mimeType) {
            mimeType = "image/png";
        }
        var save = options['save'];
        var renderer = this._getRenderer();
        if (renderer) {
            var file = options['filename'];
            if (!file) {
                file = "export";
            }
            var dataURL =  renderer.toDataURL(mimeType);
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
    },

    /**
     * Converts a geographical coordinate to the [view point]{@link http://www.foo.com}.<br>
     * It is useful for placing overlays or ui controls on the map.
     * @param {maptalks.Coordinate} coordinate
     * @return {maptalks.Point}
     */
    coordinateToViewPoint: function(coordinate) {
        var projection = this.getProjection();
        if (!coordinate || !projection) {return null;}
        var pCoordinate = projection.project(coordinate);
        return this._transformToViewPoint(pCoordinate).round();
    },

    /**
     * Converts a view point to the geographical coordinate.
     * @param {maptalks.Point} viewPoint
     * @return {maptalks.Coordinate}
     */
    viewPointToCoordinate: function(viewPoint) {
        var projection = this.getProjection();
        if (!viewPoint || !projection) {return null;}
        var p = this._untransformFromViewPoint(viewPoint);
        var c = projection.unproject(p);
        return c;
    },

    /**
     * Convert a geographical coordinate to the container point.
     * @param {maptalks.Coordinate}
     * @return {maptalks.Point}
     */
    coordinateToContainerPoint: function(coordinate) {
        var projection = this.getProjection();
        if (!coordinate || !projection) {return null;}
        var pCoordinate = projection.project(coordinate);
        var offset = this._transform(pCoordinate);
        return offset.round();
    },

    /**
     * Converts a container point to geographical coordinate.
     * @param {maptalks.Point}
     * @return {maptalks.Coordinate}
     */
    containerPointToCoordinate: function(containerPoint) {
        var projection = this.getProjection();
        if (!containerPoint || !projection) {return null;}
        var pCoordinate = this._untransform(containerPoint);
        var coordinate = projection.unproject(pCoordinate);
        return coordinate;
    },

    /**
     * Converts a container point to the view point.
     *
     * @param {maptalks.Point}
     * @returns {maptalks.Point}
     */
    containerPointToViewPoint: function(containerPoint) {
        if (!containerPoint) {return null;}
        var platformOffset = this.offsetPlatform();
        return containerPoint.substract(platformOffset);
    },

    /**
     * Converts a view point to the container point.
     *
     * @param {maptalks.Point}
     * @returns {maptalks.Point}
     */
    viewPointToContainerPoint: function(viewPoint) {
        if (!viewPoint) {return null;}
        var platformOffset = this.offsetPlatform();
        return viewPoint.add(platformOffset);
    },

    /**
     * Checks if the map container size changed and updates the map if so.<br>
     * It is called in a setTimeout call.
     * @return {maptalks.Map} this
     */
    checkSize:function() {
        if (this._resizeTimeout) {
            clearTimeout(this._resizeTimeout);
        }
        var me = this;
        this._resizeTimeout = setTimeout(function() {
            var watched = me._getContainerDomSize();
            if (me.width !== watched.width || me.height !== watched.height) {
                var oldHeight = me.height;
                var oldWidth = me.width;
                me._updateMapSize(watched);
                var resizeOffset = new Z.Point((watched.width-oldWidth) / 2,(watched.height-oldHeight) / 2);
                me._offsetCenterByPixel(resizeOffset);
                /**
                 * resize event when map container's size changes
                 * @event maptalks.Map#resize
                 * @type {Object}
                 * @property {String} type - resize
                 * @property {maptalks.Map} target - map fires the event
                 */
                me._fireEvent('resize');
            }
        }, 100);

        return this;
    },

    /**
     * Converts a geographical distance to the pixel length.<br>
     * The value varis with difference zoom level.
     *
     * @param  {Number} xDist - distance on X axis.
     * @param  {Number} yDist - distance on Y axis.
     * @return {maptalks.Size} result.width: pixel length on X axis; result.height: pixel length on Y axis
     */
    distanceToPixel: function(xDist,yDist) {
        var projection = this.getProjection();
        if (!projection) {
            return null;
        }
        var center = this.getCenter(),
            target = projection.locate(center,xDist,yDist),
            res = this._getResolution();

        var width = !xDist?0:(projection.project(new Z.Coordinate(target.x, center.y)).x-projection.project(center).x)/res;
        var height = !yDist?0:(projection.project(new Z.Coordinate(center.x, target.y)).y-projection.project(center).y)/res;
        return new Z.Size(Math.abs(width), Math.abs(height))._round();
    },

    /**
     * Converts pixel length to geographical distance.
     *
     * @param  {Number} width -
     * @param  {Number} height 纵轴像素长度
     * @return {Number}  distance
     */
    pixelToDistance:function(width, height) {
        var projection = this.getProjection();
        if (!projection) {
            return null;
        }
        //计算前刷新scales
        var center = this.getCenter(),
            pcenter = this._getPrjCenter(),
            res = this._getResolution();
        var pTarget = new Z.Coordinate(pcenter.x+width*res, pcenter.y+height*res);
        var target = projection.unproject(pTarget);
        return projection.measureLength(target,center);
    },

    /**
     * 返回距离coordinate坐标距离为dx, dy的坐标
     * @param  {maptalks.Coordinate} coordinate 坐标
     * @param  {Number} dx         x轴上的距离, 地图CRS为经纬度时,单位为米, 地图CRS为像素时, 单位为像素
     * @param  {Number} dy         y轴上的距离, 地图CRS为经纬度时,单位为米, 地图CRS为像素时, 单位为像素
     * @return {maptalks.Coordinate}            新的坐标
     */
    locate:function(coordinate, dx, dy) {
        return this.getProjection().locate(new Z.Coordinate(coordinate),dx,dy);
    },

    /**
    * Returns an object with different map panels (to build customized layers or overlays).
    * @returns {Object}
    */
    getPanel: function() {
        return this._getRenderer().getPanel();
    },

//-----------------------------------------------------------

    /**
     * whether map is busy
     * @private
     * @return {Boolean}
     */
    _isBusy:function() {
        return this._zooming/* || this._moving*/;
    },

    /**
     * try to change cursor when map is not setCursored
     * @private
     * @param  {String} cursor css cursor
     */
    _trySetCursor:function(cursor) {
        if (!this._cursor && !this._priorityCursor) {
            if (!cursor) {
                cursor = 'default';
            }
            var panel = this.getPanel();
            if (panel && panel.style) {
                panel.style.cursor = cursor;
            }
        }
        return this;
    },

    _setPriorityCursor:function(cursor) {
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
            var panel = this.getPanel();
            if (panel && panel.style) {
                panel.style.cursor = cursor;
            }
        }
        return this;
    },

     /**
     * Get map's extent in view points.
     * @return {maptalks.PointExtent}
     * @private
     */
    _getViewExtent:function() {
        var size = this.getSize();
        var offset = this.offsetPlatform();
        var min = new Z.Point(0,0);
        var max = new Z.Point(size['width'],size['height']);
        return new Z.PointExtent(min.substract(offset), max.substract(offset));
    },

    _setPrjCenterAndMove:function(pcenter) {
        var offset = this._getPixelDistance(pcenter);
        this._setPrjCenter(pcenter);
        this.offsetPlatform(offset);
    },

    //remove a layer from the layerList
    _removeLayer:function(layer,layerList) {
        if (!layer || !layerList) {return;}
        var index = Z.Util.searchInArray(layer,layerList);
        if (index > -1) {
            layerList.splice(index, 1);

            for (var j=0, jlen=layerList.length;j<jlen;j++) {
                if (layerList[j].setZIndex) {
                    layerList[j].setZIndex(j);
                }
            }
        }
    },

    _sortLayersByZIndex:function(layerList) {
        layerList.sort(function(a,b) {
            return a.getZIndex()-b.getZIndex();
        });
    },


    _onMoveStart:function() {
        this._originCenter = this.getCenter();
        this._moving = true;
        this._trySetCursor('move');
        /**
         * movestart event
         * @event maptalks.Map#movestart
         * @type {Object}
         * @property {String} type - movestart
         * @property {maptalks.Map} target - map fires the event
         */
        this._fireEvent('movestart');
    },

    _onMoving:function() {
        /**
         * moving event
         * @event maptalks.Map#moving
         * @type {Object}
         * @property {String} type - moving
         * @property {maptalks.Map} target - map fires the event
         */
        this._fireEvent('moving');
    },

    _onMoveEnd:function() {
        this._enablePanAnimation=true;
        this._moving = false;
        this._trySetCursor('default');
        /**
         * moveend event
         * @event maptalks.Map#moveend
         * @type {Object}
         * @property {String} type - moveend
         * @property {maptalks.Map} target - map fires the event
         */
        this._fireEvent('moveend');
        if (!this._verifyExtent(this.getCenter())) {
            this.panTo(this._originCenter);
        }
    },

    /**
     * Gets pixel lenth from pcenter to map's current center.
     * @param  {maptalks.Coordinate} pcenter - a projected coordinate
     * @return {maptalks.Point}
     * @private
     */
    _getPixelDistance:function(pCoord) {
        var current = this._getPrjCenter();
        var curr_px = this._transform(current);
        var pCoord_px = this._transform(pCoord);
        var dist = new Z.Point(-pCoord_px.x+curr_px.x,curr_px.y-pCoord_px.y);
        return dist;
    },

    _fireEvent:function(eventName, param) {
        //fire internal events at first
        this.fire('_'+eventName,param);
        this.fire(eventName,param);
    },

    _Load:function() {
        this._resetMapStatus();
        this._registerDomEvents();
        this._loadAllLayers();
        this._loaded = true;
        this._callOnLoadHooks();
        this._fireEvent('load');
    },

    _initRenderer:function() {
        var renderer = this.options['renderer'];
        var clazz = Z.Map.getRendererClass(renderer);
        this._renderer = new clazz(this);
    },

    _getRenderer:function() {
        return this._renderer;
    },

    _loadAllLayers:function() {
        function loadLayer(layer) {
            if (layer) {
                layer.load();
            }
        }
        if (this._baseLayer) {this._baseLayer.load();}
        this._eachLayer(loadLayer,this.getLayers());
    },



    /**
     * Gets layers that fits for the filter
     * @param  {fn} filter - filter function
     * @return {maptalks.Layer[]}
     * @private
     */
    _getLayers:function(filter) {
        var layers = this._baseLayer?[this._baseLayer].concat(this._layers):this._layers;
        var result = [];
        for (var i = 0; i < layers.length; i++) {
            if (!filter || filter.call(this,layers[i])) {
                result.push(layers[i]);
            }
        }
        return result;
    },

    _eachLayer:function(fn) {
        if (arguments.length < 2) {return;}
        var layerLists = Array.prototype.slice.call(arguments, 1);
        if (layerLists && !Z.Util.isArray(layerLists)) {
            layerLists = [layerLists];
        }
        var layers = [];
        for (var i=0, len=layerLists.length;i<len;i++) {
            layers = layers.concat(layerLists[i]);
        }
        for (var j=0, jlen = layers.length;j<jlen;j++) {
            fn.call(fn,layers[j]);
        }
    },

    //Check and reset map's status when map'sview is changed.
    _resetMapStatus:function(){
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
        maxZoom = this.getMaxZoom(),
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
    },

    _getContainerDomSize:function(){
        if (!this._containerDOM) {return null;}
        var containerDOM = this._containerDOM,
            width,height;
        if (!Z.Util.isNil(containerDOM.offsetWidth) && !Z.Util.isNil(containerDOM.offsetWidth)) {
            width = parseInt(containerDOM.offsetWidth,0);
            height = parseInt(containerDOM.offsetHeight,0);
        } else if (!Z.Util.isNil(containerDOM.width) && !Z.Util.isNil(containerDOM.height)) {
            width = containerDOM.width;
            height = containerDOM.height;
        } else {
            throw new Error('can not get size of container');
        }
        return new Z.Size(width, height);
    },

    _updateMapSize:function(mSize) {
        this.width = mSize['width'];
        this.height = mSize['height'];
        this._getRenderer().updateMapSize(mSize);
        return this;
    },

    /**
     * Gets projected center of the map
     * @return {maptalks.Coordinate}
     * @private
     */
    _getPrjCenter:function() {
        return this._prjCenter;
    },

    _setPrjCenter:function(pcenter) {
        this._prjCenter=pcenter;
    },

    _verifyExtent:function(center) {
        if (!center) {
            return false;
        }
        var maxExt = this.getMaxExtent();
        if (!maxExt) {
            return true;
        }
        return maxExt.contains(new Z.Coordinate(center));
    },

    /**
     * Move map's center by pixels.
     * @param  {maptalks.Point} pixel - pixels to move, the relation between value and direction is as:
     * -1,1 | 1,1
     * ------------
     *-1,-1 | 1,-1
     * @private
     * @returns {maptalks.Coordinate} the new projected center.
     */
    _offsetCenterByPixel:function(pixel) {
        var posX = this.width/2+pixel.x,
            posY = this.height/2+pixel.y;
        var pCenter = this._untransform(new Z.Point(posX, posY));
        this._setPrjCenter(pCenter);
        return pCenter;
    },

    /**
     * offset map platform panel.
     *
     * @param  {maptalks.Point} offset - offset in pixel to move
     * @return {maptalks.Map} this
     */
    /**
     * Gets map platform panel's current view point.
     * @return {maptalks.Point}
     */
    offsetPlatform:function(offset) {
        if (!offset) {
            return this._mapViewPoint;
        } else {
            this._mapViewPoint = this._mapViewPoint.add(offset);
            this._getRenderer().offsetPlatform(offset);
            return this;
        }
    },

    _resetMapViewPoint:function() {
        this._mapViewPoint = new Z.Point(0,0);
    },

    /**
     * Get map's current resolution
     * @return {Number} resolution
     * @private
     */
    _getResolution:function(zoom) {
        if (Z.Util.isNil(zoom)) {
            zoom = this.getZoom();
        }
        return this._view.getResolution(zoom);
    },

    _getResolutions:function() {
        return this._view.getResolutions();
    },

    /**
     * transform container point to geographical projected coordinate
     *
     * @param  {maptalks.Point} containerPointt
     * @return {maptalks.Coordinate}
     * @private
     */
    _untransform:function(containerPoint) {
        var transformation =  this._view.getTransformation();
        var res = this._getResolution();

        var pcenter = this._getPrjCenter();
        var centerPoint = transformation.transform(pcenter, res);
        //容器的像素坐标方向是固定方向的, 和html标准一致, 即从左到右增大, 从上到下增大
        var point = new Z.Point(centerPoint.x+ containerPoint.x - this.width / 2, centerPoint.y+containerPoint.y - this.height / 2);
        var result = transformation.untransform(point, res);
        return result;
    },

    /**
     * transform view point to geographical projected coordinat
     * @param  {maptalks.Point} viewPoint
     * @return {maptalks.Coordinate}
     * @private
     */
    _untransformFromViewPoint:function(viewPoint) {
        return this._untransform(this.viewPointToContainerPoint(viewPoint));
    },

    /**
     * transform geographical projected coordinate to container point
     * @param  {maptalks.Coordinate} pCoordinate
     * @return {maptalks.Point}
     * @private
     */
    _transform:function(pCoordinate) {
        var transformation =  this._view.getTransformation();
        var res = this._getResolution();

        var pcenter = this._getPrjCenter();
        var centerPoint = transformation.transform(pcenter, res);

        var point = transformation.transform(pCoordinate,res);
        return new Z.Point(
            this.width / 2 + point.x - centerPoint.x,
            this.height / 2 + point.y - centerPoint.y
            );
    },

    /**
     * transform geographical projected coordinate to view point
     * @param  {maptalks.Coordinate} pCoordinate
     * @return {maptalks.Point}
     * @private
     */
    _transformToViewPoint:function(pCoordinate) {
        var containerPoint = this._transform(pCoordinate);
        return this._containerPointToViewPoint(containerPoint);
    },

    //destructive containerPointToViewPoint
    _containerPointToViewPoint: function(containerPoint) {
        if (!containerPoint) {return null;}
        var platformOffset = this.offsetPlatform();
        return containerPoint._substract(platformOffset);
    }
});




//--------------hooks after map loaded----------------
Z.Map.prototype._callOnLoadHooks=function() {
    var proto = Z.Map.prototype;
    for (var i = 0, len = proto._onLoadHooks.length; i < len; i++) {
        proto._onLoadHooks[i].call(this);
    }
};

/**
 * Add hooks for additional codes when map's loading complete, useful for plugin developping.
 * @param {function} fn
 * @returns {maptalks.Map}
 * @static
 * @protected
 */
Z.Map.addOnLoadHook = function (fn) { // (Function) || (String, args...)
    var args = Array.prototype.slice.call(arguments, 1);

    var onload = typeof fn === 'function' ? fn : function () {
        this[fn].apply(this, args);
    };

    this.prototype._onLoadHooks = this.prototype._onLoadHooks || [];
    this.prototype._onLoadHooks.push(onload);
    return this;
};


Z.Util.extend(Z.Map, Z.Renderable);
