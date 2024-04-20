import Class from '../core/Class';
import { isFunction, isNil, isNumber } from '../core/util';
import Eventable from '../core/Eventable';
import JSONAble from '../core/JSONAble';
import Renderable from '../renderer/Renderable';
import CanvasRenderer from '../renderer/layer/CanvasRenderer';
import CollisionIndex from '../core/CollisionIndex';
import Geometry from '../geometry/Geometry';
import Browser from '../core/Browser';
import type { Map } from '../map';
import type { Marker, MultiPolygon, Polygon } from '../geometry';
import { CommonProjectionType } from '../geo/projection';

/**
 * 配置项
 *
 * @english
 * @property options=null                           - base options of layer.
 * @property options.attribution=null               - the attribution of this layer, you can specify company or other information of this layer.
 * @property options.minZoom=null                   - the minimum zoom to display the layer, set to -1 to unlimit it.
 * @property options.maxZoom=null                   - the maximum zoom to display the layer, set to -1 to unlimit it.
 * @property options.visible=true                   - whether to display the layer.
 * @property options.opacity=1                      - opacity of the layer, from 0 to 1.
 * @property options.zIndex=undefined               - z index of the layer
 * @property options.hitDetect=true                 - Whether to enable hit detection for layers for cursor styles on this map, disable it to improve performance.
 * @property options.renderer=canvas                - renderer type, "canvas" in default.
 * @property options.globalCompositeOperation=null  - (Only for layer rendered with [CanvasRenderer]{@link renderer.CanvasRenderer}) globalCompositeOperation of layer's canvas 2d context.context.globalCompositeOperation, 'source-over' in default
 * @property options.debugOutline='#0f0'            - debug outline's color.
 * @property options.cssFilter=null                 - css filter apply to canvas context's filter
 * @property options.forceRenderOnMoving=false      - force to render layer when map is moving
 * @property options.forceRenderOnZooming=false     - force to render layer when map is zooming
 * @property options.forceRenderOnRotating=false    - force to render layer when map is Rotating
 * @property options.collisionScope=layer           - layer's collision scope: layer or map
 * @memberOf Layer
 * @instance
 */
const options: LayerOptionsType = {
    'attribution': null,
    'minZoom': null,
    'maxZoom': null,
    'visible': true,
    'opacity': 1,
    // context.globalCompositeOperation, 'source-over' in default
    'globalCompositeOperation': null,
    'renderer': 'canvas',
    'debugOutline': '#0f0',
    'cssFilter': null,
    'forceRenderOnMoving': false,
    'forceRenderOnZooming': false,
    'forceRenderOnRotating': false,
    'collision': false,
    'collisionScope': 'layer',
    'hitDetect': (function () {
        return !Browser.mobile;
    })()
};

/**
 * layers的基础类，定义了所有layers公共方法。
 * 抽象类，不做实例化打算
 *
 * @english
 * @classdesc
 * Base class for all the layers, defines common methods that all the layer classes share. <br>
 * It is abstract and not intended to be instantiated.
 *
 * @category layer
 * @abstract
 * @extends Class
 * @mixes Eventable
 * @mixes JSONAble
 * @mixes Renderable
 */
class Layer extends JSONAble(Eventable(Renderable(Class))) {
    _canvas: HTMLCanvasElement;
    _renderer: CanvasRenderer;
    _id: string
    _zIndex: number
    _drawTime: number
    map: Map
    _mask: Polygon | MultiPolygon | Marker;
    _loaded: boolean
    _collisionIndex: CollisionIndex
    _optionsHook?(conf?: any): void
    _silentConfig: boolean | undefined | any
    options: LayerOptionsType;


    constructor(id: string, options?: LayerOptionsType) {
        let canvas;
        if (options) {
            canvas = options.canvas;
            delete options.canvas;
        }
        super(options);
        this._canvas = canvas;
        this.setId(id);
        if (options) {
            this.setZIndex(options.zIndex);
            if (options.mask) {
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore 未找到fromJSON属性
                this.setMask(Geometry.fromJSON(options.mask));
            }
        }
        this.proxyOptions();
    }

    /**
     * 加载tile layer,不能被子类重写
     *
     * @english
     * load the tile layer, can't be overrided by sub-classes
     */
    load() {
        if (!this.getMap()) {
            return this;
        }
        if (this.onLoad()) {
            this._initRenderer();
            const zIndex = this.getZIndex();
            if (!isNil(zIndex)) {
                this._renderer.setZIndex(zIndex);
                if (!this.isCanvasRender()) {
                    this._renderer.render();
                }
            }
            this.onLoadEnd();
        }
        return this;
    }

    /**
     * 获取layer Id
     *
     * @english
     * Get the layer id
     * @returns id
     */
    getId(): string {
        return this._id;
    }

    /**
     * 为layer新设一个 Id
     *
     * @english
     * Set a new id to the layer
     * @param id - new layer id
     * @return this
     * @fires Layer#idchange
     */
    setId(id: string): this {
        const old = this._id;
        if (!isNil(id)) {
            id = id + '';
        }
        this._id = id;
        /**
         * idchange 事件
         *
         * @english
         * idchange event.
         *
         * @event Layer#idchange
         * @type {Object}
         * @property {String} type      - idchange
         * @property {Layer} target     - the layer fires the event
         * @property {String} old       - value of the old id
         * @property {String} new       - value of the new id
         */
        this.fire('idchange', {
            'type': 'idchange',
            'target': this,
            'old': old,
            'new': id
        });
        return this;
    }

    /**
     * 将图层添加至 map
     *
     * @english
     * Adds itself to a map.
     * @param map - map added to
     * @return this
     */
    addTo(map: Map): this {
        map.addLayer(this);
        return this;
    }

    /**
     * 为layer 设置zIndex
     *
     * @engilsh
     * Set a z-index to the layer
     * @param zIndex - layer's z-index
     * @return this
     */
    setZIndex(zIndex: number): this {
        this._zIndex = zIndex;
        if (isNil(zIndex)) {
            delete this.options['zIndex'];
        } else {
            this.options.zIndex = zIndex;
        }
        if (this.map) {
            this.map._sortLayersByZIndex();
        }
        if (this._renderer) {
            this._renderer.setZIndex(zIndex);
        }
        /**
         * setzindex 事件
         *
         * @english
         * setzindex event.
         *
         * @event Layer#setzindex
         * @type {Object}
         * @property {String} type      - setzindex
         * @property {Layer} target     - the layer fires the event
         * @property {Number} zIndex    - value of the zIndex
         */
        this.fire('setzindex', {
            'type': 'setzindex',
            'target': this,
            zIndex
        });
        return this;
    }

    /**
     * 获取layer 的 zIndex
     *
     * @english
     * Get the layer's z-index
     * @return
     */
    getZIndex(): number {
        return this._zIndex || 0;
    }

    /**
     * 获取 layer 的 minZoom
     *
     * @english
     * Get Layer's minZoom to display
     * @return
     */
    getMinZoom(): number {
        const map = this.getMap();
        const minZoom = this.options['minZoom'];
        return map ? Math.max(map.getMinZoom(), minZoom || 0) : minZoom;
    }

    /**
     * 获取layer 的 maxZoom
     *
     * @english
     * Get Layer's maxZoom to display
     * @return
     */
    getMaxZoom(): number {
        const map = this.getMap();
        const maxZoom = this.options['maxZoom'];
        return map ? Math.min(map.getMaxZoom(), isNil(maxZoom) ? Infinity : maxZoom) : maxZoom;
    }

    /**
     * 获取 layer 的 opacity
     *
     * @english
     * Get layer's opacity
     * @returns {Number}
     */
    getOpacity() {
        return this.options['opacity'];
    }

    /**
     * 设置 layer 的 opacity
     *
     * @english
     * Set opacity to the layer
     * @param opacity - layer's opacity
     * @return this
     */
    setOpacity(op: number): this {
        this.config('opacity', op);
        /**
        * setopacity 事件
        *
        * @english
        * setopacity event.
        *
        * @event Layer#setopacity
        * @type {Object}
        * @property {String} type - setopacity
        * @property {Layer} target    - the layer fires the event
        * @property {Number} opacity        - value of the opacity
        */
        this.fire('setopacity', { type: 'setopacity', target: this, opacity: op });
        return this;
    }

    /**
     * layer 是否为 HTML5 Canvas 渲染
     *
     * @english
     * If the layer is rendered by HTML5 Canvas.
     * @return
     * @protected
     */
    isCanvasRender(): boolean {
        const renderer = this._getRenderer();
        return (renderer && (renderer instanceof CanvasRenderer));
    }

    /**
     * 获取图层所在 map
     *
     * @english
     * Get the map that the layer added to
     * @returns {Map}
     */
    getMap() {
        if (this.map) {
            return this.map;
        }
        return null;
    }

    /**
     * 获取 layer 所在map 的 projection
     *
     * @english
     * Get projection of layer's map
     * @returns
     */
    getProjection(): CommonProjectionType {
        const map = this.getMap();
        return map ? map.getProjection() : null;
    }

    /**
     * 将图层置顶
     *
     * @english
     * Brings the layer to the top of all the layers
     * @returns this
     */
    bringToFront(): this {
        const layers = this._getLayerList();
        if (!layers.length) {
            return this;
        }
        const topLayer = layers[layers.length - 1];
        if (layers.length === 1 || topLayer === this) {
            return this;
        }
        const max = topLayer.getZIndex();
        this.setZIndex(max + 1);
        return this;
    }

    /**
     * 将图层置底
     *
     * @english
     * Brings the layer under the bottom of all the layers
     * @returns {Layer} this
     */
    bringToBack(): this {
        const layers = this._getLayerList();
        if (!layers.length) {
            return this;
        }
        const bottomLayer = layers[0];
        if (layers.length === 1 || bottomLayer === this) {
            return this;
        }
        const min = bottomLayer.getZIndex();
        this.setZIndex(min - 1);
        return this;
    }

    /**
     * 显示图层
     *
     * @english
     * Show the layer
     * @returns this
     */
    show(): this {
        if (!this.options['visible']) {
            this.options['visible'] = true;
            const renderer = this.getRenderer();
            if (renderer) {
                renderer.show();
            }

            const map = this.getMap();
            if (renderer && map) {
                //fire show at renderend to make sure layer is shown
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore Map 缺少once方法
                map.once('renderend', () => {
                    this.fire('show');
                });
            } else {
                /**
                * show event.
                *
                * @event Layer#show
                * @type {Object}
                * @property {String} type - show
                * @property {Layer} target    - the layer fires the event
                */
                this.fire('show');
            }
        }
        return this;
    }

    /**
     * 隐藏图层
     *
     * @english
     * Hide the layer
     * @returns this
     */
    hide(): this {
        if (this.options['visible']) {
            this.options['visible'] = false;
            const renderer = this.getRenderer();
            if (renderer) {
                renderer.hide();
            }

            const map = this.getMap();
            if (renderer && map) {
                //fire hide at renderend to make sure layer is hidden
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore Map 缺少once方法
                map.once('renderend', () => {
                    this.fire('hide');
                });
            } else {
                /**
                 * hide事件
                 *
                 * @english
                 * hide event.
                 *
                 * @event Layer#hide
                 * @type {Object}
                 * @property {String} type - hide
                 * @property {Layer} target    - the layer fires the event
                 */
                this.fire('hide');
            }
        }
        // this.fire('hide');
        return this;
    }

    /**
     * layer 的当前 visible 状态
     *
     * @english
     * Whether the layer is visible now.
     * @return
     */
    isVisible(): boolean {
        if (isNumber(this.options['opacity']) && this.options['opacity'] <= 0) {
            return false;
        }
        const map = this.getMap();
        if (map) {
            const zoom = map.getZoom();
            if ((!isNil(this.options['maxZoom']) && this.options['maxZoom'] < zoom) ||
                (!isNil(this.options['minZoom']) && this.options['minZoom'] > zoom)) {
                return false;
            }
        }

        if (isNil(this.options['visible'])) {
            this.options['visible'] = true;
        }
        return this.options['visible'];
    }

    /**
     * 移除图层
     *
     * @english
     * Remove itself from the map added to.
     * @returns this
     */
    remove(): this {
        if (this.map) {
            const renderer = this.map.getRenderer();
            this.map.removeLayer(this);
            if (renderer) {
                renderer.setToRedraw();
            }
        } else {
            this.fire('remove');
        }
        return this;
    }

    /**
     * 获取 mask geometry
     *
     * @english
     * Get the mask geometry of the layer
     * @return {Geometry}
     */
    getMask() {
        return this._mask;
    }

    /**
     * 设置mask geometry, 只显示掩码的区域
     *
     * @english
     * Set a mask geometry on the layer, only the area in the mask will be displayed.
     * @param {Geometry} mask - mask geometry, can only be a Marker with vector symbol, a Polygon or a MultiPolygon
     * @returns {Layer} this
     */
    setMask(mask: Polygon | MultiPolygon | Marker): this {
        if (!((mask.type === 'Point' && (mask as Marker)._isVectorMarker()) || mask.type === 'Polygon' || mask.type === 'MultiPolygon')) {
            throw new Error('Mask for a layer must be a marker with vector marker symbol or a Polygon(MultiPolygon).');
        }
        //@ts-expect-error Argument of type 'this' is not assignable to parameter of type 'OverlayLayer'.
        mask._bindLayer(this);
        if (mask.type === 'Point') {
            mask.updateSymbol({
                'markerLineColor': 'rgba(0, 0, 0, 0)',
                'markerFillOpacity': 0
            });
        } else {
            (mask as Polygon).setSymbol({
                'lineColor': 'rgba(0, 0, 0, 0)',
                'polygonOpacity': 0
            });
        }
        this._mask = mask;
        this.options.mask = mask.toJSON();
        if (!this.getMap() || this.getMap().isZooming()) {
            return this;
        }
        const renderer = this._getRenderer();
        if (renderer && renderer.setToRedraw) {
            this._getRenderer().setToRedraw();
        }
        return this;
    }

    /**
     * 移除mask
     *
     * @engilsh
     * Remove the mask
     * @returns {Layer} this
     */
    removeMask(): this {
        delete this._mask;
        delete this.options.mask;
        if (!this.getMap() || this.getMap().isZooming()) {
            return this;
        }
        const renderer = this._getRenderer();
        if (renderer && renderer.setToRedraw) {
            this._getRenderer().setToRedraw();
        }
        return this;
    }

    /**
     * 准备层的加载，是一个由子类重写的方法。
     *
     * @english
     * Prepare Layer's loading, this is a method intended to be overrided by subclasses.
     * @return true to continue loading, false to cease.
     * @protected
     */
    onLoad(): boolean {
        return true;
    }

    onLoadEnd() {
    }

    /**
     * 是否加载layer
     *
     * @english
     * Whether the layer is loaded
     * @return
     */
    isLoaded(): boolean {
        return !!this._loaded;
    }

    /**
     * 获取collision index
     *
     * @english
     * Get layer's collision index
     * @returns {CollisionIndex}
     */
    getCollisionIndex() {
        if (this.options['collisionScope'] === 'layer') {
            if (!this._collisionIndex) {
                this._collisionIndex = new CollisionIndex();
            }
            return this._collisionIndex;
        }
        const map = this.getMap();
        if (!map) {
            return null;
        }
        return map.getCollisionIndex();
    }

    /**
     * 清除 layer 的 collision index。
     * 如果 collisionScope !== 'layer' 将忽略
     *
     * @english
     * Clear layer's collision index.
     * Will ignore if collisionScope is not layer
     */
    clearCollisionIndex() {
        if (this.options['collisionScope'] === 'layer' &&
            this._collisionIndex) {
            this._collisionIndex.clear();
        }
        return this;
    }

    getRenderer() {
        return this._getRenderer();
    }

    onConfig(conf: { [key: string]: any }) {
        const needUpdate = conf && Object.keys && Object.keys(conf).length > 0;
        if (needUpdate && isNil(conf['animation'])) {
            // options change Hook,subLayers Can realize its own logic,such as tileSize/tileSystem etc change
            if (this._optionsHook && isFunction(this._optionsHook)) {
                this._optionsHook(conf);
            }
            if (this._silentConfig) {
                return;
            }
            const renderer = this.getRenderer();
            if (renderer && renderer.setToRedraw) {
                renderer.setToRedraw();
            }
        }
    }

    onAdd() { }

    onRendererCreate() { }

    onCanvasCreate() { }

    onRemove() { }

    _bindMap(map: Map, zIndex?: number) {
        if (!map) {
            return;
        }
        this.map = map;
        if (!isNil(zIndex)) {
            this.setZIndex(zIndex);
        }
        this._switchEvents('on', this);

        this.onAdd();

        this.fire('add');
    }

    _initRenderer() {
        const renderer = this.options['renderer'];
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        if (!this.constructor.getRendererClass) {
            return;
        }
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const clazz = this.constructor.getRendererClass(renderer);
        if (!clazz) {
            throw new Error('Invalid renderer for Layer(' + this.getId() + '):' + renderer);
        }
        this._renderer = new clazz(this);
        this._renderer.layer = this;
        this._renderer.setZIndex(this.getZIndex());
        this._switchEvents('on', this._renderer);
        // some plugin of dom renderer doesn't implement onAdd
        if (this._renderer.onAdd) {
            this._renderer.onAdd();
        }
        this.onRendererCreate();

        /**
         * renderercreate 事件, 当 renderer 创建完成后触发
         *
         * @english
         * renderercreate event, fired when renderer is created.
         *
         * @event Layer#renderercreate
         * @type {Object}
         * @property {String} type - renderercreate
         * @property {Layer} target    - the layer fires the event
         * @property {Any} renderer    - renderer of the layer
         */
        this.fire('renderercreate', {
            'type': 'renderercreate',
            'target': this,
            'renderer': this._renderer
        });
    }

    _doRemove() {
        this._loaded = false;

        this._switchEvents('off', this);
        this.onRemove();
        if (this._renderer) {
            this._switchEvents('off', this._renderer);
            this._renderer.remove();
            delete this._renderer;
        }
        delete this.map;
        delete this._collisionIndex;
    }

    _switchEvents(to, emitter) {
        if (emitter && emitter.getEvents && this.getMap()) {
            this.getMap()[to](emitter.getEvents(), emitter);
        }
    }

    _getRenderer() {
        return this._renderer;
    }

    _getLayerList() {
        if (!this.map) {
            return [];
        }
        const beginIndex = +!!this.map.getBaseLayer();
        return this.map.getLayers().slice(beginIndex);
    }

    _getMask2DExtent() {
        if (!this._mask || !this.getMap()) {
            return null;
        }
        const painter = this._mask._getMaskPainter();
        if (!painter) {
            return null;
        }
        return painter.get2DExtent();
    }

    toJSON(options?: any): LayerJSONType {
        return {
            type: 'Layer',
            id: this.getId(),
            options: options || this.config()
        }
    }

    /**
     * Reproduce a Layer from layer's JSON.
     * @param  {Object} layerJSON - layer's JSON
     * @return {Layer}
     */
    static fromJSON(layerJSON: { [key: string]: any }): Layer | null {
        if (!layerJSON) {
            return null;
        }
        const layerType = layerJSON['type'];
        const clazz = Layer.getJSONClass(layerType) as any;
        if (!clazz || !clazz.fromJSON) {
            throw new Error('unsupported layer type:' + layerType);
        }
        return clazz.fromJSON(layerJSON);
    }
}

Layer.mergeOptions(options);

const fire = Layer.prototype.fire;

Layer.prototype.fire = function (eventType: string, param) {
    if (eventType === 'layerload') {
        this._loaded = true;
    }
    if (this.map) {
        if (!param) {
            param = {
                'type': null,
                'target': null
            };
        }
        param['type'] = eventType;
        param['target'] = this;
        this.map._onLayerEvent(param);
    }
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    // eslint-disable-next-line prefer-rest-params
    fire.apply(this, arguments);
    if (['show', 'hide'].indexOf(eventType) > -1) {
        /**
        * visiblechange 事件
        * @english
        * visiblechange event.
        *
        * @event Layer#visiblechange
        * @type {Object}
        * @property {String} type - visiblechange
        * @property {Layer} target    - the layer fires the event
        * @property {Boolean} visible        - value of visible
       */
        this.fire('visiblechange', Object.assign({}, param, { visible: this.options.visible }));
    }
    return this;
};

export default Layer;

export type LayerOptionsType = {
    attribution?: string,
    minZoom?: number,
    maxZoom?: number,
    visible?: boolean,
    opacity?: number,
    zIndex?: number
    globalCompositeOperation?: string,
    renderer?: 'canvas' | 'gl' | 'dom',
    debugOutline?: string,
    cssFilter?: string,
    forceRenderOnMoving?: boolean,
    forceRenderOnZooming?: boolean,
    forceRenderOnRotating?: boolean,
    collision?: boolean,
    collisionScope?: 'layer' | 'map',
    hitDetect?: boolean,
    canvas?: HTMLCanvasElement,
    mask?: any,
    drawImmediate?: boolean,
    geometryEvents?: boolean,
    geometryEventTolerance?: number,
}

export type LayerJSONType = {
    id: string;
    type: string;
    options: Record<string, any>;
    geometries?: Array<any>;
    layers?: Array<any>;
}
