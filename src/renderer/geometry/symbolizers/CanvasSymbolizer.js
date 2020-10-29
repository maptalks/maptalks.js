import { isNumber, extend } from '../../../core/util';
import { loadFunctionTypes, isFunctionDefinition, interpolated } from '../../../core/mapbox';
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
        Canvas.prepareCanvas(ctx, style, resources, this.getPainter().isHitTesting());
    }

    remove() {}

    setZIndex() {}

    show() {}

    hide() {}

    _defineStyle(style) {
        return function () {
            const arr = [],
                prop = {};
            return loadFunctionTypes(style, () => {
                const map = this.getMap();
                return set(arr, map.getZoom(),
                    extend({},
                        this.geometry.getProperties(),
                        setProp(prop, map.getBearing(), map.getPitch(), map.getZoom())
                    )
                );
            });
        }.bind(this)();
    }
}

function set(arr, a0, a1) {
    arr[0] = a0;
    arr[1] = a1;
    return arr;
}

function setProp(prop, b, p, z) {
    prop['{bearing}'] = b;
    prop['{pitch}'] = p;
    prop['{zoom}'] = z;
    return prop;
}

export default CanvasSymbolizer;
