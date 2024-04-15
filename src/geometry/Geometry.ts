import { GEOMETRY_COLLECTION_TYPES, NUMERICAL_PROPERTIES } from '../core/Constants';
import Class from '../core/Class';
import Eventable, { BaseEventParamsType, HandlerFnResultType } from '../core/Eventable';
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
import { extendSymbol, getSymbolHash } from '../core/util/style';
import { loadGeoSymbol } from '../core/mapbox';
import { convertResourceUrl, getExternalResources } from '../core/util/resource';
import { replaceVariable, describeText } from '../core/util/strings';
import { isTextSymbol } from '../core/util/marker';
import Coordinate from '../geo/Coordinate';
import Point from '../geo/Point';
import Extent from '../geo/Extent';
import PointExtent from '../geo/PointExtent';
import Painter from '../renderer/geometry/Painter';
import CollectionPainter from '../renderer/geometry/CollectionPainter';
import SpatialReference from '../map/spatial-reference/SpatialReference';
import { isFunctionDefinition } from '../core/mapbox';
import { getDefaultBBOX, pointsBBOX } from '../core/util/bbox';
import { SizeLike } from '../geo/Size';
import type { ProjectionType } from '../geo/projection';
import OverlayLayer, { addGeometryFitViewOptions } from '../layer/OverlayLayer'
import GeometryCollection from './GeometryCollection'
import type { Map } from '../map';
import { WithNull } from '../types/typings';
import { InfoWindowOptionsType } from '../ui/InfoWindow';
import { getMinMaxAltitude } from '../core/util/path';

const TEMP_POINT0 = new Point(0, 0);
const TEMP_EXTENT = new PointExtent();
const TEMP_PROPERTIES = {};

function validateExtent(extent: Extent): boolean {
    if (!extent) {
        return false;
    }
    const { xmin, ymin, xmax, ymax } = extent;
    return (xmax - xmin > 0 && ymax - ymin > 0);
}

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
 * @property {Boolean}  [options.antiMeridian=false]   - geometry's antiMeridian
 * @memberOf Geometry
 * @instance
 */
const options: GeometryOptionsType = {
    'id': null,
    'visible': true,
    'interactive': true,
    'editable': true,
    'cursor': null,
    'antiMeridian': false,
    'defaultProjection': 'EPSG:4326' // BAIDU, IDENTITY
};

/**
 * 所有几何图形的基类。
 * 它定义了所有几何图形类共享的通用方法。
 * 它是抽象的，不打算被实例化而是被扩展。
 * @english
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
export class Geometry extends JSONAble(Eventable(Handlerable(Class))) {
    options: GeometryOptionsType;
    public type: string;
    public _layer: OverlayLayer;
    public _angle: number
    public _pivot: Coordinate
    public _id: string
    public properties: Record<string, any>;
    public _symbol: any
    public _symbolUpdated: any
    public _compiledSymbol: any
    public _symbolHash: any
    public _textDesc: any
    public _eventSymbolProperties: any
    public _sizeSymbol: any
    public _internalId: number
    public _extent: Extent
    public _fixedExtent: PointExtent
    public _extent2d: PointExtent
    public _externSymbol: any
    public _parent: Geometry | GeometryCollection
    public _silence: boolean
    public _projCode: string
    public _painter: Painter
    public _maskPainter: CollectionPainter | Painter
    public _dirtyCoords: any
    public _pcenter: Coordinate
    public _coordinates: any;
    public _infoWinOptions: InfoWindowOptionsType;
    public _minAlt: number
    public _maxAlt: number;
    // 在 VectorLayerCanvasRenderer 附加的信息
    public _isCheck?: boolean;
    public _cPoint?: any;
    public _inCurrentView?: boolean;
    // 在 Marker 中附加的信息，Marker 和其子类都具有此属性
    public isPoint?: boolean;
    //
    public _paintAsPath?: () => any;
    public _getPaintParams?: (disableSimplify?: boolean) => any[];
    public _simplified?: boolean;
    // 本身应该存于 Path 类，但是由于渲染层需要大量的特殊熟悉判断，定义在这里回减少很多麻烦
    public getHoles?(): Array<Array<Coordinate>>;
    __connectors: Array<Geometry>;
    getShell?(): Array<Coordinate>;
    getGeometries?(): Geometry[];
    getCoordinates?(): Coordinate | Array<Coordinate> | Array<Array<Coordinate>> | Array<Array<Array<Coordinate>>>
    setCoordinates?(coordinate: any): this;
    _computeCenter?(T: any): Coordinate;
    _computeExtent?(T: any): Extent;
    onRemove?(): void;
    _computeGeodesicLength?(T: any): number;
    _computeGeodesicArea?(T: any): number;
    getRotateOffsetAngle?(): number;
    _computePrjExtent?(T: null | ProjectionType): Extent;
    _updateCache?(): void;
    onAdd?(): void;

    constructor(options: GeometryOptionsType) {
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
        } else {
            this._genSizeSymbol();
        }
        if (properties) {
            this.setProperties(properties);
        }
        if (!isNil(id)) {
            this.setId(id);
        }
    }

    static fromJSON(json: { [key: string]: any } | Array<{ [key: string]: any }>): Geometry | Array<Geometry> {
        return json as Geometry;
    }

    /**
     * 获取几何图形第一个坐标点
     * @english
     * Returns the first coordinate of the geometry.
     *
     * @return {Coordinate} First Coordinate
     */
    getFirstCoordinate(): Coordinate {
        if (this.type === 'GeometryCollection') {
            const geometries = this.getGeometries();
            if (!geometries.length) {
                return null;
            }
            return geometries[0].getFirstCoordinate();
        }
        let coordinates: any = this.getCoordinates();
        if (!Array.isArray(coordinates)) {
            return coordinates;
        }
        do {
            coordinates = coordinates[0];
        } while (Array.isArray(coordinates) && coordinates.length > 0);
        return coordinates;
    }

    /**
     * 获取几何图形最后一个坐标点
     * @english
     * Returns the last coordinate of the geometry.
     *
     * @return {Coordinate} Last Coordinate
     */
    getLastCoordinate(): Coordinate {
        if (this.type === 'GeometryCollection') {
            const geometries = this.getGeometries();
            if (!geometries.length) {
                return null;
            }
            return geometries[geometries.length - 1].getLastCoordinate();
        }
        let coordinates: any = this.getCoordinates();
        if (!Array.isArray(coordinates)) {
            return coordinates;
        }
        do {
            coordinates = coordinates[coordinates.length - 1];
        } while (Array.isArray(coordinates) && coordinates.length > 0);
        return coordinates;
    }

    /**
     * 将几何图形添加到指定图层上
     * @english
     * Adds the geometry to a layer
     * @param {Layer} layer    - layer add to
     * @param {Boolean} [fitview=false] - automatically set the map to a fit center and zoom for the geometry
     * @return {Geometry} this
     * @fires Geometry#add
     */
    addTo(layer: OverlayLayer, fitview?: boolean | addGeometryFitViewOptions): this {
        layer.addGeometry(this, fitview);
        return this;
    }

    /**
     * 获取几何图形所在的图层
     * @english
     * Get the layer which this geometry added to.
     * @returns {Layer} - layer added to
     */
    getLayer(): OverlayLayer {
        if (!this._layer) {
            return null;
        }
        return this._layer;
    }

    /**
     * 获取几何图形所在的地图对象
     * @english
     * Get the map which this geometry added to
     * @returns {Map} - map added to
     */
    getMap(): Map | null {
        if (!this._layer) {
            return null;
        }
        return this._layer.getMap();
    }

    /**
     * 获取几何图形的id
     * @english
     * Gets geometry's id. Id is set by setId or constructor options.
     * @returns {String|Number} geometry的id
     */
    getId(): string {
        return this._id;
    }

    /**
     * 给几何图形设置id
     * @english
     * Set geometry's id.
     * @param {String} id - new id
     * @returns {Geometry} this
     * @fires Geometry#idchange
     */
    setId(id: string): this {
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
     * 获取几何图形的属性
     * @english
     * Get geometry's properties. Defined by GeoJSON as [feature's properties]{@link http://geojson.org/geojson-spec.html#feature-objects}.
     *
     * @returns {Object} properties
     */
    getProperties(): { [key: string]: any } | null {
        if (!this.properties) {
            if (this._getParent()) {
                return this._getParent().getProperties();
            }
            return null;
        }
        return this.properties;
    }

    /**
     * 给几何图形设置新的属性
     * Set a new properties to geometry.
     * @param {Object} properties - new properties
     * @returns {Geometry} this
     * @fires Geometry#propertieschange
     */
    setProperties(properties: { [key: string]: any }): this {
        const old = this.properties;
        this.properties = isObject(properties) ? extend({}, properties) : properties;
        //such as altitude update
        this._clearAltitudeCache();
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
     * 获取几何图形的类型,例如“点”,"线"
     * @english
     * Get type of the geometry, e.g. "Point", "LineString"
     * @returns {String} type of the geometry
     */
    getType(): string {
        return this.type;
    }

    /**
     * 获取几何图形的样式
     * @english
     * Get symbol of the geometry
     * @returns {Object} geometry's symbol
     */
    getSymbol(): any {
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
     * 给几何图形设置样式
     * @english
     * Set a new symbol to style the geometry.
     * @param {Object} symbol - new symbol
     * @see {@tutorial symbol Style a geometry with symbols}
     * @return {Geometry} this
     * @fires Geometry#symbolchange
     */
    setSymbol(symbol: any): this {
        this._symbolUpdated = symbol;
        this._symbol = this._prepareSymbol(symbol);
        this.onSymbolChanged();
        delete this._compiledSymbol;
        delete this._symbolHash;
        return this;
    }

    /**
     * 获取样式的哈希值
     * @english
     * Get symbol's hash code
     * @return {String}
     */
    getSymbolHash(): string {
        if (!this._symbolHash) {
            this._symbolHash = getSymbolHash(this._symbolUpdated);
        }
        return this._symbolHash;
    }

    /**
     * 更新几何图形当前的样式
     * @english
     * Update geometry's current symbol.
     *
     * @param  {Object | Array} props - symbol properties to update
     * @return {Geometry} this
     * @fires Geometry#symbolchange
     * @example
     * var marker = new Marker([0, 0], {
     *  // if has markerFile , the priority of the picture is greater than the vector and the path of svg
     *  // svg image type:'path';vector type:'cross','x','diamond','bar','square','rectangle','triangle','ellipse','pin','pie'
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
    updateSymbol(props: any): this {
        if (!props) {
            return this;
        }
        let s = this._getSymbol();
        if (Array.isArray(s)) {
            if (!Array.isArray(props)) {
                throw new Error('Parameter of updateSymbol is not an array.');
            }
            for (let i = 0; i < props.length; i++) {
                if (isTextSymbol(props[i])) {
                    delete this._textDesc;
                }
                if (s[i] && props[i]) {
                    s[i] = extendSymbol(s[i], props[i]);
                }
            }
        } else if (Array.isArray(props)) {
            throw new Error('Geometry\'s symbol is not an array to update.');
        } else {
            if (isTextSymbol(s)) {
                delete this._textDesc;
            }
            if (s) {
                s = extendSymbol(s, props);
            } else {
                s = extendSymbol(this._getInternalSymbol(), props);
            }
        }
        this._eventSymbolProperties = props;
        delete this._compiledSymbol;
        return this.setSymbol(s);
    }

    /**
     * 如果几何图形有文本内容，就获取它
     * @english
     * Get geometry's text content if it has
     * @returns {String}
     */
    getTextContent(): any {
        const symbol = this._getInternalSymbol();
        if (Array.isArray(symbol)) {
            const contents = [];
            let has = false;
            for (let i = 0; i < symbol.length; i++) {
                contents[i] = replaceVariable(symbol[i] && symbol[i]['textName'], this.getProperties());
                if (!isNil(contents[i])) {
                    has = true;
                }
            }
            return has ? contents : null;
        }
        return replaceVariable(symbol && symbol['textName'], this.getProperties());
    }

    getTextDesc(): any {
        if (!this._textDesc) {
            const textContent = this.getTextContent();
            // if textName='',this is error
            // if (!textContent) {
            //     return null;
            // }
            const symbol = this._sizeSymbol;
            const isArray = Array.isArray(textContent);
            if (Array.isArray(symbol)) {
                this._textDesc = symbol.map((s, i) => {
                    return describeText(isArray ? textContent[i] : '', s);
                });
            } else {
                this._textDesc = describeText(textContent, symbol);
            }
        }
        return this._textDesc;
    }

    /**
     * 获取几何图形中心点
     * @english
     * Get the geographical center of the geometry.
     *
     * @returns {Coordinate}
     */
    getCenter(): Coordinate {
        return this._computeCenter(this._getMeasurer());
    }

    /**
     * 获取几何图形的包围盒范围
     * @english
     * Get the geometry's geographical extent
     *
     * @returns {Extent} geometry's extent
     */
    getExtent(): Extent {
        const prjExt = this._getPrjExtent();
        const projection = this._getProjection();
        if (prjExt && projection) {
            const min = projection.unproject(new Coordinate(prjExt['xmin'], prjExt['ymin'])),
                max = projection.unproject(new Coordinate(prjExt['xmax'], prjExt['ymax']));
            return new Extent(min, max, projection);
        } else {
            return this._computeExtent(this._getMeasurer());
        }
    }

    /**
     * 获取几何图形的屏幕像素范围
     * @english
     * Get geometry's screen extent in pixel
     *
     * @returns {PointExtent}
     */
    getContainerExtent(out?: PointExtent): PointExtent {
        const extent2d = this.get2DExtent();
        if (!extent2d || !extent2d.isValid()) {
            return null;
        }
        const map = this.getMap();
        // const center = this.getCenter();
        const glRes = map.getGLRes();
        const minAltitude = this.getMinAltitude();
        const extent = extent2d.convertTo(c => map._pointAtResToContainerPoint(c, glRes, minAltitude, TEMP_POINT0), out);
        const maxAltitude = this.getMaxAltitude();
        if (maxAltitude !== minAltitude) {
            const extent2 = extent2d.convertTo(c => map._pointAtResToContainerPoint(c, glRes, maxAltitude, TEMP_POINT0), TEMP_EXTENT);
            extent._combine(extent2);
        }
        const layer = this.getLayer();
        if (layer && this.type === 'LineString' && maxAltitude && layer.options['drawAltitude']) {
            const groundExtent = extent2d.convertTo(c => map._pointAtResToContainerPoint(c, glRes, 0, TEMP_POINT0), TEMP_EXTENT);
            extent._combine(groundExtent);
        }
        if (extent) {
            const fixedExtent = this._getFixedExtent();
            if (validateExtent(fixedExtent)) {
                extent._add(fixedExtent);
            }
        }
        const smoothness = this.options['smoothness'];
        if (smoothness) {
            extent._expand(extent.getWidth() * 0.15);
        }
        return extent;
    }

    _getFixedExtent(): PointExtent {
        // only for LineString and Polygon, Marker's will be overrided
        if (!this._fixedExtent) {
            this._fixedExtent = new PointExtent();
        }
        const symbol = this._sizeSymbol;
        const t = (symbol && symbol['lineWidth'] || 1) / 2;
        this._fixedExtent.set(-t, -t, t, t);
        const dx = (symbol && symbol['lineDx']) || 0;
        this._fixedExtent._add([dx, 0]);
        const dy = (symbol && symbol['lineDy']) || 0;
        this._fixedExtent._add([0, dy]);
        return this._fixedExtent;
    }

    get2DExtent(): PointExtent {
        const map = this.getMap();
        if (!map) {
            return null;
        }
        if (this._extent2d) {
            return this._extent2d;
        }
        const extent = this._getPrjExtent();
        if (!extent || !extent.isValid()) {
            return null;
        }
        const min = extent.getMin();
        const max = extent.getMax();
        const glRes = map.getGLRes();

        map._prjToPointAtRes(min, glRes, min);
        map._prjToPointAtRes(max, glRes, max);
        this._extent2d = new PointExtent(min, max);
        (this._extent2d as any).z = map.getZoom();
        return this._extent2d;
    }

    /**
     * 获取几何体的像素大小，不同缩放级别的像素大小可能会有所不同。
     * @english
     * Get pixel size of the geometry, which may vary in different zoom levels.
     *
     * @returns {Size}
     */
    getSize(): SizeLike {
        const extent = this.getContainerExtent();
        return extent ? extent.getSize() : null;
    }

    /**
     * 几何体是否包含输入容器点
     * @english
     * Whehter the geometry contains the input container point.
     *
     * @param  {Point|Coordinate} point - input container point or coordinate
     * @param  {Number} [t=undefined] - tolerance in pixel
     * @return {Boolean}
     * @example
     * var circle = new Circle([0, 0], 1000)
     *     .addTo(layer);
     * var contains = circle.containsPoint(new maptalks.Point(400, 300));
     */
    containsPoint(containerPoint: Point, t?: number): boolean {
        if (!this.getMap()) {
            throw new Error('The geometry is required to be added on a map to perform "containsPoint".');
        }
        if (containerPoint instanceof Coordinate) {
            containerPoint = this.getMap().coordToContainerPoint(containerPoint);
        }
        return this._containsPoint(containerPoint, t);
        // return this._containsPoint(this.getMap()._containerPointToPoint(new Point(containerPoint)), t);
    }

    _containsPoint(containerPoint: Point, t?: number): boolean {
        const painter = this._getPainter();
        if (!painter) {
            return false;
        }
        t = t || 0;
        if (this._hitTestTolerance) {
            t += this._hitTestTolerance();
        }
        return painter.hitTest(containerPoint, t);
    }

    /**
     * 显示几何图形
     * @english
     * Show the geometry.
     *
     * @return {Geometry} this
     * @fires Geometry#show
     */
    show(): this {
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
     * 隐藏几何图形
     * @english
     * Hide the geometry
     *
     * @return {Geometry} this
     * @fires Geometry#hide
     */
    hide(): this {
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
     * 几何图形是否可见
     * @english
     * Whether the geometry is visible
     *
     * @returns {Boolean}
     */
    isVisible(): boolean {
        if (!this.options['visible']) {
            return false;
        }
        const symbol = this._getInternalSymbol();
        if (!symbol) {
            return true;
        }
        if (!this.symbolIsVisible()) {
            return false;
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
            return (isNil(symbol['opacity']) || isObject(symbol['opacity']) || (isNumber(symbol['opacity']) && symbol['opacity'] > 0));
        }
    }

    /**
     * symbol是否可见
     * @english
     * Whether the geometry symbol is visible
     *
     * @returns {Boolean}
     */
    symbolIsVisible(): boolean {
        //function-type
        let symbols = this._getCompiledSymbol();
        if (!symbols) {
            return true;
        }
        if (!Array.isArray(symbols)) {
            symbols = [symbols];
        }

        for (let i = 0, len = symbols.length; i < len; i++) {
            const symbol = symbols[i];
            if (!symbol) {
                continue;
            }
            const isVisible = symbol.visible;
            if (isVisible !== false && isVisible !== 0) {
                return true;
            }
        }
        return false;

    }

    /**
     * 获取几何图形所在层级，默认是0
     * @english
     * Get zIndex of the geometry, default is 0
     * @return {Number} zIndex
     */
    getZIndex(): number {
        return this.options['zIndex'] || 0;
    }

    /**
     * 给几何图形设置新的层级并触发zindexchange事件（将导致层对几何体进行排序并进行渲染）
     * @english
     * Set a new zIndex to Geometry and fire zindexchange event (will cause layer to sort geometries and render)
     * @param {Number} zIndex - new zIndex
     * @return {Geometry} this
     * @fires Geometry#zindexchange
     */
    setZIndex(zIndex: number): this {
        const old = this.options['zIndex'];
        this.options['zIndex'] = zIndex;
        /**
         * 层级改变事件，当几何图形层级发生改变将会触发
         * @english
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
     * 仅将新的zIndex设置为Geometry，而不触发zindexchange事件
     * 当需要更新许多几何图形的zIndex时，可以用来提高性能
     * 当更新了N个几何体时，可以将setZIndexSilently与（N-1）个几何体一起使用，并将setZIendex与要排序和渲染的层的最后一个几何体一同使用。
     * @english
     * Only set a new zIndex to Geometry without firing zindexchange event. <br>
     * Can be useful to improve perf when a lot of geometries' zIndex need to be updated. <br>
     * When updated N geometries, You can use setZIndexSilently with (N-1) geometries and use setZIndex with the last geometry for layer to sort and render.
     * @param {Number} zIndex - new zIndex
     * @return {Geometry} this
     */
    setZIndexSilently(zIndex: number): this {
        this.options['zIndex'] = zIndex;
        return this;
    }

    /**
     * 将几何图形至于顶层
     * @english
     * Bring the geometry on the top
     * @return {Geometry} this
     * @fires Geometry#zindexchange
     */
    bringToFront(): this {
        const layer = this.getLayer();
        if (!layer || !layer.getGeoMaxZIndex) {
            return this;
        }
        const topZ = layer.getGeoMaxZIndex();
        this.setZIndex(topZ + 1);
        return this;
    }

    /**
     * 将几何图形置于底层
     * @english
     * Bring the geometry to the back
     * @return {Geometry} this
     * @fires Geometry#zindexchange
     */
    bringToBack(): this {
        const layer = this.getLayer();
        if (!layer || !layer.getGeoMinZIndex) {
            return this;
        }
        const bottomZ = layer.getGeoMinZIndex();
        this.setZIndex(bottomZ - 1);
        return this;
    }

    /**
     * 按给定偏移平移或移动几何体
     * @english
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
    translate(x: number | Coordinate, y?: number): this {
        if (isNil(x)) {
            return this;
        }
        const offset = new Coordinate(x as number, y);
        if (offset.x === 0 && offset.y === 0) {
            return this;
        }
        const coordinates: any = this.getCoordinates();
        this._silence = true;
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
        this._silence = false;
        this._fireEvent('positionchange');
        return this;
    }

    /**
     * 闪烁几何图形，按一定的内部显示和隐藏计数次数。
     * @english
     * Flash the geometry, show and hide by certain internal for times of count.
     *
     * @param {Number} [interval=100]     - interval of flash, in millisecond (ms)
     * @param {Number} [count=4]          - flash times
     * @param {Function} [cb=null]        - callback function when flash ended
     * @param {*} [context=null]          - callback context
     * @return {Geometry} this
     */
    flash(interval: number, count: number, cb: () => void, context: any): this {
        return flash.call(this, interval, count, cb, context);
    }

    /**
     * 返回不包含事件侦听器的几何体的副本。
     * @english
     * Returns a copy of the geometry without the event listeners.
     * @returns {Geometry} copy
     */
    copy(): Geometry {
        const json = this.toJSON();
        const ret = Geometry.fromJSON(json) as Geometry;
        //restore visibility
        ret.options['visible'] = true;
        return ret;
    }


    /**
     * 将其自身从图层中移除（如果有的话）。
     * @english
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
     * 将几何对象导出成geojson对象
     * @english
     * Exports [geometry]{@link http://geojson.org/geojson-spec.html#feature-objects} out of a GeoJSON feature.
     * @return {Object} GeoJSON Geometry
     */
    toGeoJSONGeometry(): { [key: string]: any } {
        const gJson = this._exportGeoJSONGeometry();
        return gJson;
    }

    /**
     * 导出geojson对象中的一个feature
     * @english
     * Exports a GeoJSON feature.
     * @param {Object} [opts=null]              - export options
     * @param {Boolean} [opts.geometry=true]    - whether export geometry
     * @param {Boolean} [opts.properties=true]  - whether export properties
     * @returns {Object} GeoJSON Feature
     */
    toGeoJSON(opts?: { [key: string]: any }): { [key: string]: any } {
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
     * 从几何体中导出一个配置文件json。
     * 除了导出特性对象，概要文件json还包含符号、构造选项和信息窗口信息。
     * 配置文件json可以存储在其他地方，稍后用于重现几何图形
     * 由于函数的序列化问题，概要文件json中不包括事件侦听器和上下文菜单
     * @english
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
    toJSON(options?: { [key: string]: any }): { [key: string]: any } {
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
     * 获取几何图形的地理长度
     * @english
     * Get the geographic length of the geometry.
     * @returns {Number} geographic length, unit is meter
     */
    getLength(): number {
        return this._computeGeodesicLength(this._getMeasurer());
    }

    /**
     * 获取几何图形的面积
     * @english
     * Get the geographic area of the geometry.
     * @returns {Number} geographic area, unit is sq.meter
     */
    getArea(): number {
        return this._computeGeodesicArea(this._getMeasurer());
    }

    /**
     * 按给定角度围绕轴心点旋转几何体
     * @english
     * Rotate the geometry of given angle around a pivot point
     * @param {Number} angle - angle to rotate in degree
     * @param {Coordinate} [pivot=null]  - optional, will be the geometry's center by default
     * @returns {Geometry} this
     */
    rotate(angle: number, pivot?: Coordinate): this {
        if (!isNumber(angle)) {
            console.error(`angle:${angle} is not number`);
            return this;
        }
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
        this._angle = angle;
        this._pivot = pivot;
        const measurer = this._getMeasurer();
        const coordinates: any = this.getCoordinates();
        if (!Array.isArray(coordinates)) {
            //exclude Rectangle ,Ellipse,Sector by shell judge
            if ((pivot.x !== coordinates.x || pivot.y !== coordinates.y) && !this.getShell) {
                const c = measurer._rotate(coordinates, pivot, angle);
                this.setCoordinates(c);
            } else {
                //only redraw ,not to change coordinate
                this.onPositionChanged();
            }
            return this;
        }
        forEachCoord(coordinates, c => {
            return measurer._rotate(c, pivot, angle);
        });
        this.setCoordinates(coordinates);
        return this;
    }

    _rotatePrjCoordinates(coordinates: Coordinate | Array<Coordinate>): Coordinate | Coordinate[] {
        if (!coordinates || this._angle === 0 || !this._pivot) {
            return coordinates;
        }
        const projection = this._getProjection();
        if (!projection) {
            return coordinates;
        }
        let offsetAngle = 0;
        const isArray = Array.isArray(coordinates);
        const coord = isArray ? coordinates : [coordinates];
        const rotatePrjCoordinates: Coordinate[] = [];
        let cx, cy;
        //sector is special
        if (this.getRotateOffsetAngle) {
            offsetAngle = this.getRotateOffsetAngle();
            const center = coord[coord.length - 1];
            cx = center.x;
            cy = center.y;
        } else {
            const bbox = getDefaultBBOX();
            //cal all points center
            pointsBBOX(coord, bbox);
            const [minx, miny, maxx, maxy] = bbox;
            cx = (minx + maxx) / 2;
            cy = (miny + maxy) / 2;
        }
        //图形按照自身的几何中心旋转
        for (let i = 0, len = coord.length; i < len; i++) {
            const c = coord[i];
            const { x, y } = c;
            const dx = x - cx, dy = y - cy;
            const r = Math.sqrt(dx * dx + dy * dy);
            const sAngle = getSegmentAngle(cx, cy, x, y);
            const rad = (sAngle - this._angle + offsetAngle) / 180 * Math.PI;
            const rx = Math.cos(rad) * r, ry = Math.sin(rad) * r;
            const rc = new Coordinate(cx + rx, cy + ry);
            rotatePrjCoordinates.push(rc);
        }
        const prjCenter = projection.project(this._pivot);
        const rx = prjCenter.x, ry = prjCenter.y;
        //translate rotate center
        const translateX = cx - rx, translateY = cy - ry;
        //平移到指定的选中中心点
        for (let i = 0, len = rotatePrjCoordinates.length; i < len; i++) {
            const c = rotatePrjCoordinates[i];
            c.x -= translateX;
            c.y -= translateY;
        }
        if (isArray) {
            return rotatePrjCoordinates;
        }
        return rotatePrjCoordinates[0];
    }

    isRotated(): boolean {
        return !!(isNumber(this._angle) && this._pivot);
    }

    /**
     * 获取连线的连接点
     * @english
     * Get the connect points for [ConnectorLine]{@link ConnectorLine}
     * @return {Coordinate[]} connect points
     * @private
     */
    _getConnectPoints(): Coordinate[] {
        return [this.getCenter()];
    }

    //options initializing
    _initOptions(options: GeometryOptionsType): void {
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
    _bindLayer(layer: OverlayLayer): void {
        if (layer === this.getLayer()) {
            return;
        }
        //check dupliaction
        if (this.getLayer()) {
            throw new Error('Geometry cannot be added to two or more layers at the same time.');
        }
        this._layer = layer;
        this._clearCache();
        this._bindInfoWindow();
        this._bindMenu();
        // this._clearProjection();
        // this.callInitHooks();
    }

    _prepareSymbol(symbol: any): any {
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

    _checkAndCopySymbol(symbol: any): any {
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

    _getSymbol(): any {
        return this._symbol;
    }

    /**
     * 将外部符号设置为几何体，例如VectorLayer的setStyle中的样式
     * @english
     * Sets a external symbol to the geometry, e.g. style from VectorLayer's setStyle
     * @private
     * @param {Object} symbol - external symbol
     */
    _setExternSymbol(symbol: any): this {
        this._eventSymbolProperties = symbol;
        if (!this._symbol) {
            delete this._textDesc;
        }
        this._externSymbol = this._prepareSymbol(symbol);
        this.onSymbolChanged();
        return this;
    }

    _getInternalSymbol(): any {
        if (this._symbol) {
            return this._symbol;
        } else if (this._externSymbol) {
            return this._externSymbol;
        } else if (this.options['symbol']) {
            return this.options['symbol'];
        }
        return null;
    }

    _getPrjExtent(): Extent {
        const p = this._getProjection();
        this._verifyProjection();
        if (!this._extent && p) {
            this._extent = this._computePrjExtent(p);
        }
        return this._extent;
    }

    _unbind(): void {
        const layer = this.getLayer();
        if (!layer) {
            return;
        }

        if (this._animPlayer) {
            this._animPlayer.finish();
        }
        // this._clearHandlers();
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

    _getInternalId(): number {
        return this._internalId;
    }

    //只能被图层调用
    _setInternalId(id: number): void {
        this._internalId = id;
    }

    _getMeasurer(): any {
        if (this._getProjection()) {
            return this._getProjection();
        }
        return SpatialReference.getProjectionInstance(this.options['defaultProjection']);
    }

    _getProjection(): WithNull<ProjectionType> {
        const map = this.getMap();
        if (map) {
            return map.getProjection();
        }
        return null;
    }

    _verifyProjection(): void {
        const projection = this._getProjection();
        if (this._projCode && projection && this._projCode !== projection.code) {
            this._clearProjection();
        }
        this._projCode = projection ? projection.code : this._projCode;
    }

    //获取geometry样式中依赖的外部图片资源
    _getExternalResources(): string[] {
        const symbol = this._getInternalSymbol();
        return getExternalResources(symbol);
    }

    _getPainter(): any {
        //for performance
        if (this._painter) {
            return this._painter;
        }
        const layer = this.getLayer();
        if (!this._painter && layer) {
            if (GEOMETRY_COLLECTION_TYPES.indexOf(this.type) !== -1) {
                //@ts-expect-error todo 待vectorlayer ts完善
                if (layer.constructor.getCollectionPainterClass) {
                    //@ts-expect-error todo 待vectorlayer ts完善
                    const clazz = layer.constructor.getCollectionPainterClass();
                    if (clazz) {
                        this._painter = new clazz(this);
                    }
                }
                //@ts-expect-error todo 待vectorlayer ts完善
            } else if (layer.constructor.getPainterClass) {
                //@ts-expect-error todo 待vectorlayer ts完善
                const clazz = layer.constructor.getPainterClass();
                if (clazz) {
                    this._painter = new clazz(this);
                }
            }
        }
        return this._painter;
    }

    _getMaskPainter(): CollectionPainter | Painter {
        if (this._maskPainter) {
            return this._maskPainter;
        }
        this._maskPainter = this.getGeometries && this.getGeometries() ? new CollectionPainter(this, true) : new Painter(this);
        return this._maskPainter;
    }

    _removePainter(): void {
        if (this._painter) {
            this._painter.remove();
        }
        delete this._painter;
    }

    _paint(extent?: Extent): void {
        if (!this.symbolIsVisible()) {
            return;
        }
        if (this._painter) {
            if (this._dirtyCoords) {
                delete this._dirtyCoords;
                const projection = this._getProjection();
                if (projection) {
                    this._pcenter = projection.project(this._coordinates);
                    this._clearCache();
                }
            }
            this._painter.paint(extent);
        }
    }

    _clearCache(): void {
        delete this._extent;
        delete this._extent2d;
        this._clearAltitudeCache();
    }

    _clearProjection(): void {
        delete this._extent;
        delete this._extent2d;
    }

    _repaint(): void {
        if (this._painter) {
            this._painter.repaint();
        }
    }

    onHide(): void {
        this.closeMenu();
        this.closeInfoWindow();
    }

    onShapeChanged(): void {
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

    onPositionChanged(): void {
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

    onSymbolChanged(): void {
        if (this._painter) {
            this._painter.refreshSymbol();
        }
        const e: any = {};
        if (this._eventSymbolProperties) {
            e.properties = JSON.parse(JSON.stringify(this._eventSymbolProperties));
            delete this._eventSymbolProperties;
        } else {
            delete this._textDesc;
        }
        this._genSizeSymbol();

        /**
         * symbolchange event.
         *
         * @event Geometry#symbolchange
         * @type {Object}
         * @property {String} type - symbolchange
         * @property {Geometry} target - the geometry fires the event
         * @property {Object} properties - symbol properties to update if has
         */
        this._fireEvent('symbolchange', e);
    }

    _genSizeSymbol(): void {
        const symbol = this._getInternalSymbol();
        if (!symbol) {
            delete this._sizeSymbol;
            return;
        }
        if (Array.isArray(symbol)) {
            this._sizeSymbol = [];
            let dynamicSize = false;
            for (let i = 0; i < symbol.length; i++) {
                const s = this._sizeSymbol[i] = this._getSizeSymbol(symbol[i]);
                if (!dynamicSize && s && s._dynamic) {
                    dynamicSize = true;
                }
            }
            this._sizeSymbol._dynamic = dynamicSize;
        } else {
            this._sizeSymbol = this._getSizeSymbol(symbol);
        }
    }

    _getSizeSymbol(symbol: any): any {
        const symbolSize = loadGeoSymbol({
            lineWidth: symbol['lineWidth'],
            lineDx: symbol['lineDx'],
            lineDy: symbol['lineDy']
        }, this);
        if (isFunctionDefinition(symbol['lineWidth']) || isFunctionDefinition(symbol['lineDx']) || isFunctionDefinition(symbol['lineDy'])) {
            symbolSize._dynamic = true;
        }
        return symbolSize;
    }

    _getCompiledSymbol(): any {
        if (this._compiledSymbol) {
            return this._compiledSymbol;
        }
        this._compiledSymbol = loadGeoSymbol(this._getInternalSymbol(), this);
        return this._compiledSymbol;
    }

    onConfig(conf: any): void {
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
     * 将父对象设置为几何体，通常是“多重多边形”、“几何集合”等
     * @english
     * Set a parent to the geometry, which is usually a MultiPolygon, GeometryCollection, etc
     * @param {GeometryCollection} geometry - parent geometry
     * @private
     */
    _setParent(geometry?: Geometry | GeometryCollection): void {
        if (geometry) {
            this._parent = geometry;
        }
    }

    _getParent(): any {
        return this._parent;
    }

    _fireEvent(eventName: string, param?: BaseEventParamsType) {
        if (this._silence) {
            return;
        }
        if (this.getLayer() && this.getLayer()._onGeometryEvent) {
            if (!param) {
                param = {};
            }
            param['type'] = eventName;
            param['target'] = this;
            this.getLayer()._onGeometryEvent(param as HandlerFnResultType);
        }
        this.fire(eventName, param);
    }

    _toJSON(options?: any): any {
        return {
            'feature': this.toGeoJSON(options)
        };
    }

    _exportGraphicOptions(options: any): any {
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

    _exportGeoJSONGeometry(): any {
        const points: any = this.getCoordinates();
        const coordinates = Coordinate.toNumberArrays(points);
        return {
            'type': this.getType(),
            'coordinates': coordinates
        };
    }

    _exportProperties(): any {
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

    _hitTestTolerance(): number {
        return 0;
    }


    //------------- altitude + layer.altitude -------------
    //this is for vectorlayer
    //内部方法 for render,返回的值受layer和layer.options.enableAltitude,layer.options.altitude影响
    _getAltitude(): number | number[] | number[][] {
        const layer = this.getLayer();
        if (!layer) {
            return 0;
        }
        const layerOpts = layer.options;
        const layerAltitude = layer.getAltitude ? layer.getAltitude() : 0;
        const enableAltitude = layerOpts['enableAltitude'];
        if (!enableAltitude) {
            return layerAltitude;
        }
        const altitudeProperty = getAltitudeProperty(layer);
        const properties = this.properties || TEMP_PROPERTIES;
        const altitude = properties[altitudeProperty];
        //if properties.altitude is null
        //for new Geometry([x,y,z])
        if (isNil(altitude)) {
            const alts = getGeometryCoordinatesAlts(this, layerAltitude, enableAltitude);
            if (!isNil(alts)) {
                return alts;
            }
            return layerAltitude;
        }
        //old,the altitude is bind properties
        if (Array.isArray(altitude)) {
            return altitude.map(alt => {
                return alt + layerAltitude;
            });
        }
        return altitude + layerAltitude;
    }

    //this for user
    getAltitude(): number | number[] | number[][] {
        const layer = this.getLayer();
        const altitudeProperty = getAltitudeProperty(layer);
        const properties = this.properties || TEMP_PROPERTIES;
        const altitude = properties[altitudeProperty];
        if (!isNil(altitude)) {
            return altitude;
        }
        const alts = getGeometryCoordinatesAlts(this, 0, false);
        if (!isNil(alts)) {
            return alts;
        }
        return 0;
    }

    hasAltitude(): boolean {
        this._genMinMaxAlt();
        return !!this._minAlt || !!this._maxAlt;
    }

    setAltitude(alt: number): this {
        if (!isNumber(alt)) {
            return this;
        }
        const layer = this.getLayer();
        const altitudeProperty = getAltitudeProperty(layer);
        const properties = this.properties || TEMP_PROPERTIES;
        const altitude = properties[altitudeProperty];
        //update properties altitude
        if (!isNil(altitude)) {
            if (Array.isArray(altitude)) {
                for (let i = 0, len = altitude.length; i < len; i++) {
                    altitude[i] = alt;
                }
            } else {
                properties[altitudeProperty] = alt;
            }
        }
        const coordinates: any = this.getCoordinates ? this.getCoordinates() : null;
        if (!coordinates) {
            return this;
        }
        //update coordinates.z
        setCoordinatesAlt(coordinates, alt);
        if (layer) {
            const render = layer.getRenderer();
            //for webgllayer,pointlayer/linestringlayer/polygonlayer
            if (render && render.gl) {
                this.setCoordinates(coordinates);
            } else if (render) {
                this._repaint();
            }
        }
        this._clearAltitudeCache();
        return this;
    }

    _genMinMaxAlt(): void {
        if (this._minAlt === undefined || this._maxAlt === undefined) {
            const altitude = this._getAltitude();
            const [min, max] = getMinMaxAltitude(altitude);
            this._minAlt = min;
            this._maxAlt = max;
        }
    }

    getMinAltitude(): number {
        this._genMinMaxAlt();
        return this._minAlt;
    }

    getMaxAltitude(): number {
        this._genMinMaxAlt();
        return this._maxAlt;
    }

    //clear alt cache
    _clearAltitudeCache(): Geometry {
        this._minAlt = undefined;
        this._maxAlt = undefined;
        return this;
    }

}

Geometry.mergeOptions(options);

export type GeometryOptionsType = {
    id?: string;
    visible?: boolean;
    interactive?: boolean;
    editable?: boolean;
    cursor?: string;
    antiMeridian?: boolean;
    defaultProjection?: string;
    measure?: string;
    draggable?: boolean;
    dragShadow?: boolean;
    dragOnAxis?: string;
    dragOnScreenAxis?: boolean;
    zIndex?: number;
    symbol?: any;
    properties?: { [key: string]: any };

}

function getAltitudeProperty(layer: OverlayLayer): string {
    let altitudeProperty = 'altitude';
    if (layer) {
        const layerOpts = layer.options;
        altitudeProperty = layerOpts['altitudeProperty'];
    }
    return altitudeProperty;
}

function getGeometryCoordinatesAlts(geometry: Geometry, layerAlt: number, enableAltitude: boolean): number | number[] | number[][] {
    const coordinates: any = geometry.getCoordinates ? geometry.getCoordinates() : null;
    if (coordinates) {
        const tempAlts = [];
        coordinatesHasAlt(coordinates, tempAlts);
        if (tempAlts.length) {
            const alts = getCoordinatesAlts(coordinates, layerAlt, enableAltitude);
            // if (geometry.getShell && Array.isArray(alts[0])) {
            //     return alts;
            // }
            return alts;
        }
    }
    return null;
}

function setCoordinatesAlt(coordinates: Coordinate, alt: number): void {
    if (Array.isArray(coordinates)) {
        for (let i = 0, len = coordinates.length; i < len; i++) {
            setCoordinatesAlt(coordinates[i], alt);
        }
    } else {
        coordinates.z = alt;
    }
}

function coordinatesHasAlt(coordinates: Coordinate, tempAlts: number[]) {
    if (tempAlts.length) {
        return;
    }
    if (Array.isArray(coordinates)) {
        for (let i = 0, len = coordinates.length; i < len; i++) {
            coordinatesHasAlt(coordinates[i], tempAlts);
        }
    } else if (isNumber(coordinates.z)) {
        tempAlts.push(coordinates.z);
    }
}

function getCoordinatesAlts(coordinates: Coordinate, layerAlt: number, enableAltitude: boolean): number | number[] {
    if (Array.isArray(coordinates)) {
        const alts = [];
        for (let i = 0, len = coordinates.length; i < len; i++) {
            alts.push(getCoordinatesAlts(coordinates[i], layerAlt, enableAltitude));
        }
        return alts;
    }
    if (isNumber(coordinates.z)) {
        return enableAltitude ? layerAlt + coordinates.z : coordinates.z;
    } else if (enableAltitude) {
        return layerAlt;
    } else {
        return 0;
    }
}

function getSegmentAngle(cx: number, cy: number, x: number, y: number): number {
    if (cx === x) {
        if (y > cy) {
            return -90;
        }
        return 90;
    }
    x -= cx;
    y -= cy;
    //经纬坐标系和屏幕坐标正好相反,经纬度向上递增,而屏幕坐标递减
    y = -y;
    const rad = Math.atan2(y, x);
    return rad / Math.PI * 180;
}

export default Geometry;

