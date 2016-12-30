import { extend } from './util/common';
import Handler from 'core/Handler';

/**
 * OOP facilities of the library. <br/>
 *
 * @class
 * @category core
 * @abstract
 */
class Class {
    constructor() {
        // this.options = Object.create(this.options);
        this.callInitHooks();
    }

    callInitHooks() {
        const proto = Object.getPrototypeOf(this);
        this._traverseInitHooks(proto);
    }

    _traverseInitHooks(proto) {
        if (this._initHooksCalled) {
            return;
        }
        const parentProto = Object.getPrototypeOf(proto);
        if (parentProto._traverseInitHooks) {
            parentProto._traverseInitHooks.call(this, parentProto);
        }
        this._initHooksCalled = true;
        const hooks = proto._initHooks;
        if (hooks && hooks !== parentProto._initHooks) {
            for (let i = 0; i < hooks.length; i++) {
                hooks[i].call(this);
            }
        }
    }

    setOptions(options) {
        for (let i in options) {
            this.options[i] = options[i];
        }
        return this;
    }

    config(conf) {
        if (!conf) {
            return extend({}, this.options);
        } else {
            if (arguments.length === 2) {
                let t = {};
                t[conf] = arguments[1];
                conf = t;
            }
            for (let i in conf) {
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
            if (this.onConfig) {
                this.onConfig(conf);
            }
        }
        return this;
    }

    /**
     * add a constructor hook
     * @param {string|function} fn - a hook function or name of the hook function
     * @param {any[]} args           - arguments for fn
     * @static
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
    }

    /**
     * method for adding properties to prototype
     * @param  {object} props - additional instance methods or properties
     * @static
     */
    static include(...sources) {
        for (let i = 0; i < sources.length; i++) {
            extend(this.prototype, sources[i]);
        }
        return this;
    }

    /**
     * merge new default options to the Class
     * @param  {object} options - default options.
     * @static
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
