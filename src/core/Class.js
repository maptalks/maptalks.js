import { extend } from './util/common';
import Handler from '../handler/Handler';
import Browser from './Browser';

/**
 * This library uses ES2015 class system. <br />
 * Class is the root class of class hierachy. <br />
 * It provides utility methods to make it easier to manage configration options, merge mixins and add init hooks.
 * @example
 * var defaultOptions = {
 *     'foo' : 'bar'
 * };
 * class Foo extends maptalks.Class {
 *     constructor(id, options) {
 *         super(options);
 *         this.setId(id);
 *     }
 *
 *     setId(id) {
 *         this.id = id;
 *     }
 *
 *     whenCreated() {
 *         // .....
 *     }
 * }
 *
 * Foo.mergeOptions(defaultOptions);
 *
 * Foo.addInitHook('whenCreated');
 * @category core
 * @abstract
 */
class Class {

    /**
     * Create an object, set options if given and call all the init hooks.<br />
     * Options is where the object manages its configuration. Options passed to the object will be merged with parent's instead of overriding it.
     *
     * @param  {Object} options - options to set
     */
    constructor(options) {
        if (!this || !this.setOptions) {
            throw new Error('Class instance is being created without "new" operator.');
        }
        this.setOptions(options);
        this.callInitHooks();
        this._isUpdating = false;
    }

    proxyOptions() {
        if (!Browser.proxy) {
            return this;
        }
        if (this.options.isExtensible) {
            return this;
        }
        this.options = new Proxy(this.options, {
            set: (target, key, value) => {
                if (target[key] === value) {
                    return true;
                }
                target[key] = value;
                if (this._isUpdating) {
                    return true;
                }
                const opts = {};
                opts[key] = value;
                this.config(opts);
                return true;
            }
        });
        return this;
    }

    /**
     * Visit and call all the init hooks defined on Class and its parents.
     * @return {Class} this
     */
    callInitHooks() {
        const proto = Object.getPrototypeOf(this);
        this._visitInitHooks(proto);
        return this;
    }

    /**
     * Merges options with the default options of the object.
     * @param {Object} options - options to set
     * @return {Class} this
     */
    setOptions(options) {
        if (!this.hasOwnProperty('options')) {
            this.options = this.options ? Object.create(this.options) : {};
        }
        if (!options) {
            return this;
        }
        for (const i in options) {
            this.options[i] = options[i];
        }
        return this;
    }

    /**
     * 1. Return object's options if no parameter is provided. <br/>
     *
     * 2. update an option and enable/disable the handler if a handler with the same name existed.
     * @example
     * // Get marker's options;
     * var options = marker.config();
     * // Set map's option "draggable" to false and disable map's draggable handler.
     * map.config('draggable', false);
     * // You can update more than one options like this:
     * map.config({
     *     'scrollWheelZoom' : false,
     *     'doubleClickZoom' : false
     * });
     * @param  {Object} conf - config to update
     * @return {Class} this
     */
    config(conf) {
        this._isUpdating = true;
        if (!conf) {
            const config = {};
            for (const p in this.options) {
                if (this.options.hasOwnProperty(p)) {
                    config[p] = this.options[p];
                }
            }
            this._isUpdating = false;
            return config;
        } else {
            if (arguments.length === 2) {
                const t = {};
                t[conf] = arguments[1];
                conf = t;
            }
            for (const i in conf) {
                this.options[i] = conf[i];
                // enable/disable handler
                if (this[i] && (this[i] instanceof Handler)) {
                    if (conf[i]) {
                        this[i].enable();
                    } else {
                        this[i].disable();
                    }
                }
            }
            // callback when set config
            this.onConfig(conf);
            this._isUpdating = false;
        }
        return this;
    }

    /**
     * Default callback when config is called
     */
    onConfig(/*conf*/) {

    }

    _visitInitHooks(proto) {
        if (this._initHooksCalled) {
            return;
        }
        const parentProto = Object.getPrototypeOf(proto);
        if (parentProto._visitInitHooks) {
            parentProto._visitInitHooks.call(this, parentProto);
        }
        this._initHooksCalled = true;
        const hooks = proto._initHooks;
        if (hooks && hooks !== parentProto._initHooks) {
            for (let i = 0; i < hooks.length; i++) {
                hooks[i].call(this);
            }
        }
    }

    /**
     * Add an init hook, which will be called when the object is initiated. <br>
     * It is useful in plugin developing to do things when creating objects without changing class's constructor.
     * @param {String|Function} fn - a hook function or name of the hook function
     * @param {Any[]} args         - arguments for the init hook function
     */
    static addInitHook(fn, ...args) {
        const init = typeof fn === 'function' ? fn : function () {
            this[fn].apply(this, args);
        };
        const proto = this.prototype;
        const parentProto = Object.getPrototypeOf(proto);
        if (!proto._initHooks || proto._initHooks === parentProto._initHooks) {
            proto._initHooks = [];
        }
        proto._initHooks.push(init);
        return this;
    }

    /**
     * Mixin the specified objects into the class as prototype properties or methods.
     * @param  {...Object} sources - objects to mixin
     */
    static include(...sources) {
        for (let i = 0; i < sources.length; i++) {
            extend(this.prototype, sources[i]);
        }
        return this;
    }

    /**
     * Mixin options with the class's default options. <br />
     * @param  {Object} options - options to merge.
     */
    static mergeOptions(options) {
        const proto = this.prototype;
        const parentProto = Object.getPrototypeOf(proto);
        if (!proto.options || proto.options === parentProto.options) {
            proto.options = proto.options ? Object.create(proto.options) : {};
        }
        extend(proto.options, options);
        return this;
    }
}

export default Class;
