import { create, extend, hasOwn } from 'core/util';

/**
 * OOP facilities of the library. <br/>
 * Thanks to Leaflet's inspiration (http://www.leafletjs.com)
 * @see  [Original explanation by Leaflet]{@link http://leafletjs.com/reference.html#class}
 *
 * @class
 * @category core
 * @abstract
 */
export default class Class {}

/**
 * Extend a class with a prototype object with instance methods and properties.
 *
 * @param  {object} props - a literal object with instance properties or methods.
 * @return {Class}
 * @static
 * @example
 *  var MyClass = Class.extend({
        initialize: function (greeter) {
            this.greeter = greeter;
            // class constructor
        },
        greet: function (name) {
            alert(this.greeter + ', ' + name)
        }
    });
    // create instance of MyClass, passing "Hello" to the constructor
    var a = new MyClass("Hello");
    // call greet method, alerting "Hello, World"
    a.greet("World");
 */
Class.extend = function (props) {

    // extended class with the new prototype
    var NewClass = function () {
        var self = this;
        if (!(this instanceof NewClass)) {
            // fix consructing without new silently
            self = create(NewClass.prototype);
        }

        // call the constructor
        if (self.initialize) {
            self.initialize.apply(self, arguments);
        }

        // call all constructor hooks
        if (self._initHooks) {
            self.callInitHooks();
        }

        return self;
    };

    var parentProto = NewClass.__super__ = this.prototype;

    /** @lends Class.prototype */
    var proto = create(parentProto);

    proto.constructor = NewClass;

    NewClass.prototype = proto;

    // inherit parent's statics
    for (var i in this) {
        if (i[0] !== '_' && hasOwn(this, i) && i !== 'prototype' && !(this[i] instanceof Class)) {
            NewClass[i] = this[i];
        }
    }

    // mix static properties into the class
    if (props.statics) {
        extend(NewClass, props.statics);
        delete props.statics;
    }

    // mix includes into the prototype
    if (props.includes) {
        extend.apply(null, [proto].concat(props.includes));
        delete props.includes;
    }

    // merge options
    if (proto.options) {
        props.options = extend(create(proto.options), props.options);
    }

    // mix given properties into the prototype
    extend(proto, props);

    proto._initHooks = [];

    // add method for calling all hooks
    proto.callInitHooks = function () {

        if (this._initHooksCalled) {
            return;
        }

        if (parentProto.callInitHooks) {
            parentProto.callInitHooks.call(this);
        }

        this._initHooksCalled = true;

        for (var i = 0, len = proto._initHooks.length; i < len; i++) {
            proto._initHooks[i].call(this);
        }
    };

    /**
     * Get a shallow copy of or update Class's options.<br>
     * If the instance has a handler of the same name with the given option key, the handler will be enabled or disabled when the option is updated.
     * @param  {object|string} options - options to update, leave empty to get a shallow copy of options.
     * @return {object|this}
     */
    proto.config = function (conf) {
        if (!conf) {
            var config = {};
            for (var p in this.options) {
                if (hasOwn(this.options, p)) {
                    config[p] = this.options[p];
                }
            }
            return config;
        } else {
            if (arguments.length === 2) {
                var t = {};
                t[conf] = arguments[1];
                conf = t;
            }
            for (var i in conf) {
                if (hasOwn(conf, i)) {
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
            }
            // callback when set config
            if (this.onConfig) {
                this.onConfig(conf);
            }
        }
        return this;
    };

    return NewClass;
};


/**
 * method for adding properties to prototype
 * @param  {object} props - additional instance methods or properties
 * @static
 */
Class.include = function () {
    var sources = arguments;
    for (var j = 0, len = sources.length; j < len; j++) {
        extend(this.prototype, sources[j]);
    }
    return this;
};

/**
 * merge new default options to the Class
 * @param  {object} options - default options.
 * @static
 */
Class.mergeOptions = function (options) {
    extend(this.prototype.options, options);
    return this;
};

/**
 * add a constructor hook
 * @param {string|function} fn - a hook function or name of the hook function and arguments
 * @param {...any} args        - args for fn
 * @static
 */
Class.addInitHook = function (fn, ...args) { // (Function) || (String)
    var init = typeof fn === 'function' ? fn : function () {
        this[fn].apply(this, args);
    };

    this.prototype._initHooks = this.prototype._initHooks || [];
    this.prototype._initHooks.push(init);
    return this;
};
