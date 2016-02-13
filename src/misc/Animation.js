//package
Z.animation = {};

Z.Animation = {
    //predefined speed constants.
    speed:{
        'slow'   : 2000,
        'normal' : 1000,
        'fast'   : 500
    },

    /**
     * resolve styles to start, distance and end.
     * @param  {Object} styles to resolve
     * @return {[Object]}        styles resolved
     */
    _resolveStyles:function(styles) {
        if (!styles) {
            return null;
        }
        var dStyles = {}, startStyles = {}, endStyles = {};
        for (var p in styles) {
            if (styles.hasOwnProperty(p)) {
                var values = styles[p];
                var clazz;
                if (!Z.Util.isArray(values)) {
                    clazz = values.constructor;
                    if (clazz === Object) {
                        //an object with literal notations, resolve it as a child style.
                        var childStyles = Z.Animation._resolveStyles(values);
                        startStyles[p] = childStyles[0];
                        dStyles[p] = childStyles[1];
                        endStyles[p] = childStyles[2];
                        continue;
                    } else if (Z.Util.isNumber(values)) {
                        values = [0, values];
                    } else {
                        values = [new clazz(0,0), values];
                    }
                } else {
                    clazz = Z.Util.isArray(values[0])?Z.Coordinate:values[0].constructor;
                }
                //[v1,v2], v1 is the start and v2 is the end.
                var v1 = values[0],
                    v2 = values[1];
                if (Z.Util.isNumber(v1)) {
                    if (v1 === v2) {
                        continue;
                    }
                    startStyles[p] = v1;
                    endStyles[p] = v2;
                    dStyles[p] = v2 - v1;
                } else {
                    if (Z.Util.isArray(v1)) {
                        v1 = new Z.Coordinate(v1);
                    }
                    v2 = new clazz(v2);
                    if (v1.equals(v2)) {
                        continue;
                    }
                    startStyles[p] = v1;
                    endStyles[p] = v2;
                    dStyles[p] = v2._substract(v1);
                }
            }
        }
        return [startStyles, dStyles, endStyles];
    },

    framing:function(styles, options) {
        var easing = options['easing']?Z.animation.Easing[options['easing']]:Z.animation.Easing.linear;
        if (!easing) {easing = Z.animation.Easing.linear;}
        var dStyles, startStyles, endStyles;
        styles = Z.Animation._resolveStyles(styles);
        if (styles) {
            startStyles = styles[0];
            dStyles = styles[1];
            endStyles = styles[2];
        }
        var deltaStyles = function(delta, _startStyles, _dStyles) {
            if (!_startStyles || !_dStyles) {
                return null;
            }
            var d = {};
            for (var p in _dStyles) {
                if (_dStyles.hasOwnProperty(p)) {
                    var v = _dStyles[p];
                    if (Z.Util.isNumber(v)) {
                        d[p] = _startStyles[p] + delta*_dStyles[p];
                    } else {
                        var clazz = v.constructor;
                        if (clazz === Object) {
                            d[p] = deltaStyles(delta, _startStyles[p], _dStyles[p]);
                        } else {
                            d[p] = _startStyles[p].add(_dStyles[p].multi(delta));
                        }
                    }
                }
            }
            return d;
        }
        return function(elapsed, duration) {
            var state, d;
            if (elapsed < 0) {
              state = {
                'playState' : "idle",
                'delta'   : 0
              };
              d = startStyles;
            } else if (elapsed <  duration) {
              var delta = easing(elapsed / duration);
              state = {
                'playState' : "running",
                'delta' : delta
              };
              d = deltaStyles(delta, startStyles, dStyles);
            } else {
              state = {
                'playState' : "finished",
                'delta' : 1
              };
              d = endStyles;
            }
            state['startStyles'] = startStyles;
            state['endStyles'] = endStyles;
            return new Z.animation.Frame(state ,d);
        };

    },

    _requestAnimFrame:function(fn) {
        if (!this._frameQueue) {
            this._frameQueue = [];
        }
        this._frameQueue.push(fn);
        this._a();
    },

    _a:function() {
        if (!this._animationFrameId) {
            this._animationFrameId = Z.Util.requestAnimFrame(Z.Util.bind(Z.Animation._run, Z.Animation));
        }
    },

    _run:function() {
        if (this._frameQueue.length) {
            var running = [].concat(this._frameQueue);
            this._frameQueue = [];
            for (var i = 0; i < running.length; i++) {
                running[i]();
            }
            if (this._frameQueue.length) {
                this._animationFrameId = Z.Util.requestAnimFrame(Z.Util.bind(Z.Animation._run, Z.Animation));
            } else {
                delete this._animationFrameId;
            }
        }
    },

    animate : function(styles, options, step) {
        if (!options) {
            options = {};
        }
        var animation = Z.Animation.framing(styles, options);
        return new Z.animation.Player(animation, options, step);
    }
};

/**
 * Web Animation API style,
 * https://developer.mozilla.org/zh-CN/docs/Web/API/Animation
 * @param {[type]} animation [description]
 * @param {[type]} options   [description]
 * @param {[type]} step      [description]
 */
Z.animation.Player = function(animation, options, step) {
    this._animation = animation;
    this._options = options;
    this._stepFn = step;
    this.playState = "idle";
    this.ready = true;
    this.finished = false;
}

Z.Util.extend(Z.animation.Player.prototype, {
    _prepare:function() {
        var options = this._options;
        var duration = options['speed'];
        if (Z.Util.isString(duration)) {duration = Z.Animation.speed[duration];}
        if (!duration) {duration = Z.Animation.speed['normal'];}
        this.duration = duration;
    },
    cancel:function() {
        this.playState = "idle";
        this.finished = false;
    },

    finish:function() {
        this.playState = "finished";
        this.finished = true;
    },
    pause:function() {
        this.playState = "paused";
        this.duration = this.duration - this.currentTime;
    },
    play:function() {
        if (this.playState !== "idle" && this.playState !== "paused") {
            return;
        }
        if (this.playState === 'idle') {
            this.currentTime = 0;
            this._prepare();
        }
        var now = Z.Util.now();
        if (!this.startTime) {
            var options = this._options;
            this.startTime = options['startTime'] ? options['startTime'] : now;
        }
        this._playStartTime = Math.max(now, this.startTime);
        this._run();
    },
    reverse:function() {

    },
    _run:function() {
        if ('finished' === this.playState || 'paused' === this.playState) {
            return;
        }
        var me = this;
        var now = Z.Util.now();
        //elapsed, duration
        var frame = this._animation(now - this._playStartTime, this.duration);
        this.playState = frame.state['playState'];
        var step = this._stepFn;
        if ('idle' === this.playState) {
            setTimeout(Z.Util.bind(this._run, this),this.startTime-now);
        } else if ('running' === this.playState) {
            this._animeFrameId = Z.Animation._requestAnimFrame(function() {
                me.currentTime = now-me._playStartTime;
                if (step) {
                    step(frame);
                }
                me._run();
            });
        } else if ('finished' === this.playState){
            this.finished = true;
            //finished
            if (step) {
                setTimeout(function() {
                    step(frame);
                },1);
            }
        }

    }
});

Z.animation.Easing = {
        /**
         * Start slow and speed up.
         * @param {number} t Input between 0 and 1.
         * @return {number} Output between 0 and 1.
         * @api
         */
        in : function(t) {
          return Math.pow(t, 3);
        },


        /**
         * Start fast and slow down.
         * @param {number} t Input between 0 and 1.
         * @return {number} Output between 0 and 1.
         * @api
         */
        out : function(t) {
          return 1 - Z.animation.Easing.in(1 - t);
        },


        /**
         * Start slow, speed up, and then slow down again.
         * @param {number} t Input between 0 and 1.
         * @return {number} Output between 0 and 1.
         * @api
         */
        inAndOut : function(t) {
          return 3 * t * t - 2 * t * t * t;
        },


        /**
         * Maintain a constant speed over time.
         * @param {number} t Input between 0 and 1.
         * @return {number} Output between 0 and 1.
         * @api
         */
        linear : function(t) {
          return t;
        },


        /**
         * Start slow, speed up, and at the very end slow down again.  This has the
         * same general behavior as {@link inAndOut}, but the final slowdown
         * is delayed.
         * @param {number} t Input between 0 and 1.
         * @return {number} Output between 0 and 1.
         * @api
         */
        upAndDown : function(t) {
          if (t < 0.5) {
            return Z.animation.Easing.inAndOut(2 * t);
          } else {
            return 1 - Z.animation.Easing.inAndOut(2 * (t - 0.5));
          }
        }
};

/**
 * Animation Frame
 * @param {Object} state animation state
 * @param {Object} styles  styles to animate
 */
Z.animation.Frame = function(state, styles) {
    this.state = state;
    this.styles = styles;
};
