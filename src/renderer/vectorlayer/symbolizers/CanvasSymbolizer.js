/**
 * @classdesc
 * Base symbolizer class for all the symbolizers base on HTML5 Canvas2D
 * @abstract
 * @class
 * @protected
 * @memberOf maptalks.symbolizer
 * @name CanvasSymbolizer
 * @extends {maptalks.Symbolizer}
 */
maptalks.symbolizer.CanvasSymbolizer = maptalks.Symbolizer.extend(/** @lends maptalks.symbolizer.CanvasSymbolizer.prototype */{
    _prepareContext:function (ctx) {
        if (maptalks.Util.isNumber(this.symbol['opacity'])) {
            if (ctx.globalAlpha !== this.symbol['opacity']) {
                ctx.globalAlpha = this.symbol['opacity'];
            }
        } else if (ctx.globalAlpha !== 1) {
            ctx.globalAlpha = 1;
        }
    },

    //所有point symbolizer的共同的remove方法
    remove:function () {
    },

    setZIndex:function () {
    },

    show:function () {
    },

    hide:function () {
    },

    _defineStyle: function (style) {
        var me = this;
        var argFn = function () {
            return [me.getMap().getZoom(), me.geometry.getProperties()];
        };

        var loaded = maptalks.Util.loadFunctionTypes(style, argFn);
        if (loaded) {
            this._isFunctionStyle = true;
        } else {
            loaded = style;
        }
        return loaded;
    }
});
