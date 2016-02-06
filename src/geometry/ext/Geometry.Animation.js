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
        var aniStyles = {};
        var symbol = this.getSymbol();
        //prepare styles for animation
        for (var p in styles) {
            if (styles.hasOwnProperty(p)) {
                var v = styles[p];
                if (p !== 'translate' && p !== 'symbol') {
                    //this.getRadius() / this.getWidth(), etc.
                    var fnName = 'get'+p[0].toUpperCase() + p.substring(1);
                    var current = this[fnName]();
                    aniStyles[p] = [current, v];
                } else if (p === 'symbol') {
                    var aniSymbol = {};
                    for (var sp in v) {
                        if (v.hasOwnProperty(sp)) {
                            aniSymbol[sp] = [symbol[sp], v[sp]];
                        }
                    }
                    aniStyles['symbol'] = aniSymbol;
                } else if (p === 'translate'){
                    aniStyles['translate'] = new Z.Coordinate(v);
                }
            }
        }
        var started = false;
        var player = Z.Animation.animate(aniStyles, options, Z.Util.bind(function(frame) {
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
                this.translate(translate);
            }
            var dSymbol = styles['symbol'];
            if (dSymbol) {
                this.setSymbol(Z.Util.extend({},symbol,dSymbol));
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
                callback();
            }
        },this));
        player.play();
        return player;
    }
});
