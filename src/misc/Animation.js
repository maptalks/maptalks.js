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
        var styles = styles,
            duration = options['speed'];
        if (Z.Util.isString(duration)) {duration = Z.Animation.speed[duration];}
        if (!duration) {duration = Z.Animation.speed['normal'];}
        var easing = options['easing']?Z.animation.Easing[options['easing']]:Z.animation.Easing.linear;
        if (!easing) {easing = Z.animation.Easing.linear;}
        var start = options['start'] ? options['start'] : Z.Util.now();
        var dStyles, startStyles, endStyles;
        styles = Z.Animation._resolveStyles(styles);
        if (styles) {
            startStyles = styles[0];
            dStyles = styles[1];
            endStyles = styles[2];
        }
        var deltaStyles = function(delta, start, dist) {
            if (!start || !dist) {
                return null;
            }
            var d = {};
            for (var p in dist) {
                if (dist.hasOwnProperty(p)) {
                    var v = dist[p];
                    if (Z.Util.isNumber(v)) {
                        d[p] = start[p] + delta*dist[p];
                    } else {
                        var clazz = v.constructor;
                        if (clazz === Object) {
                            d[p] = deltaStyles(delta, start[p], dist[p]);
                        } else {
                            d[p] = start[p].add(dist[p].multi(delta));
                        }
                    }
                }
            }
            return d;
        }
        return function(time) {
            var state, d;
            if (time < start) {
              state = {
                'playing' : 0,
                'elapsed' : 0,
                'delta'   : 0
              };
              d = startStyles;
            } else if (time < start + duration) {
              var delta = easing((time - start) / duration);
              state = {
                'playing' : 1,
                'elapsed' : time-start,
                'delta' : delta
              };
              d = deltaStyles(delta, startStyles, dStyles);
            } else {
              state = {
                'playing' : 0,
                'elapsed' : time-start,
                'delta' : 1
              };
              d = endStyles;
            }
            state['start'] = start;
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
        var player = function() {
            var now = Z.Util.now();
            var frame = animation(now);
            if (frame.state['elapsed']) {
                //animation started
                if (frame.state['playing']) {
                    var animeFrameId = Z.Animation._requestAnimFrame(function() {
                        if (step) {
                            step._animeFrameId = animeFrameId;
                            var endPlay = step(frame);
                            if (endPlay) {
                                Z.Util.cancelAnimFrame(step._animeFrameId);
                                return;
                            }
                        }

                        player();
                    });
                } else {
                    if (step) {
                        setTimeout(function() {
                            step(frame);
                        },1);
                    }
                }
            } else {
                //延迟到开始时间再开始
                setTimeout(function() {
                    player();
                },frame.state['start']-now);
            }
        }
        Z.Animation._requestAnimFrame(player);

    }
};

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
