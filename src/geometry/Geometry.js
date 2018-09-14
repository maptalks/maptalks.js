import { GEOMETRY_COLLECTION_TYPES, NUMERICAL_PROPERTIES } from '../core/Constants';
import Class from '../core/Class';
import Eventable from '../core/Eventable';
import JSONAble from '../core/JSONAble';
import Handlerable from '../handler/Handlerable';
import {
    extend,
    isNil,
    isString,
    isNumber,
    isObject,
    forEachCoord,
    flash
} from '../core/util';
import { extendSymbol } from '../core/util/style';
import { convertResourceUrl, getExternalResources } from '../core/util/resource';
import Coordinate from '../geo/Coordinate';
import Extent from '../geo/Extent';
import Painter from '../renderer/geometry/Painter';
import CollectionPainter from '../renderer/geometry/CollectionPainter';
import SpatialReference from '../map/spatial-reference/SpatialReference';

/**
 * @property {Object} options                       - geometry options
 * @property {Boolean} [options.id=null]            - id of the geometry
 * @property {Boolean} [options.visible=true]       - whether the geometry is visible.
 * @property {Boolean} [options.editable=true]      - whether the geometry can be edited.
 * @property {Boolean} [options.interactive=true]   - whether the geometry can be interactived.
 * @property {String} [options.cursor=null]         - cursor style when mouseover the geometry, same as the definition in CSS.
 * @property {String} [options.measure=EPSG:4326]   - the measure code for the geometry, defines {@tutorial measureGeometry how it can be measured}.
 * @property {Boolean} [options.draggable=false]    - whether the geometry can be dragged.
 * @property {Boolean} [options.dragShadow=true]    - if true, during geometry dragging, a shadow will be dragged before geometry was moved.
 * @property {Boolean} [options.dragOnAxis=null]    - if set, geometry can only be dragged along the specified axis, possible values: x, y
 * @property {Number}  [options.zIndex=undefined]   - geometry's initial zIndex
 * @memberOf Geometry
 * @instance
 */
const options = {
    'id': null,
    'visible': true,
    'interactive':true,
    'editable': true,
    'cursor': null,
    'defaultProjection': 'EPSG:4326' // BAIDU, IDENTITY
};

/**
 * Base class for all the geometries. <br/>
 * It defines common methods that all the geometry classes share. <br>
 * It is abstract and not intended to be instantiated but extended.
 *
 * @category geometry
 * @abstract
 * @extends Class
 * @mixes Eventable
 * @mixes Handlerable
 * @mixes JSONAble
 * @mixes ui.Menuable
 */
class Geometry extends JSONAble(Eventable(Handlerable(Class))) {

    constructor(options) {
        const opts = extend({}, options);
        const symbol = opts['symbol'];
        const properties = opts['properties'];
        const id = opts['id'];
        delete opts['symbol'];
        delete opts['id'];
        delete opts['properties'];
        super(opts);
        if (symbol) {
            this.setSymbol(symbol);
        }
        if (properties) {
            this.setProperties(properties);
        }
        if (!isNil(id)) {
            this.setId(id);
        }
    }

    /**
     * Returns the first coordinate of the geometry.
     *
     * @return {Coordinate} First Coordinate
     */
    getFirstCoordinate() {
        if (this.type === 'GeometryCollection') {
            const geometries = this.getGeometries();
            if (!geometries.length) {
                return null;
            }
            return geometries[0].getFirstCoordinate();
        }
        let coordinates = this.getCoordinates();
        if (!Array.isArray(coordinates)) {
            return coordinates;
        }
        do {
            coordinates = coordinates[0];
        } while (Array.isArray(coordinates) && coordinates.length > 0);
        return coordinates;
    }

    /**
     * Returns the last coordinate of the geometry.
     *
     * @return {Coordinate} Last Coordinate
     */
    getLastCoordinate() {
        if (this.type === 'GeometryCollection') {
            const geometries = this.getGeometries();
            if (!geometries.length) {
                return null;
            }
            return geometries[geometries.length - 1].getLastCoordinate();
        }
        let coordinates = this.getCoordinates();
        if (!Array.isArray(coordinates)) {
            return coordinates;
        }
        do {
            coordinates = coordinates[coordinates.length - 1];
        } while (Array.isArray(coordinates) && coordinates.length > 0);
        return coordinates;
    }

    /**
     * Adds the geometry to a layer
     * @param {Layer} layer    - layer add to
     * @param {Boolean} [fitview=false] - automatically set the map to a fit center and zoom for the geometry
     * @return {Geometry} this
     * @fires Geometry#add
     */
    addTo(layer, fitview) {
        layer.addGeometry(this, fitview);
        return this;
    }

    /**
     * Get the layer which this geometry added to.
     * @returns {Layer} - layer added to
     */
    getLayer() {
        if (!this._layer) {
            return null;
        }
        return this._layer;
    }

    /**
     * Get the map which this geometry added to
     * @returns {Map} - map added to
     */
    getMap() {
        if (!this._layer) {
            return null;
        }
        return this._layer.getMap();
    }

    /**
     * Gets geometry's id. Id is set by setId or constructor options.
     * @returns {String|Number} geometry的id
     */
    getId() {
        return this._id;
    }

    /**
     * Set geometry's id.
     * @param {String} id - new id
     * @returns {Geometry} this
     * @fires Geometry#idchange
     */
    setId(id) {
        const oldId = this.getId();
        this._id = id;
        /**
         * idchange event.
         *
         * @event Geometry#idchange
         * @type {Object}
         * @property {String} type - idchange
         * @property {Geometry} target - the geometry fires the event
         * @property {String|Number} old        - value of the old id
         * @property {String|Number} new        - value of the new id
         */
        this._fireEvent('idchange', {
            'old': oldId,
            'new': id
        });

        return this;
    }

    /**
     * Get geometry's properties. Defined by GeoJSON as [feature's properties]{@link http://geojson.org/geojson-spec.html#feature-objects}.
     *
     * @returns {Object} properties
     */
    getProperties() {
        if (!this.properties) {
            if (this._getParent()) {
                return this._getParent().getProperties();
            }
            return null;
        }
        return this.properties;
    }

    /**
     * Set a new properties to geometry.
     * @param {Object} properties - new properties
     * @returns {Geometry} this
     * @fires Geometry#propertieschange
     */
    setProperties(properties) {
        const old = this.properties;
        this.properties = isObject(properties) ? extend({}, properties) : properties;
        this._repaint();
        /**
         * propertieschange event, thrown when geometry's properties is changed.
         *
         * @event Geometry#propertieschange
         * @type {Object}
         * @property {String} type - propertieschange
         * @property {Geometry} target - the geometry fires the event
         * @property {String|Number} old        - value of the old properties
         * @property {String|Number} new        - value of the new properties
         */
        this._fireEvent('propertieschange', {
            'old': old,
            'new': properties
        });

        return this;
    }

    /**
     * Get type of the geometry, e.g. "Point", "LineString"
     * @returns {String} type of the geometry
     */
    getType() {
        return this.type;
    }

    /**
     * Get symbol of the geometry
     * @returns {Object} geometry's symbol
     */
    getSymbol() {
        const s = this._symbol;
        if (s) {
            if (!Array.isArray(s)) {
                return extend({}, s);
            } else {
                return extendSymbol(s);
            }
        }
        return null;
    }

    /**
     * Set a new symbol to style the geometry.
     * @param {Object} symbol - new symbol
     * @see {@tutorial symbol Style a geometry with symbols}
     * @return {Geometry} this
     * @fires Geometry#symbolchange
     */
    setSymbol(symbol) {
        this._symbol = this._prepareSymbol(symbol);
        this.onSymbolChanged();
        return this;
    }

    /**
     * Update geometry's current symbol.
     *
     * @param  {Object} props - symbol properties to update
     * @return {Geometry} this
     * @fires Geometry#symbolchange
     * @example
     * var marker = new Marker([0, 0], {
     *    symbol : {
     *       markerType : 'ellipse',
     *       markerWidth : 20,
     *       markerHeight : 30
     *    }
     * });
     * // update symbol's markerWidth to 40
     * marker.updateSymbol({
     *     markerWidth : 40
     * });
     */
    updateSymbol(props) {
        if (!props) {
            return this;
        }
        let s = this._getSymbol();
        if (s) {
            s = extendSymbol(s, props);
        } else {
            s = extendSymbol(this._getInternalSymbol(), props);
        }
        return this.setSymbol(s);
    }

    /**
     * Get the geographical center of the geometry.
     *
     * @returns {Coordinate}
     */
    getCenter() {
        return this._computeCenter(this._getMeasurer());
    }

    /**
     * Get the geometry's geographical extent
     *
     * @returns {Extent} geometry's extent
     */
    getExtent() {
        const prjExt = this._getPrjExtent();
        if (prjExt) {
            const p = this._getProjection();
            const min = p.unproject(new Coordinate(prjExt['xmin'], prjExt['ymin'])),
                max = p.unproject(new Coordinate(prjExt['xmax'], prjExt['ymax']));
            return new Extent(min, max, this._getProjection());
        } else {
            return this._computeExtent(this._getMeasurer());
        }
    }

    /**
     * Get geometry's screen extent in pixel
     *
     * @returns {PointExtent}
     */
    getContainerExtent() {
        const painter = this._getPainter();
        return painter ? painter.getContainerExtent() : null;
    }

    /**
     * Get pixel size of the geometry, which may vary in different zoom levels.
     *
     * @returns {Size}
     */
    getSize() {
        const extent = this.getContainerExtent();
        return extent ? extent.getSize() : null;
    }

    /**
     * Whehter the geometry contains the input container point.
     *
     * @param  {Point|Coordinate} point - input container point or coordinate
     * @param  {Number} [t=undefined] - tolerance in pixel
     * @return {Boolean}
     * @example
     * var circle = new Circle([0, 0], 1000)
     *     .addTo(layer);
     * var contains = circle.containsPoint([400, 300]);
     */
    containsPoint(containerPoint, t) {
        if (!this.getMap()) {
            throw new Error('The geometry is required to be added on a map to perform "containsPoint".');
        }
        if (containerPoint instanceof Coordinate) {
            containerPoint = this.getMap().coordToContainerPoint(containerPoint);
        }
        return this._containsPoint(containerPoint, t);
        // return this._containsPoint(this.getMap()._containerPointToPoint(new Point(containerPoint)), t);
    }

    _containsPoint(containerPoint, t) {
        const painter = this._getPainter();
        if (!painter) {
            return false;
        }
        if (isNil(t) && this._hitTestTolerance) {
            t = this._hitTestTolerance();
        }
        return painter.hitTest(containerPoint, t);
    }

    /**
     * Show the geometry.
     *
     * @return {Geometry} this
     * @fires Geometry#show
     */
    show() {
        this.options['visible'] = true;
        if (this.getMap()) {
            const painter = this._getPainter();
            if (painter) {
                painter.show();
            }
            /**
             * show event
             *
             * @event Geometry#show
             * @type {Object}
             * @property {String} type - show
             * @property {Geometry} target - the geometry fires the event
             */
            this._fireEvent('show');
        }
        return this;
    }

    /**
     * Hide the geometry
     *
     * @return {Geometry} this
     * @fires Geometry#hide
     */
    hide() {
        this.options['visible'] = false;
        if (this.getMap()) {
            this.onHide();
            const painter = this._getPainter();
            if (painter) {
                painter.hide();
            }
            /**
             * hide event
             *
             * @event Geometry#hide
             * @type {Object}
             * @property {String} type - hide
             * @property {Geometry} target - the geometry fires the event
             */
            this._fireEvent('hide');
        }
        return this;
    }

    /**
     * Whether the geometry is visible
     *
     * @returns {Boolean}
     */
    isVisible() {
        if (!this.options['visible']) {
            return false;
        }
        const symbol = this._getInternalSymbol();
        if (!symbol) {
            return true;
        }
        if (Array.isArray(symbol)) {
            if (!symbol.length) {
                return true;
            }
            for (let i = 0, l = symbol.length; i < l; i++) {
                if (isNil(symbol[i]['opacity']) || symbol[i]['opacity'] > 0) {
                    return true;
                }
            }
            return false;
        } else {
            return (isNil(symbol['opacity']) || (isNumber(symbol['opacity']) && symbol['opacity'] > 0));
        }
    }

    /**
     * Get zIndex of the geometry, default is 0
     * @return {Number} zIndex
     */
    getZIndex() {
        return this.options['zIndex'] || 0;
    }

    /**
     * Set a new zIndex to Geometry and fire zindexchange event (will cause layer to sort geometries and render)
     * @param {Number} zIndex - new zIndex
     * @return {Geometry} this
     * @fires Geometry#zindexchange
     */
    setZIndex(zIndex) {
        const old = this.options['zIndex'];
        this.options['zIndex'] = zIndex;
        /**
         * zindexchange event, fired when geometry's zIndex is changed.
         *
         * @event Geometry#zindexchange
         * @type {Object}
         * @property {String} type - zindexchange
         * @property {Geometry} target - the geometry fires the event
         * @property {Number} old        - old zIndex
         * @property {Number} new        - new zIndex
         */
        this._fireEvent('zindexchange', {
            'old': old,
            'new': zIndex
        });

        return this;
    }

    /**
     * Only set a new zIndex to Geometry without firing zindexchange event. <br>
     * Can be useful to improve perf when a lot of geometries' zIndex need to be updated. <br>
     * When updated N geometries, You can use setZIndexSilently with (N-1) geometries and use setZIndex with the last geometry for layer to sort and render.
     * @param {Number} zIndex - new zIndex
     * @return {Geometry} this
     */
    setZIndexSilently(zIndex) {
        this.options['zIndex'] = zIndex;
        return this;
    }

    /**
     * Bring the geometry on the top
     * @return {Geometry} this
     * @fires Geometry#zindexchange
     */
    bringToFront() {
        const layer = this.getLayer();
        if (!layer || !layer.getGeoMaxZIndex) {
            return this;
        }
        const topZ = layer.getGeoMaxZIndex();
        this.setZIndex(topZ + 1);
        return this;
    }

    /**
     * Bring the geometry to the back
     * @return {Geometry} this
     * @fires Geometry#zindexchange
     */
    bringToBack() {
        const layer = this.getLayer();
        if (!layer || !layer.getGeoMinZIndex) {
            return this;
        }
        const bottomZ = layer.getGeoMinZIndex();
        this.setZIndex(bottomZ - 1);
        return this;
    }

    /**
     * Translate or move the geometry by the given offset.
     *
     * @param  {Coordinate} offset - translate offset
     * @return {Geometry} this
     * @fires Geometry#positionchange
     * @fires Geometry#shapechange
     */
    /**
     * Translate or move the geometry by the given offset.
     *
     * @param  {Number} x - x offset
     * @param  {Number} y - y offset
     * @return {Geometry} this
     * @fires Geometry#positionchange
     * @fires Geometry#shapechange
     */
    translate(x, y) {
        if (isNil(x)) {
            return this;
        }
        const offset = new Coordinate(x, y);
        if (offset.x === 0 && offset.y === 0) {
            return this;
        }
        const coordinates = this.getCoordinates();
        if (coordinates) {
            if (Array.isArray(coordinates)) {
                const translated = forEachCoord(coordinates, function (coord) {
                    return coord.add(offset);
                });
                this.setCoordinates(translated);
            } else {
                this.setCoordinates(coordinates.add(offset));
            }
        }
        return this;
    }

    /**
     * Flash the geometry, show and hide by certain internal for times of count.
     *
     * @param {Number} [interval=100]     - interval of flash, in millisecond (ms)
     * @param {Number} [count=4]          - flash times
     * @param {Function} [cb=null]        - callback function when flash ended
     * @param {*} [context=null]          - callback context
     * @return {Geometry} this
     */
    flash(interval, count, cb, context) {
        return flash.call(this, interval, count, cb, context);
    }

    /**
     * Returns a copy of the geometry without the event listeners.
     * @returns {Geometry} copy
     */
    copy() {
        const json = this.toJSON();
        const ret = Geometry.fromJSON(json);
        //restore visibility
        ret.options['visible'] = true;
        return ret;
    }


    /**
     * remove itself from the layer if any.
     * @returns {Geometry} this
     * @fires Geometry#removestart
     * @fires Geometry#remove
     */
    remove() {
        const layer = this.getLayer();
        if (!layer) {
            return this;
        }
        /**
         * removestart event.
         *
         * @event Geometry#removestart
         * @type {Object}
         * @property {String} type - removestart
         * @property {Geometry} target - the geometry fires the event
         */
        this._fireEvent('removestart');

        this._unbind();
        /**
         * removeend event.
         *
         * @event Geometry#removeend
         * @type {Object}
         * @property {String} type - removeend
         * @property {Geometry} target - the geometry fires the event
         */
        this._fireEvent('removeend');
        /**
         * remove event.
         *
         * @event Geometry#remove
         * @type {Object}
         * @property {String} type - remove
         * @property {Geometry} target - the geometry fires the event
         */
        this._fireEvent('remove');
        return this;
    }

    /**
     * Exports [geometry]{@link http://geojson.org/geojson-spec.html#feature-objects} out of a GeoJSON feature.
     * @return {Object} GeoJSON Geometry
     */
    toGeoJSONGeometry() {
        const gJson = this._exportGeoJSONGeometry();
        return gJson;
    }

    /**
     * Exports a GeoJSON feature.
     * @param {Object} [opts=null]              - export options
     * @param {Boolean} [opts.geometry=true]    - whether export geometry
     * @param {Boolean} [opts.properties=true]  - whether export properties
     * @returns {Object} GeoJSON Feature
     */
    toGeoJSON(opts) {
        if (!opts) {
            opts = {};
        }
        const feature = {
            'type': 'Feature',
            'geometry': null
        };
        if (isNil(opts['geometry']) || opts['geometry']) {
            const geoJSON = this._exportGeoJSONGeometry();
            feature['geometry'] = geoJSON;
        }
        const id = this.getId();
        if (!isNil(id)) {
            feature['id'] = id;
        }
        let properties;
        if (isNil(opts['properties']) || opts['properties']) {
            properties = this._exportProperties();
        }
        feature['properties'] = properties;
        return feature;
    }

    /**
     * Export a profile json out of the geometry. <br>
     * Besides exporting the feature object, a profile json also contains symbol, construct options and infowindow info.<br>
     * The profile json can be stored somewhere else and be used to reproduce the geometry later.<br>
     * Due to the problem of serialization for functions, event listeners and contextmenu are not included in profile json.
     * @example
     *     // an example of a profile json.
     * var profile = {
            "feature": {
                  "type": "Feature",
                  "id" : "point1",
                  "geometry": {"type": "Point", "coordinates": [102.0, 0.5]},
                  "properties": {"prop0": "value0"}
            },
            //construct options.
            "options":{
                "draggable" : true
            },
            //symbol
            "symbol":{
                "markerFile"  : "http://foo.com/icon.png",
                "markerWidth" : 20,
                "markerHeight": 20
            },
            //infowindow info
            "infowindow" : {
                "options" : {
                    "style" : "black"
                },
                "title" : "this is a infowindow title",
                "content" : "this is a infowindow content"
            }
        };
     * @param {Object}  [options=null]          - export options
     * @param {Boolean} [opts.geometry=true]    - whether export feature's geometry
     * @param {Boolean} [opts.properties=true]  - whether export feature's properties
     * @param {Boolean} [opts.options=true]     - whether export construct options
     * @param {Boolean} [opts.symbol=true]      - whether export symbol
     * @param {Boolean} [opts.infoWindow=true]  - whether export infowindow
     * @return {Object} profile json object
     */
    toJSON(options) {
        //一个Graphic的profile
        /*
            //因为响应函数无法被序列化, 所以menu, 事件listener等无法被包含在graphic中
        }*/
        if (!options) {
            options = {};
        }
        const json = this._toJSON(options);
        const other = this._exportGraphicOptions(options);
        extend(json, other);
        return json;
    }

    /**
     * Get the geographic length of the geometry.
     * @returns {Number} geographic length, unit is meter
     */
    getLength() {
        return this._computeGeodesicLength(this._getMeasurer());
    }

    /**
     * Get the geographic area of the geometry.
     * @returns {Number} geographic area, unit is sq.meter
     */
    getArea() {
        return this._computeGeodesicArea(this._getMeasurer());
    }

    /**
     * Rotate the geometry of given angle around a pivot point
     * @param {Number} angle - angle to rotate in degree
     * @param {Coordinate} [pivot=null]  - optional, will be the geometry's center by default
     * @returns {Geometry} this
     */
    rotate(angle, pivot) {
        if (this.type === 'GeometryCollection') {
            const geometries = this.getGeometries();
            geometries.forEach(g => g.rotate(angle, pivot));
            return this;
        }
        if (!pivot) {
            pivot = this.getCenter();
        } else {
            pivot = new Coordinate(pivot);
        }
        const measurer = this._getMeasurer();
        const coordinates = this.getCoordinates();
        if (!Array.isArray(coordinates)) {
            if (pivot.x !== coordinates.x || pivot.y !== coordinates.y) {
                const c = measurer._rotate(coordinates, pivot, angle);
                this.setCoordinates(c);
            }
            return this;
        }
        forEachCoord(coordinates, c => {
            return measurer._rotate(c, pivot, angle);
        });
        this.setCoordinates(coordinates);
        return this;
    }

    /**
     * Get the connect points for [ConnectorLine]{@link ConnectorLine}
     * @return {Coordinate[]} connect points
     * @private
     */
    _getConnectPoints() {
        return [this.getCenter()];
    }

    //options initializing
    _initOptions(options) {
        const opts = extend({}, options);
        const symbol = opts['symbol'];
        const properties = opts['properties'];
        const id = opts['id'];
        delete opts['symbol'];
        delete opts['id'];
        delete opts['properties'];
        this.setOptions(opts);
        if (symbol) {
            this.setSymbol(symbol);
        }
        if (properties) {
            this.setProperties(properties);
        }
        if (!isNil(id)) {
            this.setId(id);
        }
    }

    //bind the geometry to a layer
    _bindLayer(layer) {
        //check dupliaction
        if (this.getLayer()) {
            throw new Error('Geometry cannot be added to two or more layers at the same time.');
        }
        this._layer = layer;
        this._clearCache();
        this._clearProjection();
        // this.callInitHooks();
    }

    _prepareSymbol(symbol) {
        if (Array.isArray(symbol)) {
            const cookedSymbols = [];
            for (let i = 0; i < symbol.length; i++) {
                cookedSymbols.push(convertResourceUrl(this._checkAndCopySymbol(symbol[i])));
            }
            return cookedSymbols;
        } else if (symbol) {
            symbol = this._checkAndCopySymbol(symbol);
            return convertResourceUrl(symbol);
        }
        return null;
    }

    _checkAndCopySymbol(symbol) {
        const s = {};
        for (const i in symbol) {
            if (NUMERICAL_PROPERTIES[i] && isString(symbol[i])) {
                s[i] = +symbol[i];
            } else {
                s[i] = symbol[i];
            }
        }
        return s;
    }

    _getSymbol() {
        return this._symbol;
    }

    /**
     * Sets a external symbol to the geometry, e.g. style from VectorLayer's setStyle
     * @private
     * @param {Object} symbol - external symbol
     */
    _setExternSymbol(symbol) {
        this._externSymbol = this._prepareSymbol(symbol);
        this.onSymbolChanged();
        return this;
    }

    _getInternalSymbol() {
        if (this._symbol) {
            return this._symbol;
        } else if (this._externSymbol) {
            return this._externSymbol;
        } else if (this.options['symbol']) {
            return this.options['symbol'];
        }
        return null;
    }

    _getPrjExtent() {
        const p = this._getProjection();
        this._verifyProjection();
        if (!this._extent && p) {
            this._extent = this._computePrjExtent(p);
        }
        return this._extent;
    }

    _unbind() {
        const layer = this.getLayer();
        if (!layer) {
            return;
        }

        if (this._animPlayer) {
            this._animPlayer.finish();
        }
        this._clearHandlers();
        //contextmenu
        this._unbindMenu();
        //infowindow
        this._unbindInfoWindow();

        if (this.isEditing()) {
            this.endEdit();
        }
        this._removePainter();
        if (this.onRemove) {
            this.onRemove();
        }
        if (layer.onRemoveGeometry) {
            layer.onRemoveGeometry(this);
        }
        delete this._layer;
        delete this._internalId;
        delete this._extent;
    }

    _getInternalId() {
        return this._internalId;
    }

    //只能被图层调用
    _setInternalId(id) {
        this._internalId = id;
    }

    _getMeasurer() {
        if (this._getProjection()) {
            return this._getProjection();
        }
        return SpatialReference.getProjectionInstance(this.options['defaultProjection']);
    }

    _getProjection() {
        const map = this.getMap();
        if (map) {
            return map.getProjection();
        }
        return null;
    }

    _verifyProjection() {
        const projection = this._getProjection();
        if (this._projCode && (!projection || this._projCode !== projection.code)) {
            this._clearProjection();
        }
        this._projCode = projection ? projection.code : null;
    }

    //获取geometry样式中依赖的外部图片资源
    _getExternalResources() {
        const symbol = this._getInternalSymbol();
        return getExternalResources(symbol);
    }

    _getPainter() {
        if (!this._painter && this.getMap()) {
            if (GEOMETRY_COLLECTION_TYPES.indexOf(this.type) !== -1) {
                this._painter = new CollectionPainter(this);
            } else {
                this._painter = new Painter(this);
            }
        }
        return this._painter;
    }

    _removePainter() {
        if (this._painter) {
            this._painter.remove();
        }
        delete this._painter;
    }

    _paint(extent) {
        if (this._painter) {
            this._painter.paint(extent);
        }
    }

    _clearCache() {
        delete this._extent;
    }

    _clearProjection() {
        delete this._extent;
    }

    _repaint() {
        if (this._painter) {
            this._painter.repaint();
        }
    }

    onHide() {
        this.closeMenu();
        this.closeInfoWindow();
    }

    onShapeChanged() {
        this._clearCache();
        this._repaint();
        /**
         * shapechange event.
         *
         * @event Geometry#shapechange
         * @type {Object}
         * @property {String} type - shapechange
         * @property {Geometry} target - the geometry fires the event
         */
        this._fireEvent('shapechange');
    }

    onPositionChanged() {
        this._clearCache();
        this._repaint();
        /**
         * positionchange event.
         *
         * @event Geometry#positionchange
         * @type {Object}
         * @property {String} type - positionchange
         * @property {Geometry} target - the geometry fires the event
         */
        this._fireEvent('positionchange');
    }

    onSymbolChanged() {
        if (this._painter) {
            this._painter.refreshSymbol();
        }
        /**
         * symbolchange event.
         *
         * @event Geometry#symbolchange
         * @type {Object}
         * @property {String} type - symbolchange
         * @property {Geometry} target - the geometry fires the event
         */
        this._fireEvent('symbolchange');
    }

    onConfig(conf) {
        let properties;
        if (conf['properties']) {
            properties = conf['properties'];
            delete conf['properties'];
        }
        let needRepaint = false;
        for (const p in conf) {
            if (conf.hasOwnProperty(p)) {
                const prefix = p.slice(0, 5);
                if (prefix === 'arrow' || prefix === 'smoot') {
                    needRepaint = true;
                    break;
                }
            }
        }
        if (properties) {
            this.setProperties(properties);
            this._repaint();
        } else if (needRepaint) {
            this._repaint();
        }
    }

    /**
     * Set a parent to the geometry, which is usually a MultiPolygon, GeometryCollection, etc
     * @param {GeometryCollection} geometry - parent geometry
     * @private
     */
    _setParent(geometry) {
        if (geometry) {
            this._parent = geometry;
        }
    }

    _getParent() {
        return this._parent;
    }

    _fireEvent(eventName, param) {
        if (this.getLayer() && this.getLayer()._onGeometryEvent) {
            if (!param) {
                param = {};
            }
            param['type'] = eventName;
            param['target'] = this;
            this.getLayer()._onGeometryEvent(param);
        }
        this.fire(eventName, param);
    }

    _toJSON(options) {
        return {
            'feature': this.toGeoJSON(options)
        };
    }

    _exportGraphicOptions(options) {
        const json = {};
        if (isNil(options['options']) || options['options']) {
            json['options'] = this.config();
        }
        if (isNil(options['symbol']) || options['symbol']) {
            json['symbol'] = this.getSymbol();
        }
        if (isNil(options['infoWindow']) || options['infoWindow']) {
            if (this._infoWinOptions) {
                json['infoWindow'] = this._infoWinOptions;
            }
        }
        return json;
    }

    _exportGeoJSONGeometry() {
        const points = this.getCoordinates();
        const coordinates = Coordinate.toNumberArrays(points);
        return {
            'type': this.getType(),
            'coordinates': coordinates
        };
    }

    _exportProperties() {
        let properties = null;
        const geoProperties = this.getProperties();
        if (!isNil(geoProperties)) {
            if (isObject(geoProperties)) {
                properties = extend({}, geoProperties);
            } else {
                properties = geoProperties;
            }
        }
        return properties;
    }

}

Geometry.mergeOptions(options);

export default Geometry;
