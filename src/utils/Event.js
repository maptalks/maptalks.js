/**
*   set two keys for events: _idx,_len
*   _len means the count of handlers have bind with context
*   _event popNode
*   @author yellow date 2014/11/10
*   @class J.utils.Event
*   @inheritable
*/

const stamp = require('./stamp').stamp,
    splitWords = require('./splitWords').splitWords,
    noop = require('./noop'),
    merge = require('./merge');

/**
 * @class 
 */
class Event {

    constructor() {
        this._eventPopNodes = {};
        this._events = {};
    }

    _on(type, fn, context) {
        var events = this._events,
            contextId = context && context !== this && stamp(context);
        if (contextId) {
            var indexKey = type + '_idx',
                indexLenKey = type + '_len',
                typeIndex = events[indexKey] = events[indexKey] || {},
                id = stamp(fn) + '_' + contextId;
            if (!typeIndex[id]) {
                typeIndex[id] = { fn: fn, ctx: context };
                events[indexLenKey] = events[indexLenKey] || 0;
                events[indexLenKey]++;
            }
        } else {
            events[type] = events[type] || [];
            events[type].push({ fn: fn });
        }
    }

    _off(type, fn, context) {
        var events = this._events,
            indexKey = type + '_idx',
            indexLenKey = type + '_len';
        if (!events) {
            return;
        }
        if (!fn) {
            delete events[type];
            delete events[indexKey];
            delete events[indexLenKey];
            return;
        }
        var contextId = context && context !== this && stamp(context),
            listeners, i, len, listener, id;
        if (contextId) {
            id = stamp(fn) + '_' + contextId;
            listeners = events[indexKey];
            if (listeners && listeners[id]) {
                listener = listeners[id];
                delete listeners[id];
                --events[indexLenKey];
            }
        } else {
            listeners = events[type];
            if (listeners) {
                for (i = 0, len = listeners.length; i < len; i++) {
                    if (listeners[i].fn === fn) {
                        listener = listeners[i];
                        listeners.splice(i, 1);
                        break;
                    }
                }
            }
        }
        if (listener) {
            listener.fn = noop;
        }
    }

    once(types, fn, context) {
        if (typeof types === 'object') {
            for (var type in types) {
                this.once(type, types[type], fn);
            }
            return this;
        }
        var handler = bind(function () {
            this.off(types, fn, context).off(types, handler, context);
        }, this);
        return this.on(types, fn, context).on(types, handler, context);
    }

    on(types, fn, context) {
        if (typeof types === 'object') {
            for (var type in types) {
                this._on(type, types[type], fn);
            }
        } else {
            types = splitWords(types);
            for (var i = 0, len = types.length; i < len; i++) {
                this._on(types[i], fn, context);
            }
        }
        return this;
    }

    /**
    *   移除事件
    *   @method off
    *   @chainable
    *   @param {String} types 形如'mousemove click'
    *   @param {Funtion} fn
    *   @param {Object} context 上下文，用于存储事件
    *   @return {Object} this
    */
    off(types, fn, context) {
        if (!types) {
            delete this._events;
        } else if (typeof types === 'object') {
            for (var type in types) {
                this._off(type, types[type], fn);
            }
        } else {
            types = splitWords(types);
            for (var i = 0, len = types.length; i < len; i++) {
                this._off(types[i], fn, context);
            }
        }
        return this;
    }

    fire(type, data, propagate) {
        if (!this.listens(type, propagate)) { return this; }
        var event = merge({}, data, { type: type, target: this }),
            events = this._events;
        var typeIndex = events[type + '_idx'],
            i, len, listeners, id;
        if (events[type]) {
            listeners = events[type].slice();
            for (i = 0, len = listeners.length; i < len; i++) {
                listeners[i].fn.call(this, event);
            }
        }
        for (id in typeIndex) {
            typeIndex[id].fn.call(typeIndex[id].ctx, event);
        }
        if (propagate) {
            this._propagateEvent(event);
        }
        return this;
    }

    listens(type, propagate) {
        var events = this._events;
        if (events[type] || events[type + '_len']) {
            return true;
        }
        if (propagate) {
            for (var id in this._eventPopNodes) {
                if (this._eventPopNodes[id].listens(type, propagate)) { return true; }
            }
        }
        return false;
    }

    addEventPopNode(obj) {
        this._eventPopNodes[stamp(obj)] = obj;
        return this;
    }

    removeEventPopNode(obj) {
        if (!!this._eventPopNodes[stamp(obj)]) {
            delete this._eventPopNodes[stamp(obj)];
        }
        return this;
    }

    _propagateEvent(e) {
        for (let id in this._eventPopNodes) {
            this._eventPopNodes[id].fire(e.type, merge({ popNode: e.target }, e), true);
        }
    }

}

module.exports = Event;