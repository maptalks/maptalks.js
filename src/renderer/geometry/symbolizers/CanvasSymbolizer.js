import { isArrayHasData, isNumber } from '../../../core/util';
import { loadGeoSymbol, isFunctionDefinition, interpolated } from '../../../core/mapbox';
import Symbolizer from './Symbolizer';
import Canvas from '../../../core/Canvas';

let tempSymbolHash = null, tempLayer = null, tempCtx = null;
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
        const { geometry } = this;
        const isHitTesting = this.getPainter().isHitTesting();
        // 确保symbolizers只有一个，如果是混合的（strokeAndFill and Text等）会导致绘制错乱,，
        // 比如 PolygonFill和TextFill不同，就会导致问题出现，文字的绘制颜色会使用PolygonFill
        // 只有一个比如 StrokeAndFillSymbolizer ，TextMarkerSymbolizer，VectorMarkerSymbolizer
        const symbolHash = geometry.getSymbolHash();
        if (symbolHash && geometry._painter && geometry._painter.symbolizers.length === 1) {
            if (tempCtx === ctx && this._layerWidth === ctx.canvas.width && this._layerHeight === ctx.canvas.height &&
                symbolHash === tempSymbolHash && geometry._layer === tempLayer) {
                return;
            }
        }
        tempLayer = geometry._layer;
        tempSymbolHash = symbolHash;
        tempCtx = ctx;
        this._layerWidth = ctx.canvas.width;
        this._layerHeight = ctx.canvas.height;
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
