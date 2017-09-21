import { isNumber } from 'core/util';
import { loadFunctionTypes } from 'core/mapbox';
import Symbolizer from './Symbolizer';

/**
 * @classdesc
 * Base symbolizer class for all the symbolizers base on HTML5 Canvas2D
 * @abstract
 * @class
 * @private
 * @memberOf symbolizer
 * @name CanvasSymbolizer
 * @extends {Symbolizer}
 */
class CanvasSymbolizer extends Symbolizer {
    _prepareContext(ctx) {
        if (isNumber(this.symbol['opacity'])) {
            if (ctx.globalAlpha !== this.symbol['opacity']) {
                ctx.globalAlpha = this.symbol['opacity'];
            }
        } else if (ctx.globalAlpha !== 1) {
            ctx.globalAlpha = 1;
        }
    }

    remove() {}

    setZIndex() {}

    show() {}

    hide() {}

    _defineStyle(style) {
        return loadFunctionTypes(style, () => [this.getMap().getZoom(), this.geometry.getProperties()]);
    }
}

export default CanvasSymbolizer;
