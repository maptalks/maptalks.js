import { isFunction, isArrayHasData, isNil } from '../core/util';
import { createFilter, getFilterFeature } from '@maptalks/feature-filter';
import { getExternalResources } from '../core/util/resource';
import Coordinate from '../geo/Coordinate';
import PointExtent from '../geo/PointExtent';
import Extent from '../geo/Extent';
import Geometry from './Geometry';

const TEMP_EXTENT = new PointExtent();

/**
 * @classdesc
 * Represents a GeometryCollection.
 * @category geometry
 * @extends Geometry
 * @example
 * var marker = new Marker([0, 0]),
 *     line = new LineString([[0, 0], [0, 1]]),
 *     polygon = new Polygon([[0, 0], [0, 1], [1, 3]]);
 * var collection = new GeometryCollection([marker, line, polygon])
 *     .addTo(layer);
 */
class GeometryCollection extends Geometry {

    /**
     * @param {Geometry[]} geometries - GeometryCollection's geometries
     * @param {Object} [options=null] - options defined in [nGeometryCollection]{@link GeometryCollection#options}
     */
    constructor(geometries, opts) {
        super(opts);
        this.type = 'GeometryCollection';
        this.setGeometries(geometries);
    }

    getContainerExtent(out) {
        const extent = out || new PointExtent();
        this.forEach(geo => {
            extent._combine(geo.getContainerExtent(TEMP_EXTENT));
        });
        return extent;
    }

    /**
     * Set new geometries to the geometry collection
     * @param {Geometry[]} geometries
     * @return {GeometryCollection} this
     * @fires GeometryCollection#shapechange
     */
    setGeometries(_geometries) {
        const geometries = this._checkGeometries(_geometries || []);
        const symbol = this._getSymbol();
        const options = this.config();
        //Set the collection as child geometries' parent.
        for (let i = geometries.length - 1; i >= 0; i--) {
            geometries[i]._initOptions(options);
            geometries[i]._setParent(this);
            geometries[i]._setEventParent(this);
            if (symbol) {
                geometries[i].setSymbol(symbol);
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
        return this._geometries || [];
    }

    /**
     * Executes the provided callback once for each geometry present in the collection in order.
     * @param  {Function} fn             - a callback function
     * @param  {*} [context=undefined]   - callback's context
     * @return {GeometryCollection} this
     */
    forEach(fn, context) {
        const geometries = this.getGeometries();
        for (let i = 0, l = geometries.length; i < l; i++) {
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
     * @example
     * var filtered = collection.filter(['==', 'foo', 'bar]);
     * @example
     * var filtered = collection.filter(geometry => geometry.getProperties().foo === 'bar');
     */
    filter(fn, context) {
        if (!fn) {
            return new GeometryCollection();
        }
        const selected = [];
        const isFn = isFunction(fn);
        const filter = isFn ? fn : createFilter(fn);

        this.forEach(geometry => {
            const g = isFn ? geometry : getFilterFeature(geometry);
            if (context ? filter.call(context, g) : filter(g)) {
                selected.push(geometry);
            }
        }, this);

        return new GeometryCollection(selected);
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
        const args = arguments;
        this.forEach(function (geometry) {
            if (geometry && geometry.translate) {
                geometry.translate.apply(geometry, args);
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

    onConfig(config) {
        this.forEach(function (geometry) {
            geometry.config(config);
        });
    }

    getSymbol() {
        let s = super.getSymbol();
        if (!s) {
            const symbols = [];
            let is = false;
            this.forEach(g => {
                const symbol = g.getSymbol();
                if (symbol && !is) {
                    is = true;
                }
                symbols.push(g.getSymbol());
            });
            if (is) {
                s = {
                    'children': symbols
                };
            }
        }
        return s;
    }

    setSymbol(s) {
        if (s && s['children']) {
            this._symbol = null;
            this.forEach((g, i) => {
                g._eventSymbolProperties = this._eventSymbolProperties;
                g.setSymbol(s['children'][i]);
            });
        } else {
            const symbol = this._prepareSymbol(s);
            this._symbol = symbol;
            this.forEach(g => {
                g._eventSymbolProperties = this._eventSymbolProperties;
                g.setSymbol(symbol);
            });
        }
        this.onSymbolChanged();
        return this;
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
        super._bindLayer.apply(this, arguments);
        this._bindGeometriesToLayer();
    }

    _bindGeometriesToLayer() {
        const layer = this.getLayer();
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
        const invalidGeoError = 'The geometry added to collection is invalid.';
        if (geometries && !Array.isArray(geometries)) {
            if (geometries instanceof Geometry) {
                return [geometries];
            } else {
                throw new Error(invalidGeoError);
            }
        } else {
            for (let i = 0, l = geometries.length; i < l; i++) {
                if (!this._checkGeo(geometries[i])) {
                    throw new Error(invalidGeoError + ' Index: ' + i);
                }
            }
            return geometries;
        }
    }

    _checkGeo(geo) {
        return (geo instanceof Geometry);
    }

    _updateCache() {
        this._clearCache();
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
        let sumX = 0,
            sumY = 0,
            counter = 0;
        const geometries = this.getGeometries();
        for (let i = 0, l = geometries.length; i < l; i++) {
            if (!geometries[i]) {
                continue;
            }
            const center = geometries[i]._computeCenter(projection);
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
        delete this._pickGeometryIndex;
        const geometries = this.getGeometries();
        for (let i = 0, l = geometries.length; i < l; i++) {
            if (geometries[i]._containsPoint(point, t)) {
                this._pickGeometryIndex = i;
                return true;
            }
        }
        return false;
    }

    _computeExtent(projection) {
        return computeExtent.call(this, projection, '_computeExtent');
    }

    _computePrjExtent(projection) {
        return computeExtent.call(this, projection, '_computePrjExtent');
    }

    _computeGeodesicLength(projection) {
        if (!projection || this.isEmpty()) {
            return 0;
        }
        const geometries = this.getGeometries();
        let result = 0;
        for (let i = 0, l = geometries.length; i < l; i++) {
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
        const geometries = this.getGeometries();
        let result = 0;
        for (let i = 0, l = geometries.length; i < l; i++) {
            if (!geometries[i]) {
                continue;
            }
            result += geometries[i]._computeGeodesicArea(projection);
        }
        return result;
    }

    //for toGeoJSON
    _exportGeoJSONGeometry() {
        const children = [];
        if (!this.isEmpty()) {
            const geometries = this.getGeometries();
            for (let i = 0, l = geometries.length; i < l; i++) {
                if (!geometries[i]) {
                    continue;
                }
                children.push(geometries[i]._exportGeoJSONGeometry());
            }
        }
        return {
            'type': 'GeometryCollection',
            'geometries': children
        };
    }
    //for toJSON
    _toJSON(options) {
        //Geometry了用的是toGeoJSON(),如果里面包含特殊图形(Circle等),就不能简单的用toGeoJSON代替了，否则反序列化回来就不是原来的图形了
        const feature = {
            'type': 'Feature',
            'geometry': {
                'type': 'GeometryCollection',
                'geometries': this.getGeometries().filter(geo => {
                    return geo && geo._toJSON;
                }).map(geo => {
                    const json = geo._toJSON();
                    if (json.subType) {
                        return json;
                    }
                    return geo._exportGeoJSONGeometry();
                })
            }
        };
        const id = this.getId();
        if (!isNil(id)) {
            feature['id'] = id;
        }
        let properties;
        if (isNil(options['properties']) || options['properties']) {
            properties = this._exportProperties();
        }
        feature['properties'] = properties;
        options.feature = feature;
        return options;
    }

    _clearProjection() {
        if (this.isEmpty()) {
            return;
        }
        const geometries = this.getGeometries();
        for (let i = 0, l = geometries.length; i < l; i++) {
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
        const extent = this.getExtent();
        const anchors = [
            new Coordinate(extent.xmin, extent.ymax),
            new Coordinate(extent.xmax, extent.ymin),
            new Coordinate(extent.xmin, extent.ymin),
            new Coordinate(extent.xmax, extent.ymax)
        ];
        return anchors;
    }

    _getExternalResources() {
        if (this.isEmpty()) {
            return [];
        }
        const geometries = this.getGeometries(),
            resources = [];
        const cache = {};
        let symbol, res, key;
        for (let i = 0, l = geometries.length; i < l; i++) {
            if (!geometries[i]) {
                continue;
            }
            symbol = geometries[i]._getInternalSymbol();
            res = getExternalResources(symbol);
            for (let ii = 0, ll = res.length; ii < ll; ii++) {
                key = res[ii].join();
                if (!cache[key]) {
                    resources.push(res[ii]);
                    cache[key] = 1;
                }
            }
        }
        return resources;
    }

    //----------Overrides editor methods in Geometry-----------------

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
        const geometries = this.getGeometries();
        for (let i = 0, l = geometries.length; i < l; i++) {
            geometries[i].startEdit(opts);
        }
        this._editing = true;
        const layer = this.getLayer();
        const needShadow = layer && layer.options['renderer'] === 'canvas';
        if (needShadow) {
            this.hide();
        }
        setTimeout(() => {
            this.fire('editstart');
        }, 1);
        return this;
    }

    endEdit() {
        if (this.isEmpty()) {
            return this;
        }
        const geometries = this.getGeometries();
        for (let i = 0, l = geometries.length; i < l; i++) {
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

    // copy() {
    //     const geometries = this.getGeometries().map(geo => {
    //         return geo.copy();
    //     });
    //     return new GeometryCollection(geometries, extend({}, this.options));
    // }
}

GeometryCollection.registerJSONType('GeometryCollection');

export default GeometryCollection;

function computeExtent(projection, fn) {
    if (this.isEmpty()) {
        return null;
    }
    const extent = new Extent();
    const geometries = this.getGeometries();
    for (let i = 0, l = geometries.length; i < l; i++) {
        if (!geometries[i]) {
            continue;
        }
        const e = geometries[i][fn](projection);
        if (e) {
            extent._combine(e);
        }
    }

    return extent;
}
