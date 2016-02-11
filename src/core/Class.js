/*
 * OOP facilities of the library.
 * Thanks to Leaflet's inspiration (http://www.leafletjs.com)
 * @class maptalks.Class
 */
Z.Class = function () {};

Z.Class.extend = function (props) {
    // extended class with the new prototype
    var NewClass = function () {
        // call the constructor
        if (this.initialize) {
            this.initialize.apply(this, arguments);
        }

        // call all constructor hooks
        if(this._initHooks) {
            this.callInitHooks();
        }
    };

    var parentProto = NewClass.__super__ = this.prototype;

    var proto = Z.Util.create(parentProto);

    proto.constructor = NewClass;

    NewClass.prototype = proto;

    // inherit parent's statics
    for (var i in this) {
        if (this.hasOwnProperty(i) && i !== 'prototype') {
            NewClass[i] = this[i];
        }
    }

    // mix static properties into the class
    if (props.statics) {
        Z.Util.extend(NewClass, props.statics);
        delete props.statics;
    }

    // mix includes into the prototype
    if (props.includes) {
        Z.Util.extend.apply(null, [proto].concat(props.includes));
        delete props.includes;
    }

    // merge options
    if (proto.options) {
        props.options = Z.Util.extend(Z.Util.create(proto.options), props.options);
    }

    // exception definitions
    if (props.exceptionDefs) {
        var lang = Z.Browser.language;
        if ( lang !== 'zh-CN') {
            lang = 'en-US'; //only support chinese and english now;
        }
        Z.Util.extend(proto, {exceptions:props.exceptionDefs[lang]});
        delete props.exceptionDefs;
    }

    // mix given properties into the prototype
    Z.Util.extend(proto, props);

    proto._initHooks = [];

    // add method for calling all hooks
    proto.callInitHooks = function () {

        if (this._initHooksCalled ) { return; }

        if (parentProto.callInitHooks) {
            parentProto.callInitHooks.call(this);
        }

        this._initHooksCalled = true;

        for (var i = 0, len = proto._initHooks.length; i < len; i++) {
            proto._initHooks[i].call(this);
        }
    };
    // config to set option and enable/disable handler
    proto.config = function(conf) {
        if (!conf) {
            var config = {};
            for (var p in this.options) {
                if (this.options.hasOwnProperty(p)) {
                    config[p] = this.options[p];
                }
            }
            return config;
        } else {
            if (arguments.length === 2) {
                var convert = {};
                convert[conf] = arguments[1];
                conf = convert;
            }
            for (var i in conf) {
                if (conf.hasOwnProperty(i)) {
                     this.options[i] = conf[i];
                    //handler
                    if (this[i] && (this[i] instanceof Z.Handler)) {
                        if (conf[i]) {
                            this[i].enable();
                        } else {
                            this[i].disable();
                        }
                    }
                }
            }
            //callback when set config
            if (this.onConfig && (typeof this.onConfig == 'function' || (this.onConfig.constructor!==null && this.onConfig.constructor == Function))) {
                this.onConfig(conf);
            }
        }
        return this;
    };

    return NewClass;
};


// method for adding properties to prototype
Z.Class.include = function (props) {
    var sources = arguments;
    for (var j = 0, len = sources.length; j < len; j++) {
        Z.Util.extend(this.prototype, sources[j]);
    }

};

// merge new default options to the Class
Z.Class.mergeOptions = function (options) {
    Z.Util.extend(this.prototype.options, options);
};

// add a constructor hook
Z.Class.addInitHook = function (fn) { // (Function) || (String, args...)
    var args = Array.prototype.slice.call(arguments, 1);

    var init = typeof fn === 'function' ? fn : function () {
        this[fn].apply(this, args);
    };

    this.prototype._initHooks = this.prototype._initHooks || [];
    this.prototype._initHooks.push(init);
};
