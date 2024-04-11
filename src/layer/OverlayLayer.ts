import { GEOJSON_TYPES } from '../core/Constants';
import { isNil, UID, isObject, extend, isFunction, parseStyleRootPath } from '../core/util';
import Extent from '../geo/Extent';
import { Geometry } from '../geometry';
import { createFilter, getFilterFeature, compileStyle } from '@maptalks/feature-filter';
import Layer, { LayerOptionsType } from './Layer';
import GeoJSON from '../geometry/GeoJSON';
import { type OverlayLayerCanvasRenderer } from '../renderer';
import { HandlerFnResultType } from '../core/Eventable';

function isGeometry(geo) {
    return geo && (geo instanceof Geometry);
}

/**
 * @property options.drawImmediate=false - (Only for layer rendered with [CanvasRenderer]{@link renderer.CanvasRenderer}) <br>
 *                                                    In default, for performance reason, layer will be drawn in a frame requested by RAF(RequestAnimationFrame).<br>
 *                                                    Set drawImmediate to true to draw immediately.<br>
 *                                                    This is necessary when layer's drawing is wrapped with another frame requested by RAF.
 * @property options.geometryEventTolerance=1         - tolerance for geometry events
 * @memberOf OverlayLayer
 * @instance
 */
const options: OverlayLayerOptionsType = {
    'drawImmediate': false,
    'geometryEvents': true,
    'geometryEventTolerance': 1
};


const TMP_EVENTS_ARR = [];

/**
 * layers 的基础类，可用于 geometries 的添加移除
 * 抽象类,不准备实例化
 * 
 * @english
 * @classdesc
 * Base class of all the layers that can add/remove geometries. <br>
 * It is abstract and not intended to be instantiated.
 * @category layer
 * @abstract
 * @extends Layer
 */
class OverlayLayer extends Layer {
    _maxZIndex: number
    _minZIndex: number
    _geoMap: Record<string, Geometry>;
    _geoList: Array<Geometry>
    _toSort: boolean
    _cookedStyles: any
    _clearing: boolean
    options: OverlayLayerOptionsType;
    _renderer: OverlayLayerCanvasRenderer;

    constructor(id: string, geometries: OverlayLayerOptionsType | Array<Geometry>, options?: OverlayLayerOptionsType) {
        if (geometries && (!isGeometry(geometries) && !Array.isArray(geometries) && GEOJSON_TYPES.indexOf((geometries as any).type) < 0)) {
            options = geometries;
            geometries = null;
        }
        super(id, options);
        this._maxZIndex = 0;
        this._minZIndex = 0;
        this._initCache();
        if (geometries) {
            this.addGeometry(geometries as Array<Geometry>);
        }
        const style = this.options['style'];
        if (style) {
            this.setStyle(style);
        }
    }

    getAltitude() {
        return 0;
    }

    // isGeometryListening(types) {
    //     if (!this._geoList) {
    //         return false;
    //     }
    //     if (!Array.isArray(types)) {
    //         types = [types];
    //     }
    //     for (let i = 0, l = this._geoList.length; i < l; i++) {
    //         const geometry = this._geoList[i];
    //         if (!geometry) {
    //             continue;
    //         }
    //         if (geometry.options.cursor) {
    //             return true;
    //         }
    //         for (let j = 0; j < types.length; j++) {
    //             if (geometry.listens(types[j])) {
    //                 return true;
    //             }
    //         }
    //     }
    //     return false;
    // }

    /**
     * 通过 id 获取 geometry
     * 
     * @english
     * Get a geometry by its id
     * @param id   - id of the geometry
     * @return
     */
    getGeometryById(id: string | number): Geometry {
        if (isNil(id) || id === '') {
            return null;
        }
        if (!this._geoMap[id]) {
            return null;
        }
        return this._geoMap[id];
    }

    /**
     * 获取所有geometries，如果提供 filter() 方法,则根据方法返回
     * 
     * @english
     * Get all the geometries or the ones filtered if a filter function is provided.
     * @param filter=undefined   - a function to filter the geometries
     * @param context=undefined  - context of the filter function, value to use as this when executing filter.
     * @return
     */
    getGeometries(filter?: (geo: Geometry) => boolean, context?: any): Array<Geometry> {
        if (!filter) {
            return this._geoList.slice(0);
        }
        const result = [];
        let geometry, filtered;
        for (let i = 0, l = this._geoList.length; i < l; i++) {
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
    }

    /**
     * 获取第一个geometry, geometry 位于底部
     * 
     * @english
     * Get the first geometry, the geometry at the bottom.
     * @return first geometry
     */
    getFirstGeometry(): Geometry {
        if (!this._geoList.length) {
            return null;
        }
        return this._geoList[0];
    }

    /**
     * 获取最后一个geometry, geometry 位于上部
     * 
     * @english
     * Get the last geometry, the geometry on the top
     * @return last geometry
     */
    getLastGeometry(): Geometry {
        const len = this._geoList.length;
        if (len === 0) {
            return null;
        }
        return this._geoList[len - 1];
    }

    /**
     * 获取 geometries 个数
     * 
     * Get count of the geometries
     * @return count
     */
    getCount(): number {
        return this._geoList.length;
    }

    /**
     * 获取 geometries 的 extent, 如果 layer 为空,返回 null
     * 
     * @english
     * Get extent of all the geometries in the layer, return null if the layer is empty.
     * @return {Extent} - extent of the layer
     */
    getExtent() {
        if (this.getCount() === 0) {
            return null;
        }
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore /src/gro/Extent.js-Ts  获取Extent符合参数的type
        const extent = new Extent(this.getProjection());
        this.forEach(g => {
            extent._combine(g.getExtent());
        });
        return extent;
    }

    /**
     * 按顺序为图层中的每个 geometry 执行一次提供的回调。
     * 
     * @english
     * Executes the provided callback once for each geometry present in the layer in order.
     * @param fn - a callback function
     * @param context=undefined   - callback's context, value to use as this when executing callback.
     * @return this
     */
    forEach(fn: (geo: Geometry, index: number) => void, context?: any) {
        const copyOnWrite = this._geoList.slice(0);
        for (let i = 0, l = copyOnWrite.length; i < l; i++) {
            if (!context) {
                fn(copyOnWrite[i], i);
            } else {
                fn.call(context, copyOnWrite[i], i);
            }
        }
        return this;
    }

    /**
     * 创建一个包含所有通过由提供的函数实现的测试的 geometries 的 GeometryCollection。
     * 
     * @english
     * Creates a GeometryCollection with all the geometries that pass the test implemented by the provided function.
     * @param fn      - Function to test each geometry
     * @param context=undefined  - Function's context, value to use as this when executing function.
     * @return  A GeometryCollection with all the geometries that pass the test
     */
    filter(fn: (geo: Geometry) => boolean, context?: any): Array<Geometry> {
        const selected = [];
        const isFn = isFunction(fn);
        const filter = isFn ? fn : createFilter(fn);

        this.forEach(geometry => {
            const g = isFn ? geometry : getFilterFeature(geometry);
            if (context ? filter.call(context, g) : filter(g)) {
                selected.push(geometry);
            }
        }, this);
        return selected;
    }

    /**
     * layer 是否为空
     * 
     * @english
     * Whether the layer is empty.
     * @return {Boolean}
     */
    isEmpty(): boolean {
        return !this._geoList.length;
    }

    /**
     * 为 layer 添加 geometries
     * 
     * @english
     * Adds one or more geometries to the layer
     * @param geometries - one or more geometries
     * @param fitView=false                                         - automatically set the map to a fit center and zoom for the geometries
     * @param fitView.easing=out                                    - default animation type
     * @param fitView.duration=map.options.zoomAnimationDuration    - default animation time
     * @param fitView.step=null                                     - step function during animation, animation frame as the parameter
     * @return this
     */
    addGeometry(geometries: Geometry | Array<Geometry>, fitView?: boolean | addGeometryFitViewOptions) {
        if (!geometries) {
            return this;
        }
        if ((geometries as Geometry).type === 'FeatureCollection') {
            return this.addGeometry(GeoJSON.toGeometry(geometries), fitView);
        } else if (!Array.isArray(geometries)) {
            const count = arguments.length;
            // eslint-disable-next-line prefer-rest-params
            const last = arguments[count - 1];
            // eslint-disable-next-line prefer-rest-params
            geometries = Array.prototype.slice.call(arguments, 0, count - 1);
            fitView = last;
            if (last && isObject(last) && (('type' in last) || isGeometry(last))) {
                (geometries as Array<Geometry>).push(last as Geometry);
                fitView = false;
            }
            return this.addGeometry(geometries, fitView);
        } else if (geometries.length === 0) {
            return this;
        }
        this._initCache();
        let extent;
        if (fitView) {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore /src/gro/Extent.js-Ts  允许Extent不传参数
            extent = new Extent();
        }
        this._toSort = this._maxZIndex > 0;
        const geos = [];
        for (let i = 0, l = geometries.length; i < l; i++) {
            let geo = geometries[i];
            if (!(geo && (GeoJSON._isGeoJSON(geo) || isGeometry(geo)))) {
                throw new Error('Invalid geometry to add to layer(' + this.getId() + ') at index:' + i);
            }
            if (geo.getLayer && geo.getLayer() === this) {
                continue;
            }
            if (!isGeometry(geo)) {
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore 未找到fromJSON属性
                geo = Geometry.fromJSON(geo);
                if (Array.isArray(geo)) {
                    for (let ii = 0, ll = geo.length; ii < ll; ii++) {
                        this._add(geo[ii], extent, i);
                        geos.push(geo[ii]);
                    }
                }
            }
            // geojson to Geometry may be null
            if (!geo) {
                throw new Error('Invalid geometry to add to layer(' + this.getId() + ') at index:' + i);
            }
            if (!Array.isArray(geo)) {
                this._add(geo, extent, i);
                geos.push(geo);
            }
        }
        const map: any = this.getMap();
        if (map) {
            this._getRenderer().onGeometryAdd(geos);
            if (extent && !isNil(extent.xmin)) {
                const center = extent.getCenter();
                const z = map.getFitZoom(extent);

                if (isObject(fitView)) {

                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-ignore
                    const step = isFunction(fitView.step) ? fitView.step : () => undefined;

                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-ignore 当前 map 接口中目前没有animateTo方法
                    map.animateTo({
                        center,
                        zoom: z,
                    }, extend({
                        duration: map.options.zoomAnimationDuration,
                        easing: 'out',
                    }, fitView), step);
                } else if (fitView === true) {
                    map.setCenterAndZoom(center, z);
                }
            }
        }
        /**
         * addgeo 事件
         * 
         * addgeo event.
         *
         * @event OverlayLayer#addgeo
         * @type {Object}
         * @property {String} type - addgeo
         * @property {OverlayLayer} target - layer
         * @property {Geometry[]} geometries - the geometries to add
         */
        this.fire('addgeo', {
            'type': 'addgeo',
            'target': this,
            'geometries': geometries
        });
        return this;
    }

    /**
     * 所有 geometries 最小的 zIndex
     * 
     * @english
     * Get minimum zindex of geometries
     */
    getGeoMinZIndex() {
        return this._minZIndex;
    }

    /**
     * 所有 geometries 最大的 zIndex
     * 
     * @english
     * Get maximum zindex of geometries
     */
    getGeoMaxZIndex() {
        return this._maxZIndex;
    }


    _add(geo: Geometry, extent?: Extent, i?: number) {
        if (!this._toSort) {
            this._toSort = geo.getZIndex() !== 0;
        }
        this._updateZIndex(geo.getZIndex());
        const geoId = geo.getId();
        if (!isNil(geoId)) {
            if (!isNil(this._geoMap[geoId])) {
                throw new Error('Duplicate geometry id in layer(' + this.getId() + '):' + geoId + ', at index:' + i);
            }
            this._geoMap[geoId] = geo;
        }
        const internalId = UID();
        geo._setInternalId(internalId);
        this._geoList.push(geo);
        this.onAddGeometry(geo);
        geo._bindLayer(this);
        if (geo.onAdd) {
            geo.onAdd();
        }
        if (extent) {
            extent._combine(geo.getExtent());
        }
        /**
         * add 事件
         * 
         * @english
         * add event.
         *
         * @event Geometry#add
         * @type {Object}
         * @property {String} type - add
         * @property {Geometry} target - geometry
         * @property {Layer} layer - the layer added to.
         */
        geo._fireEvent('add', {
            'layer': this
        });
        if (this._cookedStyles) {
            this._styleGeometry(geo);
        }
    }

    /**
     * 移除一个或多个geometries
     * 
     * @english
     * Removes one or more geometries from the layer
     * @param  geometries - geometry ids or geometries to remove
     * @returns this
     */
    removeGeometry(geometries: Geometry | Geometry[]) {
        if (!Array.isArray(geometries)) {
            return this.removeGeometry([geometries]);
        }
        for (let i = geometries.length - 1; i >= 0; i--) {
            if (!(geometries[i] instanceof Geometry)) {
                geometries[i] = this.getGeometryById(geometries[i] as unknown as string);
            }
            if (!geometries[i] || this !== geometries[i].getLayer()) continue;
            geometries[i].remove();
        }
        /**
         * removegeo 事件
         * 
         * @english 
         * removegeo event.
         *
         * @event OverlayLayer#removegeo
         * @type {Object}
         * @property {String} type - removegeo
         * @property {OverlayLayer} target - layer
         * @property {Geometry[]} geometries - the geometries to remove
         */
        this.fire('removegeo', {
            'type': 'removegeo',
            'target': this,
            'geometries': geometries
        });
        return this;
    }

    /**
     * 清除 layer
     * 
     * @english
     * Clear all geometries in this layer
     * @returns this
     */
    clear() {
        this._clearing = true;
        this.forEach(geo => {
            geo.remove();
        });
        this._geoMap = {};
        const old = this._geoList;
        this._geoList = [];
        const renderer = this._getRenderer();
        if (renderer) {
            renderer.onGeometryRemove(old);
            if (renderer.clearImageData) {
                renderer.clearImageData();
                delete renderer._lastGeosToDraw;
            }
        }
        this._clearing = false;
        /**
         * clear 事件
         * 
         * @english
         * clear event.
         *
         * @event OverlayLayer#clear
         * @type {Object}
         * @property {String} type - clear
         * @property {OverlayLayer} target - layer
         */
        this.fire('clear');
        return this;
    }

    /**
     * 移除geometry 回调函数
     * 
     * @english
     * Called when geometry is being removed to clear the context concerned.
     * @param geometry - the geometry instance to remove
     * @protected
     */
    onRemoveGeometry(geometry: Geometry) {
        if (!geometry || this._clearing) { return; }
        //考察geometry是否属于该图层
        if (this !== geometry.getLayer()) {
            return;
        }
        const internalId = geometry._getInternalId();
        if (isNil(internalId)) {
            return;
        }
        const geoId = geometry.getId();
        if (!isNil(geoId)) {
            delete this._geoMap[geoId];
        }
        const idx = this._findInList(geometry);
        if (idx >= 0) {
            this._geoList.splice(idx, 1);
        }
        if (this._getRenderer()) {
            this._getRenderer().onGeometryRemove([geometry]);
        }
    }

    /**
     * 获取 layer 的 style
     * 
     * @english
     * Gets layer's style.
     * @return layer's style
     */
    getStyle(): any | any[] {
        if (!this.options['style']) {
            return null;
        }
        return this.options['style'];
    }

    /**
     * layer 设置 style, 用样式符号对满足条件的 geometries进行样式修改
     * 基于[mapbox-gl-js's style specification]， {https://www.mapbox.com/mapbox-gl-js/style-spec/#types-filter}.
     * 
     * @english
     * Sets style to the layer, styling the geometries satisfying the condition with style's symbol. <br>
     * Based on filter type in [mapbox-gl-js's style specification]{https://www.mapbox.com/mapbox-gl-js/style-spec/#types-filter}.
     * @param style - layer's style
     * @returns this
     * @fires VectorLayer#setstyle
     * @example
     * layer.setStyle([
        {
          'filter': ['==', 'count', 100],
          'symbol': {'markerFile' : 'foo1.png'}
        },
        {
          'filter': ['==', 'count', 200],
          'symbol': {'markerFile' : 'foo2.png'}
        }
      ]);
     */
    setStyle(style: any | any[]) {
        this.options.style = style;
        style = parseStyleRootPath(style);
        this._cookedStyles = compileStyle(style);
        this.forEach(function (geometry) {
            this._styleGeometry(geometry);
        }, this);
        /**
         * setstyle 事件
         * @english
         * setstyle event.
         *
         * @event VectorLayer#setstyle
         * @type {Object}
         * @property {String} type - setstyle
         * @property {VectorLayer} target - layer
         * @property {Object|Object[]}       style - style to set
         */
        this.fire('setstyle', {
            'type': 'setstyle',
            'target': this,
            'style': style
        });
        return this;
    }

    _styleGeometry(geometry: Geometry): boolean {
        if (!this._cookedStyles) {
            return false;
        }
        const g = getFilterFeature(geometry);
        for (let i = 0, len = this._cookedStyles.length; i < len; i++) {
            if (this._cookedStyles[i]['filter'](g) === true) {
                geometry._setExternSymbol(this._cookedStyles[i]['symbol']);
                return true;
            }
        }
        return false;
    }

    /**
     * 移除 style
     * 
     * @english
     * Removes layers' style
     * @returns this
     * @fires VectorLayer#removestyle
     */
    removeStyle() {
        if (!this.options.style) {
            return this;
        }
        delete this.options.style;
        delete this._cookedStyles;
        this.forEach(function (geometry) {
            geometry._setExternSymbol(null);
        }, this);
        /**
         * removestyle 事件
         * @english
         * removestyle event.
         *
         * @event VectorLayer#removestyle
         * @type {Object}
         * @property {String} type - removestyle
         * @property {VectorLayer} target - layer
         */
        this.fire('removestyle');
        return this;
    }

    onAddGeometry(geo: Geometry) {
        const style = this.getStyle();
        if (style) {
            this._styleGeometry(geo);
        }
    }

    hide(): this {
        for (let i = 0, l = this._geoList.length; i < l; i++) {
            this._geoList[i].onHide();
        }
        return Layer.prototype.hide.call(this);
    }

    _initCache() {
        if (!this._geoList) {
            this._geoList = [];
            this._geoMap = {};
        }
    }

    _updateZIndex(...zIndex: number[]) {
        this._maxZIndex = Math.max(this._maxZIndex, Math.max(...zIndex));
        this._minZIndex = Math.min(this._minZIndex, Math.min(...zIndex));
    }

    _sortGeometries() {
        if (!this._toSort) {
            return;
        }
        this._maxZIndex = 0;
        this._minZIndex = 0;
        this._geoList.sort((a, b) => {
            this._updateZIndex(a.getZIndex(), b.getZIndex());
            return this._compare(a, b);
        });
        this._toSort = false;
    }

    _compare(a, b) {
        if (a.getZIndex() === b.getZIndex()) {
            return a._getInternalId() - b._getInternalId();
        }
        return a.getZIndex() - b.getZIndex();
    }

    //binarySearch
    _findInList(geo: Geometry): number {
        const len = this._geoList.length;
        if (len === 0) {
            return -1;
        }
        this._sortGeometries();
        let low = 0,
            high = len - 1,
            middle;
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
    }

    _onGeometryEvent(param?: HandlerFnResultType) {
        if (!param || !param['target']) {
            return;
        }
        const type = param['type'];
        if (type === 'idchange') {
            this._onGeometryIdChange(param);
        } else if (type === 'zindexchange') {
            this._onGeometryZIndexChange(param);
        } else if (type === 'positionchange') {
            this._onGeometryPositionChange(param);
        } else if (type === 'shapechange') {
            this._onGeometryShapeChange(param);
        } else if (type === 'symbolchange') {
            this._onGeometrySymbolChange(param);
        } else if (type === 'show') {
            this._onGeometryShow(param);
        } else if (type === 'hide') {
            this._onGeometryHide(param);
        } else if (type === 'propertieschange') {
            this._onGeometryPropertiesChange(param);
        }
    }

    _onGeometryIdChange(param: HandlerFnResultType) {
        if (param['new'] === param['old']) {
            if (this._geoMap[param['old']] && this._geoMap[param['old']] === param['target']) {
                return;
            }
        }
        if (!isNil(param['new'])) {
            if (this._geoMap[param['new']]) {
                throw new Error('Duplicate geometry id in layer(' + this.getId() + '):' + param['new']);
            }
            this._geoMap[param['new']] = param['target'];
        }
        if (!isNil(param['old']) && param['new'] !== param['old']) {
            delete this._geoMap[param['old']];
        }

    }

    _onGeometryZIndexChange(param: HandlerFnResultType) {
        if (param['old'] !== param['new']) {
            this._updateZIndex(param['new']);
            this._toSort = true;
            if (this._getRenderer()) {
                this._getRenderer().onGeometryZIndexChange(param);
            }
        }
    }

    _onGeometryPositionChange(param: HandlerFnResultType) {
        if (this._getRenderer()) {
            this._getRenderer().onGeometryPositionChange(param);
        }
    }

    _onGeometryShapeChange(param: HandlerFnResultType) {
        if (this._getRenderer()) {
            this._getRenderer().onGeometryShapeChange(param);
        }
    }

    _onGeometrySymbolChange(param: HandlerFnResultType) {
        if (this._getRenderer()) {
            this._getRenderer().onGeometrySymbolChange(param);
        }
    }

    _onGeometryShow(param: HandlerFnResultType) {
        if (this._getRenderer()) {
            this._getRenderer().onGeometryShow(param);
        }
    }

    _onGeometryHide(param: HandlerFnResultType) {
        if (this._getRenderer()) {
            this._getRenderer().onGeometryHide(param);
        }
    }

    _onGeometryPropertiesChange(param: HandlerFnResultType) {
        if (this._getRenderer()) {
            this._getRenderer().onGeometryPropertiesChange(param);
        }
    }

    _hasGeoListeners(eventTypes: string | Array<string>): boolean {
        if (!eventTypes) {
            return false;
        }
        if (!Array.isArray(eventTypes)) {
            TMP_EVENTS_ARR[0] = eventTypes;
            eventTypes = TMP_EVENTS_ARR;
        }
        const geos = this.getGeometries() || [];
        for (let i = 0, len = geos.length; i < len; i++) {
            const geometry = geos[i];
            if (!geometry) {
                continue;
            }
            if (geometry.options.cursor) {
                return true;
            }
            for (let j = 0, len1 = eventTypes.length; j < len1; j++) {
                const eventType = eventTypes[j];
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                const listens = geometry.listens(eventType);
                if (listens > 0) {
                    return true;
                }
            }
        }
        return false;
    }

    //override for typing
    _getRenderer(): OverlayLayerCanvasRenderer {
        return super._getRenderer() as OverlayLayerCanvasRenderer;
    }
}

OverlayLayer.mergeOptions(options);

export default OverlayLayer;

export type OverlayLayerOptionsType = LayerOptionsType & {
    drawImmediate?: boolean,
    geometryEvents?: boolean,
    geometryEventTolerance?: number,
    style?: any;
}

export type addGeometryFitViewOptions = {
    easing?: string,
    duration?: number,
    step?: (frame) => void
}

export type LayerIdentifyOptionsType = {
    onlyVisible?: boolean;
    tolerance?: number;
}