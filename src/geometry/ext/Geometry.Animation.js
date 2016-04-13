Z.Geometry.include(/** @lends maptalks.Geometry.prototype */{
    /**
     * Animate the geometry according to the given options.
     * @param  {Object}   styles   - styles to animate
     * @param  {Object}   options  - animation options
     * @param  {Function} callback - step function when animating
     * @return {maptalks.animation.Player} animation player
     */
    animate:function(styles, options, callback) {
        if (Z.Util.isFunction(options)) {
            callback = options;
            options = null;
        }
        var map = this.getMap(),
            projection = this._getProjection(),
            symbol = this.getSymbol(),
            stylesToAnimate = this._prepareAnimationStyles(styles),
            preTranslate, isFocusing;

        if (options) {isFocusing = options['focus'];}
        delete this._animationStarted;

        var player = Z.Animation.animate(stylesToAnimate, options, Z.Util.bind(function(frame) {
            if (!this._animationStarted && isFocusing) {
                map._onMoveStart();
            }
            var styles = frame.styles;
            for (var p in styles) {
                if (p !== 'symbol' && p !== 'translate' && styles.hasOwnProperty(p)) {
                    var v = styles[p];
                    var fnName = 'set'+p[0].toUpperCase() + p.substring(1);
                    this[fnName](v);
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
                // this.setSymbol(Z.Util.extend({},symbol,dSymbol));
            }
            if (isFocusing) {
                var center = this.getCenter();
                var p = projection.project(center);
                map._setPrjCenterAndMove(p);
                if ('running' !== player.playState) {
                    map._onMoveEnd();
                } else {
                    map._onMoving();
                }
            }
            this._fireAnimateEvent(player.playState);
            if (callback) {
                callback(frame);
            }
        },this));

        return player.play();
    },
    /**
     * prepare styles for animation
     * @return {Object} symbol to animate
     * @private
     */
    _prepareAnimationStyles:function(styles) {
        var symbol = this.getSymbol();
        var stylesToAnimate = {};
        for (var p in styles) {
            if (styles.hasOwnProperty(p)) {
                var v = styles[p];
                if (p !== 'translate' && p !== 'symbol') {
                    //this.getRadius() / this.getWidth(), etc.
                    var fnName = 'get'+p[0].toUpperCase() + p.substring(1);
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
                            for (var sp in symbolInStyles[i]) {
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
                        for (var sp in v) {
                            if (v.hasOwnProperty(sp)) {
                                symbolToAnimate[sp] = [symbol[sp], v[sp]];
                            }
                        }
                    }
                    stylesToAnimate['symbol'] = symbolToAnimate;
                } else if (p === 'translate'){
                    stylesToAnimate['translate'] = new Z.Coordinate(v);
                }
            }
        }
        return stylesToAnimate;
    },

    _fireAnimateEvent:function(playState) {
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
