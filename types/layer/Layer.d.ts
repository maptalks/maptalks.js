import Class from '../core/Class';
import CanvasRenderer from '../renderer/layer/CanvasRenderer';
import CollisionIndex from '../core/CollisionIndex';
import Geometry from '../geometry/Geometry';
import { Map } from './../map';
export type LayerOptionsType = {
    'attribution'?: string | null;
    'minZoom'?: number | null;
    'maxZoom'?: number | null;
    'visible'?: boolean;
    'opacity'?: number;
    'globalCompositeOperation'?: string | null;
    'renderer'?: string;
    'debugOutline'?: string;
    'cssFilter'?: string | null;
    'forceRenderOnMoving'?: boolean;
    'forceRenderOnZooming'?: boolean;
    'forceRenderOnRotating'?: boolean;
    'collision'?: boolean;
    'collisionScope'?: string;
    'hitDetect'?: boolean;
    'canvas'?: any;
    'zIndex'?: number;
};
declare const Layer_base: {
    new (...args: any[]): {
        _jsonType: string;
        getJSONType(): string;
    };
    registerJSONType(type: string): any & {
        new (...args: any[]): {
            _eventMap: object;
            _eventParent: any;
            _eventTarget: any;
            on(eventsOn: string, handler: Function, context?: any): any;
            addEventListener(): any;
            once(eventTypes: string, handler: Function, context?: any): any;
            off(eventsOff: string, handler: Function, context: any): any;
            removeEventListener(): any; /**
             * setzindex event.
             *
             * @event Layer#setzindex
             * @type {Object}
             * @property {String} type - setzindex
             * @property {Layer} target    - the layer fires the event
             * @property {Number} zIndex        - value of the zIndex
             */
            listens(eventType: string, handler?: Function, context?: any): any;
            getListeningEvents(): string[];
            copyEventListeners(target: any): any;
            fire(): any;
            _wrapOnceHandler(evtType: any, handler: any, context: any): () => void;
            _switch(to: any, eventKeys: any, context: any): any;
            _clearListeners(eventType: any): void;
            _clearAllListeners(): void;
            _setEventParent(parent: any): any;
            _setEventTarget(target: any): any;
            _fire(eventType: string, param: any): any;
        };
    } & {
        new (...args: any[]): {};
        registerRenderer(name: any, clazz: any): any & typeof Class;
        getRendererClass(name: any): any;
    } & typeof Class;
    getJSONClass(type: string): any;
} & {
    new (...args: any[]): {
        _eventMap: object;
        _eventParent: any;
        _eventTarget: any;
        on(eventsOn: string, handler: Function, context?: any): any;
        addEventListener(): any;
        once(eventTypes: string, handler: Function, context?: any): any;
        off(eventsOff: string, handler: Function, context: any): any;
        removeEventListener(): any; /**
         * setzindex event.
         *
         * @event Layer#setzindex
         * @type {Object}
         * @property {String} type - setzindex
         * @property {Layer} target    - the layer fires the event
         * @property {Number} zIndex        - value of the zIndex
         */
        listens(eventType: string, handler?: Function, context?: any): any;
        getListeningEvents(): string[];
        copyEventListeners(target: any): any;
        fire(): any;
        _wrapOnceHandler(evtType: any, handler: any, context: any): () => void;
        _switch(to: any, eventKeys: any, context: any): any;
        _clearListeners(eventType: any): void;
        _clearAllListeners(): void;
        _setEventParent(parent: any): any;
        _setEventTarget(target: any): any;
        _fire(eventType: string, param: any): any;
    };
} & {
    new (...args: any[]): {};
    registerRenderer(name: any, clazz: any): any & typeof Class;
    getRendererClass(name: any): any;
} & typeof Class;
/**
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
declare class Layer extends Layer_base {
    _canvas: HTMLCanvasElement;
    _renderer: CanvasRenderer;
    _id: number | string;
    _zIndex: number;
    map: Map;
    _mask: Geometry;
    _loaded: boolean;
    _collisionIndex: CollisionIndex;
    _silentConfig: boolean;
    static fromJSON(json: object): Layer;
    constructor(id: number | string, options?: LayerOptionsType);
    /**
     * load the tile layer, can't be overrided by sub-classes
     */
    load(): this;
    /**
     * Get the layer id
     * @returns {String} id
     */
    getId(): string | number;
    /**
     * Set a new id to the layer
     * @param {String} id - new layer id
     * @return {Layer} this
     * @fires Layer#idchange
     */
    setId(id: number | string): this;
    /**
     * Adds itself to a map.
     * @param {Map} map - map added to
     * @return {Layer} this
     */
    addTo(map: any): this;
    /**
     * Set a z-index to the layer
     * @param {Number} zIndex - layer's z-index
     * @return {Layer} this
     */
    setZIndex(zIndex: number): this;
    /**
     * Get the layer's z-index
     * @return {Number}
     */
    getZIndex(): number;
    /**
     * Get Layer's minZoom to display
     * @return {Number}
     */
    getMinZoom(): number;
    /**
     * Get Layer's maxZoom to display
     * @return {Number}
     */
    getMaxZoom(): number;
    /**
     * Get layer's opacity
     * @returns {Number}
     */
    getOpacity(): number;
    /**
     * Set opacity to the layer
     * @param {Number} opacity - layer's opacity
     * @return {Layer} this
     */
    setOpacity(op: number): this;
    /**
     * If the layer is rendered by HTML5 Canvas.
     * @return {Boolean}
     * @protected
     */
    isCanvasRender(): boolean;
    /**
     * Get the map that the layer added to
     * @returns {Map}
     */
    getMap(): Map;
    /**
     * Get projection of layer's map
     * @returns {Object}
     */
    getProjection(): any;
    /**
     * Brings the layer to the top of all the layers
     * @returns {Layer} this
     */
    bringToFront(): this;
    /**
     * Brings the layer under the bottom of all the layers
     * @returns {Layer} this
     */
    bringToBack(): this;
    /**
     * Show the layer
     * @returns {Layer} this
     */
    show(): this;
    /**
     * Hide the layer
     * @returns {Layer} this
     */
    hide(): this;
    /**
     * Whether the layer is visible now.
     * @return {Boolean}
     */
    isVisible(): boolean;
    /**
     * Remove itself from the map added to.
     * @returns {Layer} this
     */
    remove(): this;
    /**
     * Get the mask geometry of the layer
     * @return {Geometry}
     */
    getMask(): Geometry;
    /**
     * Set a mask geometry on the layer, only the area in the mask will be displayed.
     * @param {Geometry} mask - mask geometry, can only be a Marker with vector symbol, a Polygon or a MultiPolygon
     * @returns {Layer} this
     */
    setMask(mask: Geometry): this;
    /**
     * Remove the mask
     * @returns {Layer} this
     */
    removeMask(): this;
    /**
     * Prepare Layer's loading, this is a method intended to be overrided by subclasses.
     * @return {Boolean} true to continue loading, false to cease.
     * @protected
     */
    onLoad(): boolean;
    onLoadEnd(): void;
    /**
     * Whether the layer is loaded
     * @return {Boolean}
     */
    isLoaded(): boolean;
    /**
     * Get layer's collision index
     * @returns {CollisionIndex}
     */
    getCollisionIndex(): CollisionIndex | null;
    /**
     * Clear layer's collision index.
     * Will ignore if collisionScope is not layer
     */
    clearCollisionIndex(): this;
    getRenderer(): CanvasRenderer;
    onConfig(conf: any): void;
    onAdd(): void;
    onRendererCreate(): void;
    onCanvasCreate(): void;
    onRemove(): void;
    _bindMap(map: any, zIndex?: any): void;
    _initRenderer(): void;
    _doRemove(): void;
    _switchEvents(to: any, emitter: any): void;
    _getRenderer(): CanvasRenderer;
    _getLayerList(): Layer[];
    _getMask2DExtent(): any;
}
export default Layer;
