Z.Geometry.include({
    animate:function(styles, options, callback) {
        if (Z.Util.isFunction(options)) {
            callback = options;
            options = null;
        }
        var map = this.getMap(),
            projection = this._getProjection();
        var isFocusing;
        if (options) {isFocusing = options['focus'];}
        var stylesToAnimate = {};
        var symbol = this.getSymbol();
        //prepare styles for animation
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
        var started = false;
        var preTranslate = null;
        var player = Z.Animation.animate(stylesToAnimate, options, Z.Util.bind(function(frame) {
            if (!started && isFocusing) {
                map._onMoveStart();
                started = true;
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
                    map._onMoving()
                }
            }
            if (callback) {
                callback(frame);
            }
        },this));
        player.play();
        return player;
    }
});
