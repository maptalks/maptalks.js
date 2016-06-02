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
        //for VectorPathMarkerSymbolizer, opacity is already added into SVG element.
        if (!(this instanceof Z.symbolizer.VectorPathMarkerSymbolizer)) {
            var symbol = this.symbol;
            if (Z.Util.isNumber(symbol['opacity'])) {
                if (ctx.globalAlpha !== symbol['opacity']) {
                    ctx.globalAlpha = symbol['opacity'];
                }
            } else if (ctx.globalAlpha !== 1) {
                ctx.globalAlpha = 1;
            }
        }
        var shadowBlur = this.geometry.options['shadowBlur'];
        if (Z.Util.isNumber(shadowBlur) && shadowBlur > 0) {
            ctx.shadowBlur = shadowBlur;
            ctx.shadowColor = this.geometry.options['shadowColor'];
        } else {
            ctx.shadowBlur = null;
            ctx.shadowColor = null;
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
        if (style) {
            var props = [], p;
            for (p in style) {
                if (style.hasOwnProperty(p)) {
                    props.push(p);
                }
            }
            for (var i = 0, len = props.length; i < len; i++) {
                p = props[i];
                if (Z.Util.isFunctionDefinition(style[p])) {
                    style['_' + p] = style[p];
                    (function (_p) {
                        Object.defineProperty(style, _p, {
                            get: function () {
                                if (!this['__fn_' + _p]) {
                                    this['__fn_' + _p] = Z.Util.interpolated(this['_' + _p]);
                                }
                                return this['__fn_' + _p](me.getMap().getZoom(), me.geometry.getProperties());
                            },
                            set: function (v) {
                                this['_' + _p] = v;
                            }
                        });
                    })(p);
                }
            }
        }
    }
});
