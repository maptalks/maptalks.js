type Constructor = new (...args: any[]) => {};
/**
 * This provides methods used for event handling. It's a mixin and not meant to be used directly.
 * @mixin Eventable
 */
declare function Eventable<TBase extends Constructor>(Base: TBase): {
    new (...args: any[]): {
        _eventMap: object;
        _eventParent: any;
        _eventTarget: any;
        /**
         * Register a handler function to be called whenever this event is fired.
         *
         * @param {String} eventsOn                  - event types to register, seperated by space if more than one.
         * @param {Function} handler                 - handler function to be called
         * @param {Object} [context=null]            - the context of the handler
         * @return {Any} this
         * @function Eventable.on
         * @example
         * foo.on('mousedown mousemove mouseup', onMouseEvent, foo);
         */
        on(eventsOn: string, handler: Function, context?: any): any;
        /**
         * Alias for [on]{@link Eventable.on}
         *
         * @param {String} eventTypes     - event types to register, seperated by space if more than one.
         * @param {Function} handler                 - handler function to be called
         * @param {Object} [context=null]            - the context of the handler
         * @return {} this
         * @function Eventable.addEventListener
         */
        addEventListener(): any;
        /**
         * Same as on, except the listener will only get fired once and then removed.
         *
         * @param {String} eventTypes                - event types to register, seperated by space if more than one.
         * @param {Function} handler                 - listener handler
         * @param {Object} [context=null]            - the context of the handler
         * @return {} this
         * @example
         * foo.once('mousedown mousemove mouseup', onMouseEvent, foo);
         * @function Eventable.once
         */
        once(eventTypes: string, handler: Function, context?: any): any;
        /**
         * Unregister the event handler for the specified event types.
         *
         * @param {String} eventsOff                - event types to unregister, seperated by space if more than one.
         * @param {Function} handler                - listener handler
         * @param {Object} [context=null]           - the context of the handler
         * @return {} this
         * @example
         * foo.off('mousedown mousemove mouseup', onMouseEvent, foo);
         * @function Eventable.off
         */
        off(eventsOff: string, handler: Function, context: any): any;
        /**
         * Alias for [off]{@link Eventable.off}
         *
         * @param {String} eventTypes    - event types to unregister, seperated by space if more than one.
         * @param {Function} handler                - listener handler
         * @param {Object} [context=null]           - the context of the handler
         * @return {} this
         * @function Eventable.removeEventListener
         */
        removeEventListener(): any;
        /**
         * Returns listener's count registered for the event type.
         *
         * @param {String} eventType        - an event type
         * @param {Function} [hanlder=null] - listener function
         * @param {Object} [context=null]   - the context of the handler
         * @return {Number}
         * @function Eventable.listens
         */
        listens(eventType: string, handler?: Function, context?: any): any;
        /**
         * Get all the listening event types
         *
         * @returns {String[]} events
         * @function Eventable.getListeningEvents
         */
        getListeningEvents(): string[];
        /**
         * Copy all the event listener to the target object
         * @param {Object} target - target object to copy to.
         * @return {} this
         * @function Eventable.copyEventListeners
         */
        copyEventListeners(target: any): any;
        /**
         * Fire an event, causing all handlers for that event name to run.
         *
         * @param  {String} eventType - an event type to fire
         * @param  {Object} param     - parameters for the listener function.
         * @return {} this
         * @function Eventable.fire
         */
        fire(): any;
        _wrapOnceHandler(evtType: any, handler: any, context: any): () => void;
        _switch(to: any, eventKeys: any, context: any): any;
        _clearListeners(eventType: any): void;
        _clearAllListeners(): void;
        /**
         * Set a event parent to handle all the events
         * @param {Any} parent - event parent
         * @return {Any} this
         * @private
         * @function Eventable._setEventParent
         */
        _setEventParent(parent: any): any;
        _setEventTarget(target: any): any;
        _fire(eventType: string, param: any): any;
    };
} & TBase;
export default Eventable;
