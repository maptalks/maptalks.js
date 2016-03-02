/**
 * @classdesc
 * Base class of all the layers that can add/remove geometries.
 * @class
 * @category layer
 * @abstract
 * @extends {maptalks.Layer}
 */
Z.OverlayLayer=Z.Layer.extend(/** @lends maptalks.OverlayLayer.prototype */{
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
     * Get a geometry by a id
     * @param  {String|Number} id   - id of the geometry
     * @return {maptalks.Geometry}
     */
    getGeometryById:function(id) {
        if (Z.Util.isNil(id) || id === '') {
            return null;
        }
        if (!this._geoMap[id]) {
            return null;
        }
        return this._geoMap[id];
    },

    /**
     * Get all the geometries on the layer or the ones filtered.
     * @param {Function} filter  - a function to filter the layer
     * @param {Object} context   - context of the filter context
     * @return {maptalks.Geometry[]}
     */
    getGeometries:function(filter, context) {
        var cache = this._geoCache;
        var result = [];
        for (var p in cache) {
            if (cache.hasOwnProperty(p)) {
                var geometry = cache[p];
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

    /**
     * Whether the layer is empty.
     * @return {Boolean}
     */
    isEmpty:function() {
        return this._counter === 0;
    },

    /**
     * Adds one or more geometries to the layer
     * @param {maptalks.Geometry|maptalks.Geometry[]} geometries - one or more geometries
     * @param {Boolean} fitView                                  - automatically set the map to a fit center and zoom for the geometries
     * @return {maptalks.OverlayLayer} this
     */
    addGeometry:function(geometries,fitView) {
        if (!geometries) {return this;}
        if (!Z.Util.isArray(geometries)) {
            return this.addGeometry([geometries],fitView);
        } else if (!Z.Util.isArrayHasData(geometries)) {
            return this;
        }
        var fitCounter = 0;
        var centerSum = {x:0,y:0};
        var extent = null;
        for (var i=0, len=geometries.length;i<len;i++) {
            var geo = geometries[i];
            if (!geo || !(geo instanceof Z.Geometry)) {
                throw new Error(this.exceptions['INVALID_GEOMETRY']);
            }

            var geoId = geo.getId();
            if (geoId) {
                if (!Z.Util.isNil(this._geoMap[geoId])) {
                    throw new Error(this.exceptions['DUPLICATE_GEOMETRY_ID']+':'+geoId);
                }
                this._geoMap[geoId] = geo;
            }
            var internalId = Z.Util.GUID();
            //内部全局唯一的id
            geo._setInternalId(internalId);
            this._geoCache[internalId] = geo;
            this._counter++;
            geo._bindLayer(this);
            if (fitView) {
                var geoCenter = geo.getCenter();
                var geoExtent = geo.getExtent();
                if (geoCenter && geoExtent) {
                    centerSum.x += geoCenter.x;
                    centerSum.y += geoCenter.y;
                    extent = geoExtent.combine(extent);
                    fitCounter++;
                }
            }
            //图形添加到layer
            geo._fireEvent('addend', {'geometry':geo});
        }
        var map = this.getMap();
        if (map) {
            this._getRenderer().render(geometries);
            if (fitView) {
                var z = map.getFitZoom(extent);
                var center = {x:centerSum.x/fitCounter, y:centerSum.y/fitCounter};
                map.setCenterAndZoom(center,z);
            }
        }
        return this;
    },

    /**
     * Removes one or more geometries from the layer
     * @param  {String|String[]|maptalks.Geometry|maptalks.Geometry[]} geometries - geometry ids or geometries to remove
     * @returns {maptalks.OverlayLayer} this
     */
    removeGeometry:function(geometry) {
        if (Z.Util.isArray(geometry)) {
            for (var i = geometry.length - 1; i >= 0; i--) {
                this.removeGeometry(geometry[i]);
            }
            return this;
        }
        if (!(geometry instanceof Z.Geometry)) {
            geometry = this.getGeometryById(geometry);
        }
        if (!geometry) {return this;}
        if (this != geometry.getLayer()) {
            return this;
        }
        geometry.remove();
        return this;
    },

    /**
     * Clear all geometries in this layer
     * @returns {maptalks.OverlayLayer} this
     */
    clear:function() {
        this._eachGeometry(function(geo) {
            geo.remove();
        });
        this._geoMap={};
        this._geoCache={};
        return this;
    },

    /**
     * Travels among the geometries the layer has.
     * @param  {Function} fn - a callback function
     * @param  {*} context   - the travel function's context
     * @private
     */
    _eachGeometry:function(fn,context) {
        var cache = this._geoCache;
        if (!context) {
            context=this;
        }
        for (var g in cache) {
            if (cache.hasOwnProperty(g)) {
                fn.call(context,cache[g]);
            }
        }
    }
});

Z.OverlayLayer.addInitHook(function() {
    this._geoCache={};
    this._geoMap={};
    this._resources={};
    this._counter = 0;
});
