//@namespace
maptalks.animation = {};

/**
 * @classdesc
 * Utilities for animation
 * @class
 * @category animation
 */
maptalks.Animation = {
    /**
     * @property {Object} speed         - predefined animation speed
     * @property {Number} speed.slow    - 2000ms
     * @property {Number} speed.normal  - 1000ms
     * @property {Number} speed.fast    - 500ms
     */
    speed:{
        'slow'   : 2000,
        'normal' : 1000,
        'fast'   : 500
    },



    /**
     * resolve styles for animation, get a style group of start style, styles to animate and end styles.
     * @param  {Object} styles - styles to resolve
     * @return {Object[]}  styles resolved
     * @private
     */
    _resolveStyles:function (styles) {
        if (!styles) {
            return null;
        }
        //resolve a child styles.
        function resolveChild(child) {
            if (!maptalks.Util.isArray(child)) {
                return maptalks.Animation._resolveStyles(child);
            }
            var start = [], d = [], dest = [];
            for (var i = 0; i < child.length; i++) {
                var styles = maptalks.Animation._resolveStyles(child[i]);
                if (styles) {
                    start.push(styles[0]);
                    d.push(styles[1]);
                    dest.push(styles[2]);
                }
            }
            if (start.length === 0) {
                return null;
            } else {
                return [start, d, dest];
            }
        }
        // resolve a style value.
        function resolveVal(val) {
            var values = val,
                clazz;
            //val is just a destination value, so we set start value to 0 or a 0-point or a 0-coordinate.
            if (!maptalks.Util.isArray(val)) {
                if (maptalks.Util.isNumber(val)) {
                    values = [0, val];
                } else if (val instanceof maptalks.Point || val instanceof maptalks.Coordinate) {
                    clazz = val.constructor;
                    values = [new clazz(0, 0), val];
                } else {
                    values = [val, val];
                }
            }
            //val is a array and val[0] is the start value and val[1] is the destination value.
            var v1 = values[0],
                v2 = values[1];
            if (maptalks.Util.isNumber(v1) && maptalks.Util.isNumber(v2)) {
                if (v1 === v2) {
                    return null;
                }
                return [v1, v2 - v1, v2];
            } else if (maptalks.Util.isArray(v1) || v1 instanceof maptalks.Coordinate || v1 instanceof maptalks.Point) {
                // is a coordinate (array or a coordinate) or a point
                if (maptalks.Util.isArray(v1)) {
                    v1 = new maptalks.Coordinate(v1);
                    v2 = new maptalks.Coordinate(v2);
                } else {
                    clazz = v1.constructor;
                    v1 = new clazz(v1);
                    v2 = new clazz(v2);
                }
                if (v1.equals(v2)) {
                    //a Coordinate or a Point to be eql with each other
                    return null;
                }
                return [v1, v2.substract(v1), v2];
            } else {
                return [v1, 0, v2];
            }
        }

        function isChild(val) {
            if (!maptalks.Util.isArray(val) && val.constructor === Object) {
                return true;
            } else if (maptalks.Util.isArray(val) && val[0].constructor === Object) {
                return true;
            }
            return false;
        }

        var d = {}, start = {}, dest = {};
        for (var p in styles) {
            if (styles.hasOwnProperty(p)) {
                var values = styles[p];
                var childStyles;
                if (isChild(values)) {
                    childStyles = resolveChild(values);
                } else {
                    childStyles = resolveVal(values);
                }
                if (childStyles) {
                    start[p] = childStyles[0];
                    d[p] = childStyles[1];
                    dest[p] = childStyles[2];
                }
            }
        }
        return [start, d, dest];
    },

    /**
     * Generate a framing function
     * @param  {Object[]} styles        - animation style group
     * @param  {Object} [options=null]  - options
     * @param  {Object} [options.easing=null]  - animation easing
     * @return {Function} framing function helps to generate animation frames.
     */
    framing:function (styles, options) {
        if (!options) {
            options = {};
        }
        var easing = options['easing'] ? maptalks.animation.Easing[options['easing']] : maptalks.animation.Easing.linear;
        if (!easing) { easing = maptalks.animation.Easing.linear; }
        var dStyles, startStyles, destStyles;
        styles = maptalks.Animation._resolveStyles(styles);
        if (styles) {
            startStyles = styles[0];
            dStyles = styles[1];
            destStyles = styles[2];
        }
        var deltaStyles = function (delta, _startStyles, _dStyles) {
            if (!_startStyles || !_dStyles) {
                return null;
            }
            var result = {};
            for (var p in _dStyles) {
                if (_dStyles.hasOwnProperty(p)) {
                    if (_startStyles[p] === destStyles[p]) {
                        result[p] = _startStyles[p];
                        continue;
                    }
                    var s = _startStyles[p], d = _dStyles[p];
                    if (maptalks.Util.isNumber(d)) {
                        //e.g. radius, width, height
                        result[p] = s + delta * d;
                    } else if (maptalks.Util.isArray(d)) {
                        //e.g. a composite symbol, element in array can only be a object.
                        var children = [];
                        for (var i = 0; i < d.length; i++) {
                            children.push(deltaStyles(delta, s[i], d[i]));
                        }
                        result[p] = children;
                    } else {
                        //e.g. translate or a child
                        var clazz = d.constructor;
                        if (clazz === Object) {
                            result[p] = deltaStyles(delta, s, d);
                        } else if (s instanceof maptalks.Point || s instanceof maptalks.Coordinate) {
                            result[p] = s.add(d.multi(delta));
                        }
                    }
                }
            }
            return result;
        };
        return function (elapsed, duration) {
            var state, d;
            if (elapsed < 0) {
                state = {
                    'playState' : 'idle',
                    'delta'   : 0
                };
                d = startStyles;
            } else if (elapsed <  duration) {
                var delta = easing(elapsed / duration);
                state = {
                    'playState' : 'running',
                    'delta' : delta
                };
                d = deltaStyles(delta, startStyles, dStyles);
            } else {
                state = {
                    'playState' : 'finished',
                    'delta' : 1
                };
                d = destStyles;
            }
            state['startStyles'] = startStyles;
            state['destStyles'] = destStyles;
            return new maptalks.animation.Frame(state, d);
        };

    },

    _requestAnimFrame:function (fn) {
        if (!this._frameQueue) {
            this._frameQueue = [];
        }
        this._frameQueue.push(fn);
        this._a();
    },

    _a:function () {
        if (!this._animationFrameId) {
            this._animationFrameId = maptalks.Util.requestAnimFrame(maptalks.Util.bind(maptalks.Animation._run, maptalks.Animation));
        }
    },

    _run:function () {
        if (this._frameQueue.length) {
            var running = this._frameQueue;
            this._frameQueue = [];
            for (var i = 0, len = running.length; i < len; i++) {
                running[i]();
            }
            if (this._frameQueue.length) {
                this._animationFrameId = maptalks.Util.requestAnimFrame(maptalks.Util.bind(maptalks.Animation._run, maptalks.Animation));
            } else {
                delete this._animationFrameId;
            }
        }
    },

    /**
     * Get a animation player
     * @param  {Object} styles  - styles to animate
     * @param  {Object} options - animation options
     * @param  {Function} step  - callback function for animation steps
     * @return {maptalks.animation.Player} player
     */
    animate : function (styles, options, step) {
        if (!options) {
            options = {};
        }
        var animation = maptalks.Animation.framing(styles, options);
        return new maptalks.animation.Player(animation, options, step);
    }
};

/**
 * @classdesc
 * [Web Animation API]{@link https://developer.mozilla.org/zh-CN/docs/Web/API/Animation} style animation player
 * @param {Function} animation - animation [framing]{@link maptalks.Animation.framing} function
 * @param {Object} options     - animation options
 * @param  {Function} step  - callback function for animation steps
 * @class
 * @category animation
 * @memberOf maptalks.animation
 * @name Player
 */
maptalks.animation.Player = function (animation, options, step) {
    this._animation = animation;
    this._options = options;
    this._stepFn = step;
    this.playState = 'idle';
    this.ready = true;
    this.finished = false;
};

maptalks.Util.extend(maptalks.animation.Player.prototype, /** @lends maptalks.animation.Player.prototype */{
    _prepare:function () {
        var options = this._options;
        var duration = options['speed'];
        if (maptalks.Util.isString(duration)) { duration = maptalks.Animation.speed[duration]; }
        if (!duration) { duration = maptalks.Animation.speed['normal']; }
        this.duration = duration;
    },
    /**
     * Start or resume the animation
     * @return {maptalks.animation.Player} this
     */
    play:function () {
        if (this.playState !== 'idle' && this.playState !== 'paused') {
            return this;
        }
        if (this.playState === 'idle') {
            this.currentTime = 0;
            this._prepare();
        }
        var now = maptalks.Util.now();
        if (!this.startTime) {
            var options = this._options;
            this.startTime = options['startTime'] ? options['startTime'] : now;
        }
        this._playStartTime = Math.max(now, this.startTime);
        if (this.playState === 'paused') {
            this._playStartTime -= this.currentTime;
        }
        this.playState = 'running';
        this._run();
        return this;
    },
    /**
     * Pause the animation
     * @return {maptalks.animation.Player} this
     */
    pause:function () {
        this.playState = 'paused';
        //this.duration = this.duration - this.currentTime;
        return this;
    },
    /**
     * Cancel the animation play and ready to play again
     * @return {maptalks.animation.Player} this
     */
    cancel:function () {
        this.playState = 'idle';
        this.finished = false;
        return this;
    },
    /**
     * Finish the animation play, and can't be played any more.
     * @return {maptalks.animation.Player} this
     */
    finish:function () {
        this.playState = 'finished';
        this.finished = true;
        return this;
    },
    reverse:function () {

    },
    _run:function () {
        if (this.playState === 'finished' || this.playState === 'paused') {
            return;
        }
        var me = this;
        var now = maptalks.Util.now();
        var elapsed = now - this._playStartTime;
        if (this._options['repeat'] && elapsed >= this.duration) {
            this._playStartTime = now;
            elapsed = 0;
        }
        //elapsed, duration
        var frame = this._animation(elapsed, this.duration);
        this.playState = frame.state['playState'];
        var step = this._stepFn;
        if (this.playState === 'idle') {
            setTimeout(maptalks.Util.bind(this._run, this), this.startTime - now);
        } else if (this.playState === 'running') {
            this._animeFrameId = maptalks.Animation._requestAnimFrame(function () {
                if (me.playState !== 'running') {
                    return;
                }
                me.currentTime = now - me._playStartTime;
                if (step) {
                    step(frame);
                }
                me._run();
            });
        } else if (this.playState === 'finished') {
            this.finished = true;
            //finished
            if (step) {
                maptalks.Util.requestAnimFrame(function () {
                    step(frame);
                });
            }
        }

    }
});

/**
 * @classdesc
 * Easing functions for anmation, from openlayers 3
 * @class
 * @category animation
 * @memberOf maptalks.animation
 * @name Easing
 * @protected
 */
maptalks.animation.Easing = {
        /**
         * Start slow and speed up.
         * @param {number} t Input between 0 and 1.
         * @return {number} Output between 0 and 1.
         */
    in : function (t) {
        return Math.pow(t, 2);
    },


        /**
         * Start fast and slow down.
         * @param {number} t Input between 0 and 1.
         * @return {number} Output between 0 and 1.
         */
    out : function (t) {
        return 1 - maptalks.animation.Easing.in(1 - t);
    },


        /**
         * Start slow, speed up, and then slow down again.
         * @param {number} t Input between 0 and 1.
         * @return {number} Output between 0 and 1.
         */
    inAndOut : function (t) {
        return 3 * t * t - 2 * t * t * t;
    },


        /**
         * Maintain a constant speed over time.
         * @param {number} t Input between 0 and 1.
         * @return {number} Output between 0 and 1.
         */
    linear : function (t) {
        return t;
    },


        /**
         * Start slow, speed up, and at the very end slow down again.  This has the
         * same general behavior as {@link inAndOut}, but the final slowdown
         * is delayed.
         * @param {number} t Input between 0 and 1.
         * @return {number} Output between 0 and 1.
         */
    upAndDown : function (t) {
        if (t < 0.5) {
            return maptalks.animation.Easing.inAndOut(2 * t);
        } else {
            return 1 - maptalks.animation.Easing.inAndOut(2 * (t - 0.5));
        }
    }
};

/**
 * @classdesc
 * Animation Frame used internally n animation player.
 * @class
 * @category animation
 * @memberOf maptalks.animation
 * @name Frame
 * @protected
 * @param {Object} state  - animation state
 * @param {Object} styles - styles to animate
 */
maptalks.animation.Frame = function (state, styles) {
    this.state = state;
    this.styles = styles;
};
