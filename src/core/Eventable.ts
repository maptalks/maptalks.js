import GlobalConfig from '../GlobalConfig';
import { MixinConstructor } from './Mixin';
import { extend, isString, isNil, UID, isNumber } from './util';
import { stopPropagation } from './util/dom';

/**
 * This provides methods used for event handling. It's a mixin and not meant to be used directly.
 * @mixin Eventable
 */
function generateWrapKey(eventType: string): string {
    return 'Z__' + eventType;
}

type HandlerContext = {
    handler: HandlerFn,
    context: any
};
export type HandlerFn = (...args: any[]) => void | boolean;

export default function <T extends MixinConstructor>(Base: T) {
    return class EventableMixin extends Base {
        _eventMap?: Record<string, HandlerContext[]>;
        _eventParent?: EventableMixin;
        _eventTarget?: any;
        /**
         * 注册事件的监听
         *
         * @english
         * Register a handler function to be called whenever this event is fired.
         *
         * @param eventsOn           - event types to register, seperated by space if more than one.
         * @param handler            - handler function to be called
         * @param context            - the context of the handler
         * @example
         * foo.on('mousedown mousemove mouseup', onMouseEvent, foo);
         */
        on(eventsOn: string, handlerFn: HandlerFn, context?: any): this {
            if (!eventsOn) {
                return this;
            }
            if (!isString(eventsOn)) {
                return this._switch('on', eventsOn, handlerFn);
            }
            if (!handlerFn) {
                return this;
            }
            if (!this._eventMap) {
                this._eventMap = {};
            }
            const eventTypes = eventsOn.toLowerCase().split(' ');
            let evtType;
            if (!context) {
                /* eslint-disable @typescript-eslint/no-this-alias */
                context = this;
                /* eslint-enable @typescript-eslint/no-this-alias */
            }
            //检测handler是否被监听过
            const handler = handlerFn as any;
            const isAdd = isNumber(handler._id);
            handler._id = UID();
            let handlerChain: HandlerContext[];
            for (let ii = 0, ll = eventTypes.length; ii < ll; ii++) {
                evtType = eventTypes[ii];
                const wrapKey = generateWrapKey(evtType);
                if (handler[wrapKey]) {
                    handler[wrapKey]._id = handler._id;
                }
                handlerChain = this._eventMap[evtType];
                if (!handlerChain) {
                    handlerChain = [];
                    this._eventMap[evtType] = handlerChain;
                }
                //没有监听过的handler直接入列
                if (!isAdd) {
                    handlerChain.push({
                        handler: handler,
                        context: context
                    });
                    continue;
                }
                const l = handlerChain.length;
                if (l > 0) {
                    for (let i = 0; i < l; i++) {
                        if (handler === handlerChain[i].handler && handlerChain[i].context === context) {
                            if (!GlobalConfig.isTest) {
                                console.warn(this, `find '${eventsOn}' handler:`, handler, ' The old listener function will be removed');
                            }
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
         * on方法的alias
         *
         * @english
         * Alias for [on]{@link Eventable.on}
         *
         * @param eventTypes     - event types to register, seperated by space if more than one.
         * @param handler        - handler function to be called
         * @param context        - the context of the handler
         */
        addEventListener(...args): this {
            return this.on.call(this, ...args);
        }

        /**
         * 与on方法作用类似，但监听方法只会执行一次
         *
         * @english
         * Same as on, except the listener will only get fired once and then removed.
         *
         * @param eventTypes         - event types to register, seperated by space if more than one.
         * @param handler            - listener handler
         * @param context            - the context of the handler
         * @example
         * foo.once('mousedown mousemove mouseup', onMouseEvent, foo);
         */
        once(eventTypes: string | HandlerContext, handler: HandlerFn, context?: any) {
            if (!isString(eventTypes)) {
                eventTypes = eventTypes as HandlerContext;
                const once = {};
                for (const p in eventTypes) {
                    if (eventTypes.hasOwnProperty(p)) {
                        once[p] = this._wrapOnceHandler(p, eventTypes[p], context);
                    }
                }
                return this._switch('on', once);
            }
            eventTypes = eventTypes as string;
            const evetTypes = eventTypes.split(' ');
            for (let i = 0, l = evetTypes.length; i < l; i++) {
                this.on(evetTypes[i], this._wrapOnceHandler(evetTypes[i], handler, context));
            }
            return this;
        }

        /**
         *
         * 取消对事件的监听
         *
         * @english
         * Unregister the event handler for the specified event types.
         *
         * @param eventsOff         - event types to unregister, seperated by space if more than one.
         * @param handler           - listener handler
         * @param context           - the context of the handler
         * @example
         * foo.off('mousedown mousemove mouseup', onMouseEvent, foo);
         */
        off(eventsOff: string, handler: HandlerFn, context?: any) {
            if (!this._eventMap || !eventsOff) {
                return this;
            }
            if (!isString(eventsOff)) {
                return this._switch('off', eventsOff, handler);
            }
            if (!handler) {
                return this;
            }
            //没有监听过的handler直接忽略
            if (!isNumber((handler as any)._id)) {
                return this;
            }
            const eventTypes = eventsOff.split(' ');
            let eventType, listeners, wrapKey;
            if (!context) {
                /* eslint-disable @typescript-eslint/no-this-alias */
                context = this;
                /* eslint-enable @typescript-eslint/no-this-alias */
            }
            for (let j = 0, jl = eventTypes.length; j < jl; j++) {
                eventType = eventTypes[j].toLowerCase();
                wrapKey = generateWrapKey(eventType);
                listeners = this._eventMap[eventType];
                if (!listeners) {
                    continue;
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
         * off方法的别名 alias
         *
         * @english
         * Alias for [off]{@link Eventable.off}
         *
         * @param eventTypes       - event types to unregister, seperated by space if more than one.
         * @param handler          - listener handler
         * @param context          - the context of the handler
         */
        removeEventListener(...args) {
            return this.off.call(this, ...args);
        }

        /**
         * 是否监听了指定的事件
         *
         * @english
         * Returns listener's count registered for the event type.
         *
         * @param eventType       - an event type
         * @param hanlder         - listener function
         * @param context         - the context of the handler
         */
        listens(eventType: string, handler?: HandlerFn, context?: any): number {
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
         * @function Eventable.getListeningEvents
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
        fire(...args) {
            if (this._eventParent) {
                return this._eventParent.fire.call(this._eventParent, ...args);
            }
            return this._fire.call(this, ...args);
        }

        _wrapOnceHandler(evtType, handler, context) {
            // const me = this;
            const key = generateWrapKey(evtType);
            let called = false;
            const fn = function onceHandler(...args) {
                if (called) {
                    return;
                }
                delete fn[key];
                called = true;
                if (context) {
                    handler.call(context, ...args);
                } else {
                    handler.call(this, ...args);
                }
                (onceHandler as any)._called = true;
                // me.off(evtType, onceHandler, this);
            };
            fn[key] = handler;
            return fn;
        }

        _switch(to: string, eventKeys, context?: any) {
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

        _setEventTarget(target) {
            this._eventTarget = target;
            return this;
        }

        _fire(eventType, param) {
            if (!this._eventMap) {
                return this;
            }
            eventType = eventType.toLowerCase();
            const handlerChain = this._eventMap[eventType];
            if (!handlerChain) {
                return this;
            }
            if (!param) {
                param = {};
            }
            param['type'] = eventType;
            param['target'] = this._eventTarget || this;
            //in case of deleting a listener in a execution, copy the handlerChain to execute.
            const queue = handlerChain.slice(0);
            let context, bubble, passed;
            for (let i = 0, len = queue.length; i < len; i++) {
                if (!queue[i]) {
                    continue;
                }
                const handler = queue[i].handler;
                if ((handler as any)._called) {
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
            const eventQueue = this._eventMap[eventType];
            if (eventQueue) {
                const queueExcludeOnce = [];
                for (let i = 0, len = eventQueue.length; i < len; i++) {
                    const handler = eventQueue[i].handler;
                    if (!(handler as any)._called) {
                        queueExcludeOnce.push(eventQueue[i]);
                    }
                }
                this._eventMap[eventType] = queueExcludeOnce;
            }
            return this;
        }
    }
}
