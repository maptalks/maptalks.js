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
        this._restoreCanvas(ctx);
        var layer = this.geometry.getLayer();
        //for VectorPathMarkerSymbolizer, opacity is already added into SVG element.
        if (!(this instanceof Z.symbolizer.VectorPathMarkerSymbolizer)) {
            if (Z.Util.isNumber(symbol['opacity'])) {
                ctx.globalAlpha = symbol['opacity'];
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

    _restoreCanvas:function(ctx) {
        if (ctx.lineWidth !== 1) {
            ctx.lineWidth = 1;
        }
        if (ctx.strokeStyle !== 'rgba(0,0,0,1)') {
            ctx.strokeStyle = 'rgba(0,0,0,1)';//'rgba(71,76,248,1)';//this.getRgba('#474cf8',1);
        }
        if (ctx.fillStyle !== 'rgba(255,255,255,0)') {
            ctx.fillStyle = 'rgba(255,255,255,0)';//this.getRgba('#ffffff',0);
        }
        if (ctx.font !== '11 px monospace') {
            ctx.font='11 px monospace';
        }
        ctx.shadowBlur = null;
        ctx.shadowColor = null;
        ctx.globalAlpha = 1;
    }
});
