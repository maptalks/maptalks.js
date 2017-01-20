import { isNil } from 'core/util';
import { getMarkerPathBase64 } from 'core/util/resource';
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
        this._url = [getMarkerPathBase64(symbol), symbol['markerWidth'], symbol['markerHeight']];
        //IE must have a valid width and height to draw a svg image
        //otherwise, error will be thrown
        if (isNil(this.style['markerWidth'])) {
            this.style['markerWidth'] = 80;
        }
        if (isNil(this.style['markerHeight'])) {
            this.style['markerHeight'] = 80;
        }
    }

    _prepareContext() {
        //for VectorPathMarkerSymbolizer, opacity is already added into SVG element.
    }

    _getImage(resources) {
        if (resources && resources.isResourceLoaded(this._url)) {
            return resources.getImage(this._url);
        }
        var image = new Image();
        image.src = this._url[0];
        if (resources) {
            resources.addResource(this._url, image);
        }
        return image;
        // return resources ? resources.getImage(this._url) : null;
    }
}
