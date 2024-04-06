import { extend } from './util/common';
import Handler from '../handler/Handler';
import Browser from './Browser';

/* eslint-disable @typescript-eslint/ban-types */
export type ClassOptions = Record<string, any>;

/**
 *
 * 基类（Class）
 * 该库中所有的类都继承于该基类。
 * 该类提供了定义新类时常用的工具方法，如管理配置options，添加 init hooks 等。
 *
 * @english
 * This library uses ES2015 class system.
 * Class is the root class of class hierachy.
 * It provides utility methods to make it easier to manage configration options, merge mixins and add init hooks.
 *
 * @example
 * const defaultOptions = {
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
 */
class Class {
    _isUpdatingOptions?: boolean;
    _initHooksCalled?: boolean;
    _initHooks?: Function[];
    options?: ClassOptions;
    /**
     *
     * @english
     * Create an object, set options if given and call all the init hooks.<br />
     * Options is where the object manages its configuration. Options passed to the object will be merged with parent's instead of overriding it.
     *
     * @param options - options to set
     */
    constructor(options?: ClassOptions) {
        if (!this || !this.setOptions) {
            throw new Error('Class instance is being created without "new" operator.');
        }
        this.setOptions(options);
        this.callInitHooks();
        this._isUpdatingOptions = false;
    }

    proxyOptions() {
        if (!Browser.proxy) {
            return this;
        }
        this.options = new Proxy(this.options, {
            set: (target, key, value) => {
                key = key as string;
                if (target[key] === value) {
                    return true;
                }
                target[key] = value;
                if (this._isUpdatingOptions) {
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
     * 遍历并执行该类或父类用 addInitHook 添加的 init hooks
     *
     * @english
     * Visit and call all the init hooks defined on Class and its parents.
     */
    callInitHooks() {
        const proto = Object.getPrototypeOf(this);
        this._visitInitHooks(proto);
        return this;
    }

    /**
     * 设置新的配置 options
     *
     * @english
     * Merges options with the default options of the object.
     * @param options - options to set
     */
    setOptions(options: ClassOptions) {
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
     *
     * 更新options中指定的配置项。
     * 1. 如果没有提供参数，则返回options配置对象
     * 2. 如果配置项有对应的handler，handler会被启用或停用，例如draggable
     *
     * @english
     * 1. Return object's options if no parameter is provided. <br/>
     * 2. update an option and enable/disable the handler if a handler with the same name existed.
     *
     * @example
     * // Get marker's options;
     * const options = marker.config();
     * // Set map's option "draggable" to false and disable map's draggable handler.
     * map.config('draggable', false);
     * // You can update more than one options like this:
     * map.config({
     *     'scrollWheelZoom' : false,
     *     'doubleClickZoom' : false
     * });
     * @param conf - config to update
     * @return
     */
    config(conf?: string | ClassOptions, value?: any): ClassOptions | this {
        this._isUpdatingOptions = true;
        if (!conf) {
            const config = {} as ClassOptions;
            for (const p in this.options) {
                if (this.options.hasOwnProperty(p)) {
                    config[p] = this.options[p];
                }
            }
            this._isUpdatingOptions = false;
            return config;
        } else {
            if (arguments.length === 2 && typeof conf === 'string') {
                const t = {};
                t[conf] = value;
                conf = t;
            }
            conf = conf as ClassOptions;
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
            this._isUpdatingOptions = false;
        }
        return this;
    }

    /* eslint-disable @typescript-eslint/no-unused-vars */
    /**
     * options被更新时的回调函数
     *
     * @english
     * Default callback when config is called
     *
     * @param conf - updated options
     */
    onConfig(conf: ClassOptions) {

    }
    /* eslint-enable @typescript-eslint/no-unused-vars */

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
     * 添加一个初始化钩子（init hook）方法，实例化时会被调用。
     * 该方法一般用于插件开发，利用初始化钩子，子类无需重载父类的构造函数（constructor），就可以在实例化时执行一些必要的逻辑
     *
     * @english
     * Add an init hook, which will be called when the object is initiated. <br>
     * It is useful in plugin developing to do things when creating objects without changing class's constructor.
     * @param fn - a hook function or name of the hook function
     * @param args - arguments for the init hook function
     */
    static addInitHook(fn: Function | string, ...args) {
        const init: Function = typeof fn === 'function' ? fn : function () {
            this[fn].call(this, ...args);
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
     * 将一个或多个，sources中定义的方法或属性，mixin到该类的prototype中
     *
     * @english
     * Mixin the specified objects into the class as prototype properties or methods.
     * @param sources - objects to mixin
     */
    static include(...sources: any[]) {
        for (let i = 0; i < sources.length; i++) {
            extend(this.prototype, sources[i]);
        }
        return this;
    }

    /**
     * 用参数中的options定义扩展默认的options
     *
     * @english
     * Mixin options with the class's default options.
     * @param options - options to merge.
     */
    static mergeOptions(options: ClassOptions) {
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
/* eslint-enable @typescript-eslint/ban-types */
