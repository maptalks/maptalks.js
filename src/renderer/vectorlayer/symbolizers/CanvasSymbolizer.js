Z.symbolizer.CanvasSymbolizer = Z.Symbolizer.extend({
    _prepareContext:function(ctx) {
        var symbol = this.symbol;
        // ctx.restore();
        Z.Canvas.setDefaultCanvasSetting(ctx);
        var layer = this.geometry.getLayer(),
            layerOpacity = layer.options['opacity'];
        if (Z.Util.isNumber(symbol['opacity'])) {
            ctx.globalAlpha = symbol['opacity']*layerOpacity;
        } else {
            ctx.globalAlpha = layerOpacity;
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
