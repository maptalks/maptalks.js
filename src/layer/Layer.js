/**
 * @classdesc
 * Base class for all the layers, defines common methods that all the layer classes share. <br>
 * It is abstract and not intended to be instantiated.
 *
 * @class
 * @category layer
 * @abstract
 * @extends maptalks.Class
 * @mixes maptalks.Eventable
 */
Z.Layer = Z.Class.extend(/** @lends maptalks.Layer.prototype */{

    includes: Z.Eventable,

    /**
     * @property {Object}  [options=null] - base options of layer.
     * @property {Number}  [options.minZoom=-1] - the minimum zoom to display the layer, set to -1 to unlimit it.
     * @property {Number}  [options.maxZoom=-1] - the maximum zoom to display the layer, set to -1 to unlimit it.
     * @property {Boolean} [options.visible=true] - whether to display the layer.
     * @property {Number}  [options.opacity=1] - opacity of the layer, from 0 to 1.
     * @property {String}  [options.renderer=canvas] - renderer type. Don't change it if you are not sure about it. About renderer, see [TODO]{@link tutorial.renderer}.
     */
    options:{
        //最大最小可视范围, null表示不受限制
        'minZoom':null,
        'maxZoom':null,
        //图层是否可见
        'visible':true,
        'opacity': 1,
        'renderer' : 'canvas'
    },

    initialize:function (id, opts) {
        this.setId(id);
        Z.Util.setOptions(this, opts);
    },


     /**
     * load the tile layer, can't be overrided by sub-classes
     */
    load:function () {
        if (!this.getMap()) { return this; }
        this._initRenderer();
        var zIndex = this.getZIndex();
        if (this._prepareLoad()) {
            if (this._renderer) {
                if (!Z.Util.isNil(zIndex)) {
                    this._renderer.setZIndex(zIndex);
                }
                this._renderer.render();
            }
        }
        return this;
    },

    /**
     * Get the layer id
     * @returns {String|Number} id
     */
    getId:function () {
        return this._id;
    },

    /**
     * Set a new id to the layer
     * @param {String|Number} id - new layer id
     * @return {maptalks.Layer} this
     * @fires maptalks.Layer#idchange
     */
    setId:function (id) {
        //TODO 设置id可能造成map无法找到layer
        var old = this._id;
        this._id = id;
        /**
         * idchange event.
         *
         * @event maptalks.Layer#idchange
         * @type {Object}
         * @property {String} type - idchange
         * @property {maptalks.Layer} target    - the layer fires the event
         * @property {String|Number} old        - value of the old id
         * @property {String|Number} new        - value of the new id
         */
        this.fire('idchange', {'old':old, 'new':id});
        return this;
    },

    /**
     * Adds itself to a map.
     * @param {maptalks.Map} map - map added to
     * @return {maptalks.Layer} this
     */
    addTo:function (map) {
        map.addLayer(this);
        return this;
    },

    /**
     * Set a z-index to the layer
     * @param {Number} zIndex - layer's z-index
     * @return {maptalks.Layer} this
     */
    setZIndex:function (zIndex) {
        this._zIndex = zIndex;
        if (this.map) {
            var layerList = this._getLayerList();
            this.map._sortLayersByZIndex(layerList);
        }
        if (this._renderer) {
            this._renderer.setZIndex(zIndex);
        }
        return this;
    },

    /**
     * Get the layer's z-index
     * @return {Number}
     */
    getZIndex:function () {
        return this._zIndex;
    },

    /**
     * If the layer is rendered by HTML5 Canvas 2d.
     * @return {Boolean}
     * @protected
     */
    isCanvasRender:function () {
        var renderer = this._getRenderer();
        if (renderer) {
            return renderer.isCanvasRender();
        }
        return false;
    },

    /**
     * Get the map that the layer added to
     * @returns {maptalks.Map}
     */
    getMap:function () {
        if (this.map) {
            return this.map;
        }
        return null;
    },


    /**
     * Brings the layer to the top of all the layers
     * @returns {maptalks.Layer} this
     */
    bringToFront:function () {
        var layers = this._getLayerList();
        if (!layers) {
            return this;
        }
        var topLayer = layers[layers.length - 1];
        if (layers.length === 1 || topLayer === this) {
            return this;
        }
        var max = topLayer.getZIndex();
        this.setZIndex(max + 1);
        return this;
    },

    /**
     * Brings the layer under the bottom of all the layers
     * @returns {maptalks.Layer} this
     */
    bringToBack:function () {
        var layers = this._getLayerList();
        if (!layers) {
            return this;
        }
        var bottomLayer = layers[0];
        if (layers.length === 1 || bottomLayer === this) {
            return this;
        }
        var min = bottomLayer.getZIndex();
        this.setZIndex(min - 1);
        return this;
    },

    /**
     * Show the layer
     * @returns {maptalks.Layer} this
     */
    show:function () {
        if (!this.options['visible']) {
            this.options['visible'] = true;
            if (this._getRenderer()) {
                this._getRenderer().show();
            }
        }
        this.fire('show');
        return this;
    },

    /**
     * Hide the layer
     * @returns {maptalks.Layer} this
     */
    hide:function () {
        if (this.options['visible']) {
            this.options['visible'] = false;
            if (this._getRenderer()) {
                this._getRenderer().hide();
            }
        }
        this.fire('hide');
        return this;
    },

    isLoaded:function () {
        if (!this._renderer) {
            return false;
        }
        return this._renderer.isLoaded();
    },

    /**
     * Whether the layer is visible now.
     * @return {Boolean}
     */
    isVisible:function () {
        if (Z.Util.isNumber(this.options['opacity']) && this.options['opacity'] <= 0) {
            return false;
        }
        var map = this.getMap();
        if (map) {
            var zoom = map.getZoom();
            if ((!Z.Util.isNil(this.options['maxZoom']) && this.options['maxZoom'] < zoom) ||
                    (!Z.Util.isNil(this.options['minZoom']) && this.options['minZoom'] > zoom)) {
                return false;
            }
        }

        if (Z.Util.isNil(this.options['visible'])) {
            this.options['visible'] = true;
        }
        return this.options['visible'];
    },

    /**
     * Remove itself from the map added to.
     * @returns {maptalks.Layer} this
     */
    remove:function () {
        if (this.map) {
            this.map.removeLayer(this);
        }
        return this;
    },

    /**
     * Get the mask geometry of the layer
     * @return {maptalks.Geometry}
     */
    getMask:function () {
        return this._mask;
    },

    /**
     * Set a mask geometry on the layer, only the area in the mask will be displayed.
     * @param {maptalks.Geometry} mask - mask geometry, can only be a Marker with vector symbol, a Polygon or a MultiPolygon
     * @returns {maptalks.Layer} this
     */
    setMask:function (mask) {
        if (!((mask instanceof Z.Marker && Z.symbolizer.VectorMarkerSymbolizer.test(mask.getSymbol())) ||
                mask instanceof Z.Polygon || mask instanceof Z.MultiPolygon)) {
            throw new Error('mask has to be a Marker with vector symbol, a Polygon or a MultiPolygon');
        }

        /*if (mask instanceof Z.Marker) {
            mask.updateSymbol({
                'markerLineWidth': 0,
                'markerFillOpacity': 1
            });
        } else {
            mask.setSymbol({
                'lineWidth':0,
                'polygonOpacity':1
            });
        }*/
        mask._bindLayer(this);
        this._mask = mask;
        if (!this.getMap() || this.getMap()._isBusy()) {
            return this;
        }
        if (this._getRenderer()) {
            this._getRenderer().render();
        }
        return this;
    },

    /**
     * Remove the mask
     * @returns {maptalks.Layer} this
     */
    removeMask:function () {
        delete this._mask;
        if (!this.getMap() || this.getMap()._isBusy()) {
            return this;
        }
        if (this._getRenderer()) {
            this._getRenderer().render();
        }
        return this;
    },

    _refreshMask: function () {
        if (this._mask) {
            this._mask._onZoomEnd();
        }
    },

    /**
     * Prepare Layer's loading, this is a method intended to be overrided by subclasses.
     * @return {Boolean} true to continue, false to cease.
     * @protected
     */
    _prepareLoad:function () {
        return true;
    },

    _onRemove:function () {
        this._switchEvents('off', this);
        this._removeEvents();
        if (this._renderer) {
            this._switchEvents('off', this._renderer);
            this._renderer.remove();
            delete this._renderer;
        }
        delete this._mask;
        delete this.map;
    },

    _bindMap:function (map, zIndex) {
        if (!map) { return; }
        this.map = map;
        this.setZIndex(zIndex);
        this._registerEvents();
        if (this._getEvents && this._getEvents()) {
            this._switchEvents('on', this);
        }
        this.fire('add');
    },

    _initRenderer:function () {
        var renderer = this.options['renderer'];
        if (!this.constructor.getRendererClass) {
            return;
        }
        var clazz = this.constructor.getRendererClass(renderer);
        if (!clazz) {
            return;
        }
        this._renderer = new clazz(this);
        this._renderer.setZIndex(this.getZIndex());
        this._switchEvents('on', this._renderer);
    },

    _switchEvents: function (to, emitter) {
        if (emitter && emitter._getEvents) {
            var events = emitter._getEvents();
            if (events) {
                var map = this.getMap();
                for (var p in events) {
                    if (events.hasOwnProperty(p)) {
                        map[to](p, events[p], emitter);
                    }
                }
            }
        }
    },

    _registerEvents: function () {
        this.getMap().on('_zoomend', this._refreshMask, this);
    },

    _removeEvents: function () {
        this.getMap().off('_zoomend', this._refreshMask, this);
    },

    _getRenderer:function () {
        return this._renderer;
    },

    _getLayerList:function () {
        if (!this.map) { return null; }
        return this.map._layers;
    }
});

Z.Util.extend(Z.Layer, Z.Renderable);
