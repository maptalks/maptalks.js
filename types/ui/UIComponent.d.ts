import Class from '../core/Class';
import Size from '../geo/Size';
import { Coordinate } from './../geo';
declare const UIComponent_base: {
    new (...args: any[]): {
        _eventMap: object;
        _eventParent: any;
        _eventTarget: any;
        on(eventsOn: string, handler: Function, context?: any): any;
        /**
         * @classdesc
         * Base class for all the UI component classes, a UI component is a HTMLElement positioned with geographic coordinate. <br>
         * It is abstract and not intended to be instantiated.
         *
         * @category ui
         * @abstract
         * @mixes Eventable
         * @memberOf ui
         * @extends Class
         */
        addEventListener(): any;
        once(eventTypes: string, handler: Function, context?: any): any;
        off(eventsOff: string, handler: Function, context: any): any;
        removeEventListener(): any;
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
} & typeof Class;
/**
 * @classdesc
 * Base class for all the UI component classes, a UI component is a HTMLElement positioned with geographic coordinate. <br>
 * It is abstract and not intended to be instantiated.
 *
 * @category ui
 * @abstract
 * @mixes Eventable
 * @memberOf ui
 * @extends Class
 */
declare class UIComponent extends UIComponent_base {
    _owner: any;
    _coordinate: Coordinate;
    __uiDOM: HTMLElement;
    _showBySymbolChange: boolean;
    _pos: any;
    _mapEventsOn: any;
    _domContentRect: any;
    _size: Size;
    _resizeObserver: ResizeObserver;
    _autoPanId: any;
    /**
     *  Some instance methods subclasses needs to implement:  <br>
     *  <br>
     * 1. Optional, returns the Dom element's position offset  <br>
     * function getOffset : Point  <br>
     *  <br>
     * 2. Method to create UI's Dom element  <br>
     * function buildOn : HTMLElement  <br>
     *  <br>
     * 3 Optional, to provide an event map to register event listeners.  <br>
     * function getEvents : void  <br>
     * 4 Optional, a callback when dom is removed.  <br>
     * function onDomRemove : void  <br>
     * 5 Optional, a callback when UI Component is removed.  <br>
     * function onRemove : void  <br>
     * @param  {Object} options configuration options
     */
    constructor(options: any);
    /**
     * Adds the UI Component to a geometry or a map
     * @param {Geometry|Map} owner - geometry or map to addto.
     * @returns {ui.UIComponent} this
     * @fires ui.UIComponent#add
     */
    addTo(owner: any): this;
    /**
     * Get the map it added to
     * @return {Map} map instance
     * @override
     */
    getMap(): any;
    _collides(): this;
    _collidesEffect(show: any): this;
    /**
     * Show the UI Component, if it is a global single one, it will close previous one.
     * @param {Coordinate} [coordinate=null] - coordinate to show, default is owner's center
     * @return {ui.UIComponent} this
     * @fires ui.UIComponent#showstart
     * @fires ui.UIComponent#showend
     */
    show(coordinate: any): this;
    /**
     * Hide the UI Component.
     * @return {ui.UIComponent} this
     * @fires ui.UIComponent#hide
     */
    hide(): this;
    /**
     * Decide whether the ui component is open
     * @returns {Boolean} true|false
     */
    isVisible(): boolean;
    /**
     * Remove the UI Component
     * @return {ui.UIComponent} this
     * @fires ui.UIComponent#hide
     * @fires ui.UIComponent#remove
     */
    remove(): this;
    /**
     * Get pixel size of the UI Component.
     * @return {Size} size
     */
    getSize(): Size;
    getOwner(): any;
    getDOM(): HTMLElement;
    _roundPoint(point: any): any;
    getPosition(): any;
    _getAnimation(): {
        fade: boolean;
        scale: boolean;
        ok: boolean;
        transition: string;
    };
    _getViewPoint(): any;
    _meterToPoint(center: any, altitude: any): any;
    _autoPan(): void;
    /**
     * Measure dom's size
     * @param  {HTMLElement} dom - element to measure
     * @return {Size} size
     * @private
     */
    _measureSize(dom: any): Size;
    /**
     * Remove previous UI DOM if it has.
     *
     * @private
     */
    _removePrevDOM(): void;
    /**
     * generate the cache key to store the singletong UI DOM
     * @private
     * @return {String} cache key
     */
    _uiDomKey(): string;
    _singleton(): any;
    _getUIContainer(): any;
    _getClassName(): string;
    _switchMapEvents(to: any): void;
    _switchEvents(to: any): void;
    _getDefaultEvents(): {
        'zooming rotate pitch': () => void;
        zoomend: () => void;
        moving: () => void;
        moveend: () => void;
        resize: () => void;
    };
    _getOwnerEvents(): {};
    onGeometryPositionChange(param: any): void;
    onMoving(): void;
    onEvent(): void;
    onZoomEnd(): void;
    onResize(): void;
    onDomSizeChange(): void;
    _updatePosition(): this;
    _setPosition(): void;
    _toCSSTranslate(p: any): string;
    _observerDomSize(dom: any): this;
    isSupportZoomFilter(): boolean;
    onConfig(): this;
    static isSupport(owner: any): boolean;
}
export default UIComponent;
