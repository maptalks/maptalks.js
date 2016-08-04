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
Z.symbolizer.CanvasSymbolizer = Z.Symbolizer.extend(/** @lends maptalks.symbolizer.CanvasSymbolizer.prototype */{
    _prepareContext:function (ctx) {
        if (Z.Util.isNumber(this.symbol['opacity'])) {
            if (ctx.globalAlpha !== this.symbol['opacity']) {
                ctx.globalAlpha = this.symbol['opacity'];
            }
        } else if (ctx.globalAlpha !== 1) {
            ctx.globalAlpha = 1;
        }
    },

    refresh:function () {
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

        return Z.Util.loadFunctionTypes(style, argFn);
    }
});
