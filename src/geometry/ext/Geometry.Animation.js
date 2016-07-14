Z.Geometry.include(/** @lends maptalks.Geometry.prototype */{
    /**
     * Animate the geometry
     *
     * @param  {Object}   styles          - styles to animate
     * @param  {Object}   [options=null]  - animation options
     * @param  {Object}   [options.speed=1000]      - duration
     * @param  {Object}   [options.startTime=null]  - time to start animation in ms
     * @param  {Object}   [options.easing=linear]   - animation easing: in, out, inAndOut, linear, upAndDown
     * @param  {Function} [step=null]               - step function when animating
     * @return {maptalks.animation.Player} animation player
     * @example
     * var player = marker.animate({
     *     'symbol': {
     *         'markerHeight': 82
     *      }
     * }, {
     *     'speed': 2000
     * });
     * player.pause();
     */
    animate:function (styles, options, step) {
        if (Z.Util.isFunction(options)) {
            step = options;
            options = null;
        }
        var map = this.getMap(),
            projection = this._getProjection(),
            symbol = this._getInternalSymbol(),
            stylesToAnimate = this._prepareAnimationStyles(styles),
            preTranslate, isFocusing;

        if (options) { isFocusing = options['focus']; }
        delete this._animationStarted;

        var player = Z.Animation.animate(stylesToAnimate, options, Z.Util.bind(function (frame) {
            if (!this._animationStarted && isFocusing) {
                map._onMoveStart();
            }
            var styles = frame.styles;
            for (var p in styles) {
                if (p !== 'symbol' && p !== 'translate' && styles.hasOwnProperty(p)) {
                    var fnName = 'set' + p[0].toUpperCase() + p.substring(1);
                    this[fnName](styles[p]);
                }
            }
            var translate = styles['translate'];
            if (translate) {
                var toTranslate = translate;
                if (preTranslate) {
                    toTranslate = translate.substract(preTranslate);
                }
                preTranslate = translate;
                this.translate(toTranslate);
            }
            var dSymbol = styles['symbol'];
            if (dSymbol) {
                this.setSymbol(Z.Util.extendSymbol(symbol, dSymbol));
            }
            if (isFocusing) {
                var pcenter = projection.project(this.getCenter());
                map._setPrjCenterAndMove(pcenter);
                if (player.playState !== 'running') {
                    map._onMoveEnd();
                } else {
                    map._onMoving();
                }
            }
            this._fireAnimateEvent(player.playState);
            if (step) {
                step(frame);
            }
        }, this));

        return player.play();
    },
    /**
     * Prepare styles for animation
     * @return {Object} styles
     * @private
     */
    _prepareAnimationStyles:function (styles) {
        var symbol = this._getInternalSymbol();
        var stylesToAnimate = {};
        for (var p in styles) {
            if (styles.hasOwnProperty(p)) {
                var v = styles[p],
                    sp;
                if (p !== 'translate' && p !== 'symbol') {
                    //this.getRadius() / this.getWidth(), etc.
                    var fnName = 'get' + p[0].toUpperCase() + p.substring(1);
                    var current = this[fnName]();
                    stylesToAnimate[p] = [current, v];
                } else if (p === 'symbol') {
                    var symbolToAnimate;
                    if (Z.Util.isArray(styles['symbol'])) {
                        if (!Z.Util.isArray(symbol)) {
                            throw new Error('geometry\'symbol isn\'t a composite symbol, while the symbol in styles is.');
                        }
                        symbolToAnimate = [];
                        var symbolInStyles = styles['symbol'];
                        for (var i = 0; i < symbolInStyles.length; i++) {
                            if (!symbolInStyles[i]) {
                                symbolToAnimate.push(null);
                                continue;
                            }
                            var a = {};
                            for (sp in symbolInStyles[i]) {
                                if (symbolInStyles[i].hasOwnProperty(sp)) {
                                    a[sp] = [symbol[i][sp], symbolInStyles[i][sp]];
                                }
                            }
                            symbolToAnimate.push(a);
                        }
                    } else {
                        if (Z.Util.isArray(symbol)) {
                            throw new Error('geometry\'symbol is a composite symbol, while the symbol in styles isn\'t.');
                        }
                        symbolToAnimate = {};
                        for (sp in v) {
                            if (v.hasOwnProperty(sp)) {
                                symbolToAnimate[sp] = [symbol[sp], v[sp]];
                            }
                        }
                    }
                    stylesToAnimate['symbol'] = symbolToAnimate;
                } else if (p === 'translate') {
                    stylesToAnimate['translate'] = new Z.Coordinate(v);
                }
            }
        }
        return stylesToAnimate;
    },

    _fireAnimateEvent:function (playState) {
        if (playState === 'finished') {
            delete this._animationStarted;
            this._fireEvent('animateend');
        } else if (playState === 'running') {
            if (this._animationStarted) {
                this._fireEvent('animating');
            } else {
                this._fireEvent('animatestart');
                this._animationStarted = true;
            }

        }
    }
});
