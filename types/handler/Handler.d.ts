/**
 * Base class for all the interaction handlers
 * @category handler
 * @abstract
 * @protected
 */
declare class Handler {
    target: any;
    _enabled: boolean;
    dom: HTMLElement;
    constructor(target: any);
    /**
     * Enables the handler
     * @return {Handler} this
     */
    enable(): this;
    /**
     * Disablesthe handler
     * @return {Handler} this
     */
    disable(): this;
    /**
     * Returns true if the handler is enabled.
     * @return {Boolean}
     */
    enabled(): boolean;
    remove(): void;
}
declare const _default: {
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
} & typeof Handler;
export default _default;
