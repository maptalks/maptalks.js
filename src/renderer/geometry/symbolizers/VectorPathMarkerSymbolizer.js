import { isNil, extend } from '../../../core/util';
import Browser from '../../../core/Browser';
import { getMarkerPathBase64 } from '../../../core/util/resource';
import ImageMarkerSymbolizer from './ImageMarkerSymbolizer';

export default class VectorPathMarkerSymbolizer extends ImageMarkerSymbolizer {

    static test(symbol) {
        if (!symbol) {
            return false;
        }
        if (isNil(symbol['markerFile']) && symbol['markerType'] === 'path') {
            return true;
        }
        return false;
    }

    constructor(symbol, geometry, painter) {
        //IE must have a valid width and height to draw a svg image
        //otherwise, error will be thrown
        if (isNil(symbol['markerWidth'])) {
            symbol['markerWidth'] = 80;
        }
        if (isNil(symbol['markerHeight'])) {
            symbol['markerHeight'] = 80;
        }
        super(symbol, geometry, painter);
        symbol = extend(symbol, this.translate());
        const style = this.style = this._defineStyle(symbol);
        if (Browser.gecko) {
            // Firefox requires valid width and height attributes in SVG's root element.
            this._url = [getMarkerPathBase64(style, style['markerWidth'], style['markerHeight']), style['markerWidth'], style['markerHeight']];
        } else {
            this._url = [getMarkerPathBase64(style), style['markerWidth'], style['markerHeight']];
        }
    }

    _prepareContext() {
        //for VectorPathMarkerSymbolizer, opacity is already added into SVG element.
    }

    _getImage(resources) {
        if (resources && resources.isResourceLoaded(this._url)) {
            return resources.getImage(this._url);
        }
        const painter = this.painter;
        const image = new Image();
        image.onload = () => {
            const renderer = painter.getLayer() && painter.getLayer().getRenderer();
            if (renderer) {
                renderer.setToRedraw();
            }
        };
        image.onerror = err => {
            if (err && typeof console !== 'undefined') {
                console.warn(err);
            }
            resources.markErrorResource(this._url);
        };
        image.src = this._url[0];
        if (resources) {
            resources.addResource(this._url, image);
        }
        return image;
        // return resources ? resources.getImage(this._url) : null;
    }
}
