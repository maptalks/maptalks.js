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
        if (Z.Util.isNil(id) || id === '') {
            return null;
        }
        if (!this._geoMap[id]) {
            return null;
        }
        return this._geoMap[id];
    },

    /**
     * Get all the geometries or the ones filtered if a filter function is provided.
     * @param {Function} [filter=undefined]  - a function to filter the geometries
     * @param {Object} [context=undefined]   - context of the filter function, value to use as this when executing filter.
     * @return {maptalks.Geometry[]}
     */
    getGeometries:function (filter, context) {
        if (!filter) {
            return this._geoList.slice(0);
        }
        var result = [],
            geometry, filtered;
        for (var i = 0, l = this._geoList.length; i < l; i++) {
            geometry = this._geoList[i];
            if (context) {
                filtered = filter.call(context, geometry);
            } else {
                filtered = filter(geometry);
            }
            if (filtered) {
                result.push(geometry);
            }
        }
        return result;
    },

    /**
     * Get the first geometry, the geometry at the bottom.
     * @return {maptalks.Geometry} first geometry
     */
    getFirstGeometry: function () {
        if (this._geoList.length === 0) {
            return null;
        }
        return this._geoList[0];
    },

    /**
     * Get the last geometry, the geometry on the top
     * @return {maptalks.Geometry} last geometry
     */
    getLastGeometry: function () {
        var len = this._geoList.length;
        if (len === 0) {
            return null;
        }
        return this._geoList[len - 1];
    },

    /**
     * Get count of the geometries
     * @return {Number} count
     */
    getCount: function () {
        return this._geoList.length;
    },

    /**
     * Get extent of all the geometries in the layer, return null if the layer is empty.
     * @return {maptalks.Extent} - extent of the layer
     */
    getExtent: function () {
        if (this.getCount() === 0) {
            return null;
        }
        var extent = new Z.Extent();
        this.forEach(function (g) {
            extent._combine(g.getExtent());
        });
        return extent;
    },

    /**
     * Executes the provided callback once for each geometry present in the layer in order.
     * @param  {Function} fn - a callback function
     * @param  {*} [context=undefined]   - callback's context, value to use as this when executing callback.
     * @return {maptalks.OverlayLayer} this
     */
    forEach:function (fn, context) {
        var copyOnWrite = this._geoList.slice(0);
        for (var i = 0, l = copyOnWrite.length; i < l; i++) {
            if (!context) {
                fn(copyOnWrite[i], i);
            } else {
                fn.call(context, copyOnWrite[i], i);
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
        return this._geoList.length === 0;
    },

    /**
     * Adds one or more geometries to the layer
     * @param {maptalks.Geometry|maptalks.Geometry[]} geometries - one or more geometries
     * @param {Boolean} [fitView=false]  - automatically set the map to a fit center and zoom for the geometries
     * @return {maptalks.OverlayLayer} this
     */
    addGeometry:function (geometries, fitView) {
        if (!geometries) { return this; }
        if (!Z.Util.isArray(geometries)) {
            return this.addGeometry([geometries], fitView);
        } else if (!Z.Util.isArrayHasData(geometries)) {
            return this;
        }
        this._initCache();
        var fitCounter = 0;
        var centerSum = new Z.Coordinate(0, 0);
        var extent = null,
            geo, geoId, internalId, geoCenter, geoExtent;
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
            internalId = Z.Util.UID();
            //内部全局唯一的id
            geo._setInternalId(internalId);
            geo.on('idchange', this._onGeometryIdChange, this);
            geo.on('zindexchange', this._onGeometryZIndexChange, this);
            // this._geoList[internalId] = geo;
            this._geoList.push(geo);

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
            if (this.onAddGeometry) {
                this.onAddGeometry(geo);
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
        this._sortGeometries();
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

    /**
     * Removes one or more geometries from the layer
     * @param  {String|String[]|maptalks.Geometry|maptalks.Geometry[]} geometries - geometry ids or geometries to remove
     * @returns {maptalks.OverlayLayer} this
     */
    removeGeometry:function (geometries) {
        if (!Z.Util.isArray(geometries)) {
            return this.removeGeometry([geometries]);
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

    /**
     * Clear all geometries in this layer
     * @returns {maptalks.OverlayLayer} this
     */
    clear:function () {
        this._clearing = true;
        this.forEach(function (geo) {
            geo.remove();
        });
        this._geoMap = {};
        this._geoList = [];
        this._clearing = false;
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

    /**
     * Called when geometry is being removed to clear the context concerned.
     * @param  {maptalks.Geometry} geometry - the geometry instance to remove
     * @protected
     */
    onRemoveGeometry:function (geometry) {
        if (!geometry) { return; }
        //考察geometry是否属于该图层
        if (this !== geometry.getLayer()) {
            return;
        }
        geometry.off('idchange', this._onGeometryIdChange, this);
        geometry.off('zindexchange', this._onGeometryZIndexChange, this);
        var internalId = geometry._getInternalId();
        if (Z.Util.isNil(internalId)) {
            return;
        }
        var geoId = geometry.getId();
        if (!Z.Util.isNil(geoId)) {
            delete this._geoMap[geoId];
        }
        if (!this._clearing) {
            var idx = this._findInList(geometry);
            if (idx >= 0) {
                this._geoList.splice(idx, 1);
            }
        }

        if (this._getRenderer()) {
            this._getRenderer().render();
        }
    },

    hide: function () {
        for (var i = 0, l = this._geoList.length; i < l; i++) {
            this._geoList[i].onHide();
        }
        return Z.Layer.prototype.hide.call(this);
    },

    /**
     * Identify the geometries on the given container point
     * @param  {maptalks.Point} point   - container point
     * @param  {Object} [options=null]  - options
     * @param  {Object} [options.count=null] - result count
     * @return {maptalks.Geometry[]} geometries identified
     */
    identify: function (point, options) {
        var geometries = this._geoList,
            filter = options ? options.filter : null,
            extent2d,
            hits = [];
        for (var i = geometries.length - 1; i >= 0; i--) {
            var geo = geometries[i];
            if (!geo || !geo.isVisible() || !geo._getPainter()) {
                continue;
            }
            extent2d = geo._getPainter().get2DExtent();
            if (!extent2d || !extent2d.contains(point)) {
                continue;
            }
            if (geo._containsPoint(point) && (!filter || filter(geo))) {
                hits.push(geo);
                if (options['count']) {
                    if (hits.length >= options['count']) {
                        break;
                    }
                }
            }
        }
        return hits;
    },

    _initCache: function () {
        if (!this._geoList) {
            this._geoList = [];
            this._geoMap = {};
        }
    },

    _sortGeometries: function () {
        var me = this;
        this._geoList.sort(function (a, b) {
            return me._compare(a, b);
        });
    },

    _compare: function (a, b) {
        if (a._zIndex === b._zIndex) {
            return a._getInternalId() - b._getInternalId();
        }
        return a._zIndex - b._zIndex;
    },

    //binarySearch
    _findInList: function (geo) {
        var len = this._geoList.length;
        if (len === 0) {
            return -1;
        }
        var low = 0, high = len - 1, middle;
        while (low <= high) {
            middle = Math.floor((low + high) / 2);
            if (this._geoList[middle] === geo) {
                return middle;
            } else if (this._compare(this._geoList[middle], geo) > 0) {
                high = middle - 1;
            } else {
                low = middle + 1;
            }
        }
        return -1;
    },

    _onGeometryIdChange: function (param) {
        if (!param['target']) {
            return;
        }
        if (param['target'].getLayer() !== this) {
            param['target'].off('idchange', this._onGeometryIdChange, this);
            return;
        }
        if (param['new'] === param['old']) {
            if (this._geoMap[param['old']] && this._geoMap[param['old']] === param['target']) {
                return;
            }
        }
        if (!Z.Util.isNil(param['new'])) {
            if (this._geoMap[param['new']]) {
                throw new Error(this.exceptions['DUPLICATE_GEOMETRY_ID'] + ':' + param['new']);
            }
            this._geoMap[param['new']] = param['target'];
        }
        if (!Z.Util.isNil(param['old']) && param['new'] !== param['old']) {
            delete this._geoMap[param['old']];
        }
    },

    _onGeometryZIndexChange: function (param) {
        if (!param['target']) {
            return;
        }
        if (param['target'].getLayer() !== this) {
            param['target'].off('zindexchange', this._onGeometryIdChange, this);
            return;
        }
        if (param['old'] !== param['new']) {
            this._sortGeometries();
            if (this._getRenderer()) {
                this._getRenderer().render();
            }
        }
    }
});

Z.OverlayLayer.addInitHook(function () {
    this._initCache();
});
