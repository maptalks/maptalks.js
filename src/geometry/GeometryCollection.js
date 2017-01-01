import { isArray, isArrayHasData } from 'core/util';
import { getExternalResources } from 'core/util/resource';
import Coordinate from 'geo/Coordinate';
import VectorLayer from 'layer/VectorLayer';
import Geometry from './Geometry';

/**
 * @classdesc
 * Represents a GeometryCollection.
 * @class
 * @category geometry
 * @extends Geometry
 * @param {Geometry[]} geometries - GeometryCollection's geometries
 * @param {Object} [options=null] - options defined in [nGeometryCollection]{@link GeometryCollection#options}
 * @example
 * var marker = new Marker([0, 0]),
 *     line = new LineString([[0, 0], [0, 1]]),
 *     polygon = new Polygon([[0, 0], [0, 1], [1, 3]]);
 * var collection = new GeometryCollection([marker, line, polygon])
 *     .addTo(layer);
 */
export default class GeometryCollection extends Geometry {

    constructor(geometries, opts) {
        super();
        this.type = 'GeometryCollection';
        this._initOptions(opts);
        this.setGeometries(geometries);
    }

    /**
     * Set new geometries to the geometry collection
     * @param {Geometry[]} geometries
     * @return {GeometryCollection} this
     * @fires GeometryCollection#shapechange
     */
    setGeometries(_geometries) {
        var geometries = this._checkGeometries(_geometries);
        //Set the collection as child geometries' parent.
        if (isArray(geometries)) {
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
            this.onShapeChanged();
        }
        return this;
    }

    /**
     * Get geometries of the geometry collection
     * @return {Geometry[]} geometries
     */
    getGeometries() {
        if (!this._geometries) {
            return [];
        }
        return this._geometries;
    }

    /**
     * Executes the provided callback once for each geometry present in the collection in order.
     * @param  {Function} fn             - a callback function
     * @param  {*} [context=undefined]   - callback's context
     * @return {GeometryCollection} this
     */
    forEach(fn, context) {
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
    }

    /**
     * Creates a GeometryCollection with all elements that pass the test implemented by the provided function.
     * @param  {Function} fn      - Function to test each geometry
     * @param  {*} [context=undefined]    - Function's context
     * @return {GeometryCollection} A GeometryCollection with all elements that pass the test
     */
    filter() {
        return VectorLayer.prototype.filter.apply(this, arguments);
    }

    /**
     * Translate or move the geometry collection by the given offset.
     * @param  {Coordinate} offset - translate offset
     * @return {GeometryCollection} this
     */
    translate(offset) {
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
    }

    /**
     * Whether the geometry collection is empty
     * @return {Boolean}
     */
    isEmpty() {
        return !isArrayHasData(this.getGeometries());
    }

    /**
     * remove itself from the layer if any.
     * @returns {Geometry} this
     * @fires GeometryCollection#removestart
     * @fires GeometryCollection#remove
     * @fires GeometryCollection#removeend
     */
    remove() {
        this.forEach(function (geometry) {
            geometry._unbind();
        });
        return Geometry.prototype.remove.apply(this, arguments);
    }

    /**
     * Show the geometry collection.
     * @return {GeometryCollection} this
     * @fires GeometryCollection#show
     */
    show() {
        this.options['visible'] = true;
        this.forEach(function (geometry) {
            geometry.show();
        });
        return this;
    }

    /**
     * Hide the geometry collection.
     * @return {GeometryCollection} this
     * @fires GeometryCollection#hide
     */
    hide() {
        this.options['visible'] = false;
        this.forEach(function (geometry) {
            geometry.hide();
        });
        return this;
    }

    setSymbol(symbol) {
        symbol = this._prepareSymbol(symbol);
        this._symbol = symbol;
        this.forEach(function (geometry) {
            geometry.setSymbol(symbol);
        });
        this.onSymbolChanged();
        return this;
    }

    updateSymbol(symbol) {
        this.forEach(function (geometry) {
            geometry.updateSymbol(symbol);
        });
        this.onSymbolChanged();
        return this;
    }

    onConfig(config) {
        this.forEach(function (geometry) {
            geometry.config(config);
        });
    }

    _setExternSymbol(symbol) {
        symbol = this._prepareSymbol(symbol);
        this._externSymbol = symbol;
        this.forEach(function (geometry) {
            geometry._setExternSymbol(symbol);
        });
        this.onSymbolChanged();
        return this;
    }

    /**
     * bind this geometry collection to a layer
     * @param  {Layer} layer
     * @private
     */
    _bindLayer() {
        Geometry.prototype._bindLayer.apply(this, arguments);
        this._bindGeometriesToLayer();
    }

    _bindGeometriesToLayer() {
        var layer = this.getLayer();
        this.forEach(function (geometry) {
            geometry._bindLayer(layer);
        });
    }

    /**
     * Check whether the type of geometries is valid
     * @param  {Geometry[]} geometries - geometries to check
     * @private
     */
    _checkGeometries(geometries) {
        var invalidGeoError = 'The geometry added to collection is invalid.';
        if (geometries && !isArray(geometries)) {
            if (geometries instanceof Geometry) {
                return [geometries];
            } else {
                throw new Error(invalidGeoError);
            }
        } else if (isArray(geometries)) {
            for (var i = 0, len = geometries.length; i < len; i++) {
                if (!(geometries[i] instanceof Geometry)) {
                    throw new Error(invalidGeoError + ' Index: ' + i);
                }
            }
            return geometries;
        }
        return null;
    }

    _updateCache() {
        delete this._extent;
        if (this.isEmpty()) {
            return;
        }
        this.forEach(function (geometry) {
            if (geometry && geometry._updateCache) {
                geometry._updateCache();
            }
        });
    }

    _removePainter() {
        if (this._painter) {
            this._painter.remove();
        }
        delete this._painter;
        this.forEach(function (geometry) {
            geometry._removePainter();
        });
    }

    _computeCenter(projection) {
        if (!projection || this.isEmpty()) {
            return null;
        }
        var sumX = 0,
            sumY = 0,
            counter = 0;
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
        return new Coordinate(sumX / counter, sumY / counter);
    }

    _containsPoint(point, t) {
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
    }

    _computeExtent(projection) {
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
    }

    _computeGeodesicLength(projection) {
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
    }

    _computeGeodesicArea(projection) {
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
    }

    _exportGeoJSONGeometry() {
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
            'type': 'GeometryCollection',
            'geometries': geoJSON
        };
    }

    _clearProjection() {
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

    }

    /**
     * Get connect points if being connected by [ConnectorLine]{@link ConnectorLine}
     * @private
     * @return {Coordinate[]}
     */
    _getConnectPoints() {
        var extent = this.getExtent();
        var anchors = [
            new Coordinate(extent.xmin, extent.ymax),
            new Coordinate(extent.xmax, extent.ymin),
            new Coordinate(extent.xmin, extent.ymin),
            new Coordinate(extent.xmax, extent.ymax)
        ];
        return anchors;
    }

    _getExternalResources() {
        if (this.isEmpty()) {
            return null;
        }
        var i, l, ii, ll;
        var geometries = this.getGeometries(),
            resources = [],
            symbol, res, cache = {},
            key;
        for (i = 0, l = geometries.length; i < l; i++) {
            if (!geometries[i]) {
                continue;
            }
            symbol = geometries[i]._getInternalSymbol();
            res = getExternalResources(symbol);
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
    }

    //----------覆盖Geometry中的编辑相关方法-----------------
    startEdit(opts) {
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
        setTimeout(() => {
            this.fire('editstart');
        }, 1);
        return this;
    }

    endEdit() {
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
    }

    isEditing() {
        if (!this._editing) {
            return false;
        }
        return true;
    }
}
