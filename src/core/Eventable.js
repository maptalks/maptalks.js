import { extend, isString, isNil } from './util';
import { stopPropagation } from './util/dom';
/**
 * This provides methods used for event handling. It's a mixin and not meant to be used directly.
 * @mixin Eventable
 */

const Eventable = Base =>

    class extends Base {
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
        on(eventsOn, handler, context) {
            if (!eventsOn) {
                return this;
            }
            if (!isString(eventsOn)) {
                return this._switch('on', eventsOn, handler);
            }
            if (!handler) {
                return this;
            }
            if (!this._eventMap) {
                this._eventMap = {};
            }
            const eventTypes = eventsOn.toLowerCase().split(' ');
            let evtType;
            if (!context) {
                context = this;
            }
            let handlerChain;
            for (let ii = 0, ll = eventTypes.length; ii < ll; ii++) {
                evtType = eventTypes[ii];
                handlerChain = this._eventMap[evtType];
                if (!handlerChain) {
                    handlerChain = [];
                    this._eventMap[evtType] = handlerChain;
                }
                const l = handlerChain.length;
                if (l > 0) {
                    for (let i = 0; i < l; i++) {
                        if (handler === handlerChain[i].handler && handlerChain[i].context === context) {
                            return this;
                        }
                    }
                }
                handlerChain.push({
                    handler: handler,
                    context: context
                });
            }
            return this;
        }

        /**
         * Alias for [on]{@link Eventable.on}
         *
         * @param {String} eventTypes     - event types to register, seperated by space if more than one.
         * @param {Function} handler                 - handler function to be called
         * @param {Object} [context=null]            - the context of the handler
         * @return {} this
         * @function Eventable.addEventListener
         */
        addEventListener() {
            return this.on.apply(this, arguments);
        }

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
        once(eventTypes, handler, context) {
            if (!isString(eventTypes)) {
                const once = {};
                for (const p in eventTypes) {
                    if (eventTypes.hasOwnProperty(p)) {
                        once[p] = this._wrapOnceHandler(p, eventTypes[p], context);
                    }
                }
                return this._switch('on', once);
            }
            const evetTypes = eventTypes.split(' ');
            for (let i = 0, l = evetTypes.length; i < l; i++) {
                this.on(evetTypes[i], this._wrapOnceHandler(evetTypes[i], handler, context));
            }
            return this;
        }

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
        off(eventsOff, handler, context) {
            if (!this._eventMap || !eventsOff) {
                return this;
            }
            if (!isString(eventsOff)) {
                return this._switch('off', eventsOff, handler);
            }
            if (!handler) {
                return this;
            }
            const eventTypes = eventsOff.split(' ');
            let eventType, listeners, wrapKey;
            if (!context) {
                context = this;
            }
            for (let j = 0, jl = eventTypes.length; j < jl; j++) {
                eventType = eventTypes[j].toLowerCase();
                wrapKey = 'Z__' + eventType;
                listeners = this._eventMap[eventType];
                if (!listeners) {
                    return this;
                }
                for (let i = listeners.length - 1; i >= 0; i--) {
                    const listener = listeners[i];
                    if ((handler === listener.handler || handler === listener.handler[wrapKey]) && listener.context === context) {
                        delete listener.handler[wrapKey];
                        listeners.splice(i, 1);
                    }
                }
                if (!listeners.length) {
                    delete this._eventMap[eventType];
                }
            }
            return this;
        }

        /**
         * Alias for [off]{@link Eventable.off}
         *
         * @param {String} eventTypes    - event types to unregister, seperated by space if more than one.
         * @param {Function} handler                - listener handler
         * @param {Object} [context=null]           - the context of the handler
         * @return {} this
         * @function Eventable.removeEventListener
         */
        removeEventListener() {
            return this.off.apply(this, arguments);
        }

        /**
         * Returns listener's count registered for the event type.
         *
         * @param {String} eventType        - an event type
         * @param {Function} [hanlder=null] - listener function
         * @param {Object} [context=null]   - the context of the handler
         * @return {Number}
         * @function Eventable.listens
         */
        listens(eventType, handler, context) {
            if (!this._eventMap || !isString(eventType)) {
                return 0;
            }
            const handlerChain = this._eventMap[eventType.toLowerCase()];
            if (!handlerChain || !handlerChain.length) {
                return 0;
            }
            if (!handler) {
                return handlerChain.length;
            }
            for (let i = 0, len = handlerChain.length; i < len; i++) {
                if (handler === handlerChain[i].handler &&
                    (isNil(context) || handlerChain[i].context === context)) {
                    return 1;
                }
            }
            return 0;
        }

        /**
         * Get all the listening event types
         *
         * @returns {String[]} events
         */
        getListeningEvents() {
            if (!this._eventMap) {
                return [];
            }
            return Object.keys(this._eventMap);
        }

        /**
         * Copy all the event listener to the target object
         * @param {Object} target - target object to copy to.
         * @return {} this
         * @function Eventable.copyEventListeners
         */
        copyEventListeners(target) {
            const eventMap = target._eventMap;
            if (!eventMap) {
                return this;
            }
            let handlerChain;
            for (const eventType in eventMap) {
                handlerChain = eventMap[eventType];
                for (let i = 0, len = handlerChain.length; i < len; i++) {
                    this.on(eventType, handlerChain[i].handler, handlerChain[i].context);
                }
            }
            return this;
        }

        /**
         * Fire an event, causing all handlers for that event name to run.
         *
         * @param  {String} eventType - an event type to fire
         * @param  {Object} param     - parameters for the listener function.
         * @return {} this
         * @function Eventable.fire
         */
        fire() {
            if (this._eventParent) {
                return this._eventParent.fire.apply(this._eventParent, arguments);
            }
            return this._fire.apply(this, arguments);
        }

        _wrapOnceHandler(evtType, handler, context) {
            const me = this;
            const key = 'Z__' + evtType;
            let called = false;
            const fn = function onceHandler() {
                if (called) {
                    return;
                }
                delete fn[key];
                called = true;
                if (context) {
                    handler.apply(context, arguments);
                } else {
                    handler.apply(this, arguments);
                }
                me.off(evtType, onceHandler, this);
            };
            fn[key] = handler;
            return fn;
        }

        _switch(to, eventKeys, context) {
            for (const p in eventKeys) {
                if (eventKeys.hasOwnProperty(p)) {
                    this[to](p, eventKeys[p], context);
                }
            }
            return this;
        }

        _clearListeners(eventType) {
            if (!this._eventMap || !isString(eventType)) {
                return;
            }
            const handlerChain = this._eventMap[eventType.toLowerCase()];
            if (!handlerChain) {
                return;
            }
            this._eventMap[eventType] = null;
        }

        _clearAllListeners() {
            this._eventMap = null;
        }

        /**
         * Set a event parent to handle all the events
         * @param {Any} parent - event parent
         * @return {Any} this
         * @private
         * @function Eventable._setEventParent
         */
        _setEventParent(parent) {
            this._eventParent = parent;
            return this;
        }

        _fire(eventType, param) {
            if (!this._eventMap) {
                return this;
            }
            const handlerChain = this._eventMap[eventType.toLowerCase()];
            if (!handlerChain) {
                return this;
            }
            if (!param) {
                param = {};
            }
            param['type'] = eventType;
            param['target'] = this;
            //in case of deleting a listener in a execution, copy the handlerChain to execute.
            const queue = handlerChain.slice(0);
            let context, bubble, passed;
            for (let i = 0, len = queue.length; i < len; i++) {
                if (!queue[i]) {
                    continue;
                }
                context = queue[i].context;
                bubble = true;
                passed = extend({}, param);
                if (context) {
                    bubble = queue[i].handler.call(context, passed);
                } else {
                    bubble = queue[i].handler(passed);
                }
                //stops the event propagation if the handler returns false.
                if (bubble === false) {
                    if (param['domEvent']) {
                        stopPropagation(param['domEvent']);
                    }
                }
            }
            return this;
        }
    };

export default Eventable;
