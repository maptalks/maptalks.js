import { isNil } from '../../../core/util';
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
        super(symbol, geometry, painter);
        this.style = this._defineStyle(this.translate());
        //IE must have a valid width and height to draw a svg image
        //otherwise, error will be thrown
        if (isNil(this.style['markerWidth'])) {
            this.style['markerWidth'] = 80;
        }
        if (isNil(this.style['markerHeight'])) {
            this.style['markerHeight'] = 80;
        }
        if (Browser.gecko) {
            // Firefox requires valid width and height attributes in SVG's root element.
            this._url = [getMarkerPathBase64(symbol, this.style['markerWidth'], this.style['markerHeight']), this.style['markerWidth'], this.style['markerHeight']];
        } else {
            this._url = [getMarkerPathBase64(symbol), symbol['markerWidth'], symbol['markerHeight']];
        }
    }

    _prepareContext() {
        //for VectorPathMarkerSymbolizer, opacity is already added into SVG element.
    }

    _getImage(resources) {
        if (resources && resources.isResourceLoaded(this._url)) {
            return resources.getImage(this._url);
        }
        const image = new Image();
        image.src = this._url[0];
        if (resources) {
            resources.addResource(this._url, image);
        }
        return image;
        // return resources ? resources.getImage(this._url) : null;
    }
}
