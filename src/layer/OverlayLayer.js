/**
 * @classdesc
 * Base class of all the layers that can add/remove geometries.
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
     * Get all the geometries on the layer or the ones filtered.
     * @param {Function} filter  - a function to filter the layer
     * @param {Object} context   - context of the filter context
     * @return {maptalks.Geometry[]}
     */
    getGeometries:function (filter, context) {
        return this._getGeometries(filter, context);
    },

    /**
     * Travels among the geometries the layer has.
     * @param  {Function} fn - a callback function
     * @param  {*} context   - callback's context
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
     * creates a GeometryCollection with all elements that pass the test implemented by the provided function.
     * @param  {Function} fn      - Function to test each geometry
     * @param  {*} context        - Function's context
     * @return {maptalks.GeometryCollection} A GeometryCollection with all elements that pass the test
     */
    filter: function (fn, context) {
        var selected = [];
        if (fn) {
            this.forEach(function (geometry) {
                if (context ? fn.call(context, geometry) : fn(geometry)) {
                    selected.push(geometry);
                }
            });
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
     * @param {Boolean} fitView                                  - automatically set the map to a fit center and zoom for the geometries
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
        var fitCounter = 0;
        var centerSum = new Z.Coordinate(0, 0);
        var extent = null,
            geo, geoId, internalId, geoCenter, geoExtent;
        var style = this.getStyle();
        for (var i = 0, len = geometries.length; i < len; i++) {
            geo = geometries[i];
            if (!geo || !(geo instanceof Z.Geometry)) {
                throw new Error(this.exceptions['INVALID_GEOMETRY']);
            }

            geoId = geo.getId();
            if (geoId) {
                if (!Z.Util.isNil(this._geoMap[geoId])) {
                    throw new Error(this.exceptions['DUPLICATE_GEOMETRY_ID'] + ':' + geoId);
                }
                this._geoMap[geoId] = geo;
            }
            internalId = Z.Util.GUID();
            //内部全局唯一的id
            geo._setInternalId(internalId);
            this._geoCache[internalId] = geo;
            this._counter++;
            geo._bindLayer(this);
            if (fitView) {
                geoCenter = geo.getCenter();
                geoExtent = geo.getExtent();
                if (geoCenter && geoExtent) {
                    centerSum._add(geoCenter);
                    extent = geoExtent.combine(extent);
                    fitCounter++;
                }
            }
            if (style) {
                this._styleGeometry(geo);
            }
            geo._fireEvent('addend', {'geometry':geo});
        }
        var map = this.getMap();
        if (map) {
            this._getRenderer().render(geometries);
            if (fitView) {
                var z = map.getFitZoom(extent);
                var center = centerSum._multi(1 / fitCounter);
                map.setCenterAndZoom(center, z);
            }
        }
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
        this.fire('removegeo', {'geometries':geometries});
        return this;
    },

    _clear:function () {
        this.forEach(function (geo) {
            geo.remove();
        });
        this._geoMap = {};
        this._geoCache = {};
        this.fire('clear');
        return this;
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
    this._geoCache = {};
    this._geoMap = {};
    this._resources = {};
    this._counter = 0;
});
