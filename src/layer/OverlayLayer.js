/**
 * @classdesc
 * Base class of all the layers that can add/remove geometries. <br>
 * It is abstract and not intended to be instantiated.
 * @class
 * @category layer
 * @abstract
 * @extends {maptalks.Layer}
 */
Z.OverlayLayer = Z.Layer.extend(/** @lends maptalks.OverlayLayer.prototype */{
    exceptionDefs:{
        'en-US':{
            'DUPLICATE_GEOMETRY_ID':'Duplicate ID for the geometry',
            'INVALID_GEOMETRY':'invalid geometry to add to layer.'
        },
        'zh-CN':{
            'DUPLICATE_GEOMETRY_ID':'重复的Geometry ID',
            'INVALID_GEOMETRY':'不合法的Geometry, 无法被加入图层.'
        }
    },


    /**
     * Get a geometry by its id
     * @param  {String|Number} id   - id of the geometry
     * @return {maptalks.Geometry}
     */
    getGeometryById:function (id) {
        return this._getGeometryById(id);
    },

    /**
     * Get all the geometries or the ones filtered if a filter function is provided.
     * @param {Function} [filter=undefined]  - a function to filter the geometries
     * @param {Object} [context=undefined]   - context of the filter function, value to use as this when executing filter.
     * @return {maptalks.Geometry[]}
     */
    getGeometries:function (filter, context) {
        return this._getGeometries(filter, context);
    },

    /**
     * Get count of the geometries
     * @return {Number} count
     */
    getCount: function () {
        if (!this._counter) {
            return 0;
        }
        return this._counter;
    },

    /**
     * Executes the provided callback once for each geometry present in the layer in order.
     * @param  {Function} fn - a callback function
     * @param  {*} [context=undefined]   - callback's context, value to use as this when executing callback.
     * @return {maptalks.OverlayLayer} this
     */
    forEach:function (fn, context) {
        var cache = this._geoCache;
        var counter = 0;
        for (var g in cache) {
            if (cache.hasOwnProperty(g)) {
                if (!context) {
                    fn(cache[g], counter++);
                } else {
                    fn.call(context, cache[g], counter++);
                }
            }
        }
        return this;
    },

    /**
     * Creates a GeometryCollection with all the geometries that pass the test implemented by the provided function.
     * @param  {Function} fn      - Function to test each geometry
     * @param  {*} [context=undefined]  - Function's context, value to use as this when executing function.
     * @return {maptalks.GeometryCollection} A GeometryCollection with all the geometries that pass the test
     */
    filter: function (fn, context) {
        var selected = [];
        if (Z.Util.isFunction(fn)) {
            if (fn) {
                this.forEach(function (geometry) {
                    if (context ? fn.call(context, geometry) : fn(geometry)) {
                        selected.push(geometry);
                    }
                });
            }
        } else {
            var filter = Z.Util.createFilter(fn);
            this.forEach(function (geometry) {
                var g = Z.Util.getFilterFeature(geometry);
                if (filter(g)) {
                    selected.push(geometry);
                }
            }, this);
        }
        return selected.length > 0 ? new Z.GeometryCollection(selected) : null;
    },

    /**
     * Whether the layer is empty.
     * @return {Boolean}
     */
    isEmpty:function () {
        return this._counter === 0;
    },

    /**
     * Adds one or more geometries to the layer
     * @param {maptalks.Geometry|maptalks.Geometry[]} geometries - one or more geometries
     * @param {Boolean} [fitView=false]  - automatically set the map to a fit center and zoom for the geometries
     * @return {maptalks.OverlayLayer} this
     */
    addGeometry:function (geometries, fitView) {
        return this._addGeometry(geometries, fitView);
    },

    /**
     * Removes one or more geometries from the layer
     * @param  {String|String[]|maptalks.Geometry|maptalks.Geometry[]} geometries - geometry ids or geometries to remove
     * @returns {maptalks.OverlayLayer} this
     */
    removeGeometry:function (geometries) {
        return this._removeGeometry(geometries);
    },

    /**
     * Clear all geometries in this layer
     * @returns {maptalks.OverlayLayer} this
     */
    clear:function () {
        return this._clear();
    },

    _initCache: function () {
        if (!this._geoCache) {
            this._geoCache = {};
            this._geoMap = {};
            this._counter = 0;
        }
    },

    _getGeometryById:function (id) {
        if (Z.Util.isNil(id) || id === '') {
            return null;
        }
        if (!this._geoMap[id]) {
            return null;
        }
        return this._geoMap[id];
    },

    _getGeometries:function (filter, context) {
        var cache = this._geoCache;
        var result = [],
            geometry;
        for (var p in cache) {
            if (cache.hasOwnProperty(p)) {
                geometry = cache[p];
                if (filter) {
                    var filtered;
                    if (context) {
                        filtered = filter.call(context, geometry);
                    } else {
                        filtered = filter(geometry);
                    }
                    if (!filtered) {
                        continue;
                    }
                }
                result.push(geometry);
            }
        }
        return result;
    },


    _addGeometry:function (geometries, fitView) {
        if (!geometries) { return this; }
        if (!Z.Util.isArray(geometries)) {
            return this._addGeometry([geometries], fitView);
        } else if (!Z.Util.isArrayHasData(geometries)) {
            return this;
        }
        this._initCache();
        var fitCounter = 0;
        var centerSum = new Z.Coordinate(0, 0);
        var extent = null,
            geo, geoId, internalId, geoCenter, geoExtent,
            style = this.getStyle ? this.getStyle() : null;
        for (var i = 0, len = geometries.length; i < len; i++) {
            geo = geometries[i];
            if (!(geo instanceof Z.Geometry)) {
                geo = Z.Geometry.fromJSON(geo);
            }
            if (!geo) {
                throw new Error(this.exceptions['INVALID_GEOMETRY']);
            }
            geoId = geo.getId();
            if (!Z.Util.isNil(geoId)) {
                if (!Z.Util.isNil(this._geoMap[geoId])) {
                    throw new Error(this.exceptions['DUPLICATE_GEOMETRY_ID'] + ':' + geoId);
                }
                this._geoMap[geoId] = geo;
            }
            internalId = Z.Util.GUID();
            //内部全局唯一的id
            geo._setInternalId(internalId);
            geo.on('idchange', this._onGeometryIdChange, this);
            this._geoCache[internalId] = geo;
            this._counter++;
            geo._bindLayer(this);
            if (fitView) {
                geoCenter = geo.getCenter();
                geoExtent = geo.getExtent();
                if (geoCenter && geoExtent) {
                    centerSum._add(geoCenter);
                    if (extent == null) {
                        extent = geoExtent;
                    } else {
                        extent = extent._combine(geoExtent);
                    }
                    fitCounter++;
                }
            }
            if (style) {
                this._styleGeometry(geo);
            }
            /**
             * add event.
             *
             * @event maptalks.Geometry#add
             * @type {Object}
             * @property {String} type - add
             * @property {maptalks.Geometry} target - geometry
             * @property {maptalks.Layer} layer - the layer added to.
             */
            geo._fireEvent('add', {'layer':this});
        }
        var map = this.getMap();
        if (map) {
            this._getRenderer().render(geometries);
            if (fitView && extent) {
                var z = map.getFitZoom(extent);
                var center = centerSum._multi(1 / fitCounter);
                map.setCenterAndZoom(center, z);
            }
        }
        /**
         * addgeo event.
         *
         * @event maptalks.OverlayLayer#addgeo
         * @type {Object}
         * @property {String} type - addgeo
         * @property {maptalks.OverlayLayer} target - layer
         * @property {maptalks.Geometry[]} geometries - the geometries to add
         */
        this.fire('addgeo', {'geometries':geometries});
        return this;
    },

    _removeGeometry:function (geometries) {
        if (!Z.Util.isArray(geometries)) {
            return this._removeGeometry([geometries]);
        }
        for (var i = geometries.length - 1; i >= 0; i--) {
            if (!(geometries[i] instanceof Z.Geometry)) {
                geometries[i] = this.getGeometryById(geometries[i]);
            }
            if (!geometries[i] || this !== geometries[i].getLayer()) continue;
            geometries[i].remove();
        }
        /**
         * removegeo event.
         *
         * @event maptalks.OverlayLayer#removegeo
         * @type {Object}
         * @property {String} type - removegeo
         * @property {maptalks.OverlayLayer} target - layer
         * @property {maptalks.Geometry[]} geometries - the geometries to remove
         */
        this.fire('removegeo', {'geometries':geometries});
        return this;
    },

    _clear:function () {
        this.forEach(function (geo) {
            geo.remove();
        });
        this._geoMap = {};
        this._geoCache = {};
        /**
         * clear event.
         *
         * @event maptalks.OverlayLayer#clear
         * @type {Object}
         * @property {String} type - clear
         * @property {maptalks.OverlayLayer} target - layer
         */
        this.fire('clear');
        return this;
    },

    _onGeometryIdChange: function (param) {
        if (!param['target'] || param['target'].getLayer() !== this) {
            return;
        }
        if (!Z.Util.isNil(param['new'])) {
            if (this._geoMap[param['new']]) {
                throw new Error(this.exceptions['DUPLICATE_GEOMETRY_ID'] + ':' + param['new']);
            }
            this._geoMap[param['new']] = param['target'];
        }
        if (!Z.Util.isNil(param['old']) && param['old'] !== param['new']) {
            delete this._geoMap[param['old']];
        }
    },

    /**
     * Called when geometry is being removed to clear the context concerned.
     * @param  {maptalks.Geometry} geometry - the geometry instance to remove
     * @private
     */
    _onGeometryRemove:function (geometry) {
        if (!geometry) { return; }
        //考察geometry是否属于该图层
        if (this !== geometry.getLayer()) {
            return;
        }
        geometry.off('idchange', this._onGeometryIdChange, this);
        var internalId = geometry._getInternalId();
        if (Z.Util.isNil(internalId)) {
            return;
        }
        var geoId = geometry.getId();
        if (!Z.Util.isNil(geoId)) {
            delete this._geoMap[geoId];
        }
        delete this._geoCache[internalId];
        this._counter--;
        if (this._getRenderer()) {
            this._getRenderer().render();
        }
    }
});

Z.OverlayLayer.addInitHook(function () {
    this._initCache();
});
