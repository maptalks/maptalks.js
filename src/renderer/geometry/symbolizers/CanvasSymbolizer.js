import { isNumber } from 'core/util';
import { loadFunctionTypes } from 'utils';
import Symbolizer from './Symbolizer';

/**
 * @classdesc
 * Base symbolizer class for all the symbolizers base on HTML5 Canvas2D
 * @abstract
 * @class
 * @protected
 * @memberOf symbolizer
 * @name CanvasSymbolizer
 * @extends {Symbolizer}
 */
export default class CanvasSymbolizer extends Symbolizer {
    _prepareContext(ctx) {
        if (isNumber(this.symbol['opacity'])) {
            if (ctx.globalAlpha !== this.symbol['opacity']) {
                ctx.globalAlpha = this.symbol['opacity'];
            }
        } else if (ctx.globalAlpha !== 1) {
            ctx.globalAlpha = 1;
        }
    }

    //所有point symbolizer的共同的remove方法
    remove() {}

    setZIndex() {}

    show() {}

    hide() {}

    _defineStyle(style) {
        var me = this;
        var argFn = function () {
            return [me.getMap().getZoom(), me.geometry.getProperties()];
        };

        var loaded = loadFunctionTypes(style, argFn);
        if (loaded) {
            this._isFunctionStyle = true;
        } else {
            loaded = style;
        }
        return loaded;
    }
}
