import { extend, isString, isNil } from 'core/util';
import { stopPropagation } from 'core/util/dom';

/**
 * This provides methods used for event handling. It's a mixin and not meant to be used directly.
 * @mixin
 * @memberOf maptalks
 * @name Eventable
 */
export default Base => class extends Base {
    /**
     * Register a handler function to be called whenever this event is fired.
     *
     * @param {String} eventsOn                  - event types to register, seperated by space if more than one.
     * @param {Function} handler                 - handler function to be called
     * @param {Object} [context=null]            - the context of the handler
     * @return {*} this
     * @example
     * foo.on('mousedown mousemove mouseup', onMouseEvent, foo);
     */
    on(eventsOn, handler, context) {
        if (!eventsOn || !handler) {
            return this;
        }
        if (!isString(eventsOn)) {
            return this._switch('on', eventsOn, handler);
        }
        if (!this._eventMap) {
            this._eventMap = {};
        }
        var eventTypes = eventsOn.toLowerCase().split(' ');
        var evtType;
        if (!context) {
            context = this;
        }
        var handlerChain, i, l;
        for (var ii = 0, ll = eventTypes.length; ii < ll; ii++) {
            evtType = eventTypes[ii];
            handlerChain = this._eventMap[evtType];
            if (!handlerChain) {
                handlerChain = [];
                this._eventMap[evtType] = handlerChain;
            }
            l = handlerChain.length;
            if (l > 0) {
                for (i = 0; i < l; i++) {
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
     * @return {*} this
     * @function
     * @memberOf Eventable
     * @name addEventListener
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
     * @return {*} this
     * @example
     * foo.once('mousedown mousemove mouseup', onMouseEvent, foo);
     */
    once(eventTypes, handler, context) {
        if (!isString(eventTypes)) {
            var once = {};
            for (var p in eventTypes) {
                if (eventTypes.hasOwnProperty(p)) {
                    once[p] = this._wrapOnceHandler(p, eventTypes[p], context);
                }
            }
            return this._switch('on', once);
        }
        var evetTypes = eventTypes.split(' ');
        for (var i = 0, l = evetTypes.length; i < l; i++) {
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
     * @return {*} this
     * @example
     * foo.off('mousedown mousemove mouseup', onMouseEvent, foo);
     */
    off(eventsOff, handler, context) {
        if (!eventsOff || !this._eventMap || !handler) {
            return this;
        }
        if (!isString(eventsOff)) {
            return this._switch('off', eventsOff, handler);
        }
        var eventTypes = eventsOff.split(' ');
        var eventType, handlerChain;
        if (!context) {
            context = this;
        }
        var i;
        for (var j = 0, jl = eventTypes.length; j < jl; j++) {
            eventType = eventTypes[j].toLowerCase();
            handlerChain = this._eventMap[eventType];
            if (!handlerChain) {
                return this;
            }
            for (i = handlerChain.length - 1; i >= 0; i--) {
                if (handler === handlerChain[i].handler && handlerChain[i].context === context) {
                    handlerChain.splice(i, 1);
                }
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
     * @return {*} this
     * @function
     * @memberOf Eventable
     * @name removeEventListener
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
     */
    listens(eventType, handler, context) {
        if (!this._eventMap || !isString(eventType)) {
            return 0;
        }
        var handlerChain = this._eventMap[eventType.toLowerCase()];
        if (!handlerChain || handlerChain.length === 0) {
            return 0;
        }
        var count = 0;
        for (var i = 0, len = handlerChain.length; i < len; i++) {
            if (handler) {
                if (handler === handlerChain[i].handler &&
                    (isNil(context) || handlerChain[i].context === context)) {
                    return 1;
                }
            } else {
                count++;
            }
        }
        return count;
    }

    /**
     * Copy all the event listener to the target object
     * @param {Object} target - target object to copy to.
     * @return {*} this
     */
    copyEventListeners(target) {
        var eventMap = target._eventMap;
        if (!eventMap) {
            return this;
        }
        var handlerChain, i, len;
        for (var eventType in eventMap) {
            handlerChain = eventMap[eventType];
            for (i = 0, len = handlerChain.length; i < len; i++) {
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
     * @return {*} this
     */
    fire() {
        if (this._eventParent) {
            return this._eventParent.fire.apply(this._eventParent, arguments);
        }
        return this._fire.apply(this, arguments);
    }

    _wrapOnceHandler(evtType, handler, context) {
        var me = this;
        var called = false;
        return function onceHandler() {
            if (called) {
                return;
            }
            called = true;
            if (context) {
                handler.apply(context, arguments);
            } else {
                handler.apply(this, arguments);
            }
            me.off(evtType, onceHandler, this);
        };
    }

    _switch(to, eventKeys, context) {
        for (var p in eventKeys) {
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
        var handlerChain = this._eventMap[eventType.toLowerCase()];
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
     */
    _setEventParent(parent) {
        this._eventParent = parent;
        return this;
    }

    _fire(eventType, param) {
        if (!this._eventMap) {
            return this;
        }
        var handlerChain = this._eventMap[eventType.toLowerCase()];
        if (!handlerChain) {
            return this;
        }
        if (!param) {
            param = {};
        }
        param['type'] = eventType;
        param['target'] = this;
        //in case of deleting a listener in a execution, copy the handlerChain to execute.
        var queue = handlerChain.slice(0),
            context, bubble, passed;
        for (var i = 0, len = queue.length; i < len; i++) {
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
