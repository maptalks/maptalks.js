import Class from '../core/Class';
import Point from '../geo/Point';
import Map from '../map/Map';
declare const Control_base: {
    new (...args: any[]): {
        _eventMap: object;
        _eventParent: any;
        _eventTarget: any;
        on(eventsOn: string, handler: Function, context?: any): any;
        addEventListener(): any;
        once(eventTypes: string, handler: Function, context?: any): any;
        /**
         * Get the control's container.
         * Container is a div element wrapping the control's dom and decides the control's position and display.
         * @return {HTMLElement}
         */
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
 * Base class for all the map controls, you can extend it to build your own customized Control.
 * It is abstract and not intended to be instantiated.
 * @category control
 * @memberOf control
 * @abstract
 * @extends Class
 * @mixes Eventable
 */
declare class Control extends Control_base {
    _map: Map;
    __ctrlContainer: HTMLElement;
    _controlDom: HTMLElement;
    static positions: any;
    /**
     * Methods needs to implement:  <br>
     *  <br>
     * 1. Method to create UI's Dom element  <br>
     * function buildOn : HTMLElement  <br>
     *  <br>
     * 2. Optional, a callback when the control is added.  <br>
     * function onAdd : void  <br>
     * 3. Optional, a callback when the control is removed.  <br>
     * function onRemove : void  <br>
     *  <br>
     * @param  {Object} [options=null] configuration options
     */
    constructor(options: any);
    /**
     * Adds the control to a map.
     * @param {Map} map
     * @returns {control.Control} this
     * @fires control.Control#add
     */
    addTo(map: any): this;
    /**
     * update control container
     * @return {control.Control} this
     */
    update(): this;
    /**
     * Get the map that the control is added to.
     * @return {Map}
     */
    getMap(): Map;
    /**
     * Get the position of the control
     * @return {Object}
     */
    getPosition(): object;
    /**
     * update the control's position
     * @param {String|Object} position - can be one of 'top-left', 'top-right', 'bottom-left', 'bottom-right' or a position object like {'top': 40,'left': 60}
     * @return {control.Control} this
     * @fires control.Control#positionchange
     */
    setPosition(position: any): this;
    /**
     * Get the container point of the control.
     * @return {Point}
     */
    getContainerPoint(): Point;
    /**
     * Get the control's container.
     * Container is a div element wrapping the control's dom and decides the control's position and display.
     * @return {HTMLElement}
     */
    getContainer(): HTMLElement;
    /**
     * Get html dom element of the control
     * @return {HTMLElement}
     */
    getDOM(): HTMLElement;
    /**
     * Show
     * @return {control.Control} this
     */
    show(): this;
    /**
     * Hide
     * @return {control.Control} this
     */
    hide(): this;
    /**
     * Whether the control is visible
     * @return {Boolean}
     */
    isVisible(): boolean;
    /**
     * Remove itself from the map
     * @return {control.Control} this
     * @fires control.Control#remove
     */
    remove(): this;
    _parse(position: any): any;
    _updatePosition(): void;
}
export default Control;
