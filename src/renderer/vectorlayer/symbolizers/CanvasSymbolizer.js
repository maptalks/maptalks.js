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
    _prepareContext:function(ctx) {
        var symbol = this.symbol;
        // ctx.restore();
        Z.Canvas.setDefaultCanvasSetting(ctx);
        var layer = this.geometry.getLayer(),
            layerOpacity = layer.options['opacity'];
        //for VectorPathMarkerSymbolizer, opacity is already added into SVG element.
        if (!(this instanceof Z.symbolizer.VectorPathMarkerSymbolizer)) {
            if (Z.Util.isNumber(symbol['opacity'])) {
                ctx.globalAlpha = symbol['opacity']*layerOpacity;
            } else {
                ctx.globalAlpha = layerOpacity;
            }
        }
        var shadowBlur = this.geometry.options['shadowBlur'];
        if (Z.Util.isNumber(shadowBlur) && shadowBlur > 0) {
            ctx.shadowBlur = shadowBlur;
            ctx.shadowColor = this.geometry.options['shadowColor'];
        }
    },

    refresh:function() {
    },

    //所有point symbolizer的共同的remove方法
    remove:function() {
    },

    setZIndex:function(zIndex) {
    },

    show:function(){
    },

    hide:function(){
    },
});
