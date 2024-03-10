import Class from '../../core/Class';
import Map from '../Map';
declare const MapTool_base: {
    new (...args: any[]): {
        _eventMap: object;
        _eventParent: any;
        _eventTarget: any;
        on(eventsOn: string, handler: Function, context?: any): any;
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
 * <pre>
 * The parent class for all the map tools.
 * It is abstract and not intended to be instantiated.
 * Some interface methods to implement:
 * 1. onAdd: optional, a callback method to do some prepares before enabled when the map tool is added to a map
 * 2. onEnable: optional, called when the map tool is enabled, used to setup the context such as adding more event listeners other than the map, disabling map's default handlers (draggable, scrollWheelZoom, etc) and creating temporary layers.
 * 3. getEvents: required, provide an event map to register event listeners on the map.
 * 4. onDisable: optional, called when the map tool is disabled, used to cleanup such as unregistering event listeners, enable map's original handlers and remove temporary layers.
 * </pre>
 * @abstract
 * @category maptool
 * @extends Class
 * @mixes Eventable
 */
declare class MapTool extends MapTool_base {
    _map: Map;
    _enabled: boolean;
    /**
     * Adds the map tool to a map.
     * @param {Map} map
     * @return {MapTool} this
     * @fires MapTool#add
     */
    addTo(map: Map): this;
    /**
     * Gets the map it added to.
     * @return {Map} map
     */
    getMap(): Map;
    /**
     * Enable the map tool.
     * @return {MapTool} this
     * @fires MapTool#enable
     */
    enable(): this;
    /**
     * Disable the map tool
     * @return {MapTool} this
     * @fires MapTool#disable
     */
    disable(): this;
    /**
     * Returns whether the tool is enabled
     * @return {Boolean} true | false
     */
    isEnabled(): boolean;
    remove(): this;
    _registerEvents(): void;
    _switchEvents(to: any): void;
    _fireEvent(eventName: any, param?: any): void;
}
export default MapTool;
