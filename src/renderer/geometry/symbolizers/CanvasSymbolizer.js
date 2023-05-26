import { isArrayHasData, isNumber } from '../../../core/util';
import { loadGeoSymbol, isFunctionDefinition, interpolated } from '../../../core/mapbox';
import Symbolizer from './Symbolizer';
import Canvas from '../../../core/Canvas';

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
        if (isFunctionDefinition(this.symbol['opacity'])) {
            if (!this._opacityFn) {
                this._opacityFn = interpolated(this.symbol['opacity']);
            }
        } else {
            delete this._opacityFn;
        }
        if (isNumber(this.symbol['opacity'])) {
            if (ctx.globalAlpha !== this.symbol['opacity']) {
                ctx.globalAlpha = this.symbol['opacity'];
            }
        } else if (this._opacityFn) {
            const map = this.getMap();
            ctx.globalAlpha = this._opacityFn(map.getZoom());
        } else if (ctx.globalAlpha !== 1) {
            ctx.globalAlpha = 1;
        }
    }

    prepareCanvas(ctx, style, resources) {
        if (ctx.setLineDash && isArrayHasData(style['lineDasharray'])) {
            ctx.setLineDash(style['lineDasharray']);
        }
        const isHitTesting = this.getPainter().isHitTesting();
        Canvas.prepareCanvas(ctx, style, resources, isHitTesting);
    }

    remove() { }

    setZIndex() { }

    show() { }

    hide() { }

    _defineStyle(style) {
        return loadGeoSymbol(style, this.geometry);
    }
}

export default CanvasSymbolizer;
