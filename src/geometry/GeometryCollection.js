/**
 * @classdesc
 * Represents a GeometryCollection.
 * @class
 * @category geometry
 * @extends maptalks.Geometry
 * @param {maptalks.Geometry[]} geometries - GeometryCollection's geometries
 * @param {Object} [options=null] - options defined in [nmaptalks.Geometry]{@link maptalks.Geometry#options}
 * @example
 * var marker = new maptalks.Marker([0, 0]),
 *     line = new maptalks.LineString([[0, 0], [0, 1]]),
 *     polygon = new maptalks.Polygon([[0, 0], [0, 1], [1, 3]]);
 * var collection = new maptalks.GeometryCollection([marker, line, polygon])
 *     .addTo(layer);
 */
Z.GeometryCollection = Z.Geometry.extend(/** @lends maptalks.GeometryCollection.prototype */{
    type:Z.Geometry['TYPE_GEOMETRYCOLLECTION'],

    exceptionDefs:{
        'en-US':{
            'INVALID_GEOMETRY':'invalid geometry for collection.'
        },
        'zh-CN':{
            'INVALID_GEOMETRY':'无效的Geometry被加入到collection中.'
        }
    },

    initialize:function (geometries, opts) {
        this._initOptions(opts);
        this.setGeometries(geometries);
    },

    /**
     * Set new geometries to the geometry collection
     * @param {maptalks.Geometry[]} geometries
     * @return {maptalks.GeometryCollection} this
     * @fires maptalks.GeometryCollection#shapechange
     */
    setGeometries:function (_geometries) {
        var geometries = this._checkGeometries(_geometries);
        //Set the collection as child geometries' parent.
        if (Z.Util.isArray(geometries)) {
            for (var i = geometries.length - 1; i >= 0; i--) {
                geometries[i]._initOptions(this.config());
                geometries[i]._setParent(this);
                geometries[i]._setEventParent(this);
                geometries[i].setSymbol(this.getSymbol());
            }
        }
        this._geometries = geometries;
        if (this.getLayer()) {
            this._bindGeometriesToLayer();
            this._onShapeChanged();
        }
        return this;
    },

    /**
     * Get geometries of the geometry collection
     * @return {maptalks.Geometry[]} geometries
     */
    getGeometries:function () {
        if (!this._geometries) {
            return [];
        }
        return this._geometries;
    },

    /**
     * Executes the provided callback once for each geometry present in the collection in order.
     * @param  {Function} fn             - a callback function
     * @param  {*} [context=undefined]   - callback's context
     * @return {maptalks.GeometryCollection} this
     */
    forEach: function (fn, context) {
        var geometries = this.getGeometries();
        for (var i = 0, len = geometries.length; i < len; i++) {
            if (!geometries[i]) {
                continue;
            }
            if (!context) {
                fn(geometries[i], i);
            } else {
                fn.call(context, geometries[i], i);
            }
        }
        return this;
    },

    /**
     * Creates a GeometryCollection with all elements that pass the test implemented by the provided function.
     * @param  {Function} fn      - Function to test each geometry
     * @param  {*} [context=undefined]    - Function's context
     * @return {maptalks.GeometryCollection} A GeometryCollection with all elements that pass the test
     */
    filter: function () {
        return Z.VectorLayer.prototype.filter.apply(this, arguments);
    },

    /**
     * Translate or move the geometry collection by the given offset.
     * @param  {maptalks.Coordinate} offset - translate offset
     * @return {maptalks.GeometryCollection} this
     */
    translate:function (offset) {
        if (!offset) {
            return this;
        }
        if (this.isEmpty()) {
            return this;
        }
        this.forEach(function (geometry) {
            if (geometry && geometry.translate) {
                geometry.translate(offset);
            }
        });
        return this;
    },

    /**
     * Whether the geometry collection is empty
     * @return {Boolean}
     */
    isEmpty:function () {
        return !Z.Util.isArrayHasData(this.getGeometries());
    },

    /**
     * remove itself from the layer if any.
     * @returns {maptalks.Geometry} this
     * @fires maptalks.GeometryCollection#removestart
     * @fires maptalks.GeometryCollection#remove
     * @fires maptalks.GeometryCollection#removeend
     */
    remove:function () {
        this.forEach(function (geometry) {
            geometry._unbind();
        });
        return Z.Geometry.prototype.remove.apply(this, arguments);
    },

    /**
     * Show the geometry collection.
     * @return {maptalks.GeometryCollection} this
     * @fires maptalks.GeometryCollection#show
     */
    show:function () {
        this.options['visible'] = true;
        this.forEach(function (geometry) {
            geometry.show();
        });
        return this;
    },

    /**
     * Hide the geometry collection.
     * @return {maptalks.GeometryCollection} this
     * @fires maptalks.GeometryCollection#hide
     */
    hide:function () {
        this.options['visible'] = false;
        this.forEach(function (geometry) {
            geometry.hide();
        });
        return this;
    },

    setSymbol:function (symbol) {
        symbol = this._prepareSymbol(symbol);
        this._symbol = symbol;
        this.forEach(function (geometry) {
            geometry.setSymbol(symbol);
        });
        this._onSymbolChanged();
        return this;
    },

    onConfig:function (config) {
        this.forEach(function (geometry) {
            geometry.config(config);
        });
    },

    _setExternSymbol:function (symbol) {
        symbol = this._prepareSymbol(symbol);
        this._externSymbol = symbol;
        this.forEach(function (geometry) {
            geometry._setExternSymbol(symbol);
        });
        this._onSymbolChanged();
        return this;
    },

    /**
     * bind this geometry collection to a layer
     * @param  {maptalks.Layer} layer
     * @private
     */
    _bindLayer:function () {
        Z.Geometry.prototype._bindLayer.apply(this, arguments);
        this._bindGeometriesToLayer();
    },

    _bindGeometriesToLayer:function () {
        var layer = this.getLayer();
        this.forEach(function (geometry) {
            geometry._bindLayer(layer);
        });
    },

    /**
     * Check whether the type of geometries is valid
     * @param  {maptalks.Geometry[]} geometries - geometries to check
     * @private
     */
    _checkGeometries:function (geometries) {
        if (geometries && !Z.Util.isArray(geometries)) {
            if (geometries instanceof Z.Geometry) {
                return [geometries];
            } else {
                throw new Error(this.exceptions['INVALID_GEOMETRY']);
            }
        } else if (Z.Util.isArray(geometries)) {
            for (var i = 0, len = geometries.length; i < len; i++) {
                if (!(geometries[i] instanceof Z.Geometry)) {
                    throw new Error(this.exceptions['INVALID_GEOMETRY']);
                }
            }
            return geometries;
        }
        return null;
    },

    _updateCache:function () {
        delete this._extent;
        if (this.isEmpty()) {
            return;
        }
        this.forEach(function (geometry) {
            if (geometry && geometry._updateCache) {
                geometry._updateCache();
            }
        });
    },

    _removePainter:function () {
        if (this._painter) {
            this._painter.remove();
        }
        delete this._painter;
        this.forEach(function (geometry) {
            geometry._removePainter();
        });
    },

    _computeCenter:function (projection) {
        if (!projection || this.isEmpty()) {
            return null;
        }
        var sumX = 0, sumY = 0, counter = 0;
        var geometries = this.getGeometries();
        for (var i = 0, len = geometries.length; i < len; i++) {
            if (!geometries[i]) {
                continue;
            }
            var center = geometries[i]._computeCenter(projection);
            if (center) {
                sumX += center.x;
                sumY += center.y;
                counter++;
            }
        }
        if (counter === 0) {
            return null;
        }
        return new Z.Coordinate(sumX / counter, sumY / counter);
    },

    _containsPoint: function (point, t) {
        if (this.isEmpty()) {
            return false;
        }
        var i, len;
        var geometries = this.getGeometries();
        for (i = 0, len = geometries.length; i < len; i++) {
            if (geometries[i]._containsPoint(point, t)) {
                return true;
            }
        }

        return false;
    },

    _computeExtent:function (projection) {
        if (this.isEmpty()) {
            return null;
        }
        var geometries = this.getGeometries();
        var result = null;
        for (var i = 0, len = geometries.length; i < len; i++) {
            if (!geometries[i]) {
                continue;
            }
            var geoExtent = geometries[i]._computeExtent(projection);
            if (geoExtent) {
                result = geoExtent.combine(result);
            }
        }
        return result;
    },



    _computeGeodesicLength:function (projection) {
        if (!projection || this.isEmpty()) {
            return 0;
        }
        var geometries = this.getGeometries();
        var result = 0;
        for (var i = 0, len = geometries.length; i < len; i++) {
            if (!geometries[i]) {
                continue;
            }
            result += geometries[i]._computeGeodesicLength(projection);
        }
        return result;
    },

    _computeGeodesicArea:function (projection) {
        if (!projection || this.isEmpty()) {
            return 0;
        }
        var geometries = this.getGeometries();
        var result = 0;
        for (var i = 0, len = geometries.length; i < len; i++) {
            if (!geometries[i]) {
                continue;
            }
            result += geometries[i]._computeGeodesicArea(projection);
        }
        return result;
    },


    _exportGeoJSONGeometry:function () {
        var geoJSON = [];
        if (!this.isEmpty()) {
            var geometries = this.getGeometries();
            for (var i = 0, len = geometries.length; i < len; i++) {
                if (!geometries[i]) {
                    continue;
                }
                geoJSON.push(geometries[i]._exportGeoJSONGeometry());
            }
        }
        return {
            'type':         'GeometryCollection',
            'geometries':   geoJSON
        };
    },

    _clearProjection:function () {
        if (this.isEmpty()) {
            return;
        }
        var geometries = this.getGeometries();
        for (var i = 0, len = geometries.length; i < len; i++) {
            if (!geometries[i]) {
                continue;
            }
            geometries[i]._clearProjection();
        }

    },

    /**
     * Get connect points if being connected by [ConnectorLine]{@link maptalks.ConnectorLine}
     * @private
     * @return {maptalks.Coordinate[]}
     */
    _getConnectPoints: function () {
        var extent = this.getExtent();
        var anchors = [
            new Z.Coordinate(extent.xmin, extent.ymax),
            new Z.Coordinate(extent.xmax, extent.ymin),
            new Z.Coordinate(extent.xmin, extent.ymin),
            new Z.Coordinate(extent.xmax, extent.ymax)
        ];
        return anchors;
    },

    _getExternalResources:function () {
        if (this.isEmpty()) {
            return null;
        }
        var i, l, ii, ll;
        var geometries = this.getGeometries(),
            resources = [], symbol, res, cache = {}, key;
        for (i = 0, l = geometries.length; i < l; i++) {
            if (!geometries[i]) {
                continue;
            }
            symbol = geometries[i]._getInternalSymbol();
            res = Z.Util.getExternalResources(this._interpolateSymbol(symbol));
            if (!res) {
                continue;
            }
            for (ii = 0, ll = res.length; ii < ll; ii++) {
                key = res[ii].join();
                if (!cache[key]) {
                    resources.push(res[ii]);
                    cache[key] = 1;
                }
            }
        }
        return resources;
    },

//----------覆盖Geometry中的编辑相关方法-----------------


    startEdit:function (opts) {
        if (this.isEmpty()) {
            return this;
        }
        if (!opts) {
            opts = {};
        }
        if (opts['symbol']) {
            this._originalSymbol = this.getSymbol();
            this.setSymbol(opts['symbol']);
        }
        this._draggbleBeforeEdit = this.options['draggable'];
        this.config('draggable', false);
        var geometries = this.getGeometries();
        for (var i = 0, len = geometries.length; i < len; i++) {
            geometries[i].startEdit(opts);
        }
        this._editing = true;
        this.hide();
        var me = this;
        setTimeout(function () {
            me.fire('editstart');
        }, 1);
        return this;
    },


    endEdit:function () {
        if (this.isEmpty()) {
            return this;
        }
        var geometries = this.getGeometries();
        for (var i = 0, len = geometries.length; i < len; i++) {
            geometries[i].endEdit();
        }
        if (this._originalSymbol) {
            this.setSymbol(this._originalSymbol);
            delete this._originalSymbol;
        }
        this._editing = false;
        this.show();
        this.config('draggable', this._draggbleBeforeEdit);
        this.fire('editend');
        return this;
    },


    isEditing:function () {
        if (!this._editing) {
            return false;
        }
        return true;
    }
});
