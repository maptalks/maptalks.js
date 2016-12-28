import { isNil } from 'core/util';
import { Geometry } from 'geometry/Geometry';
import { ImageMarkerSymbolizer } from './ImageMarkerSymbolizer';

export class VectorPathMarkerSymbolizer extends ImageMarkerSymbolizer {

    constructor(symbol, geometry, painter) {
        super();
        this.symbol = symbol;
        this.geometry = geometry;
        this.painter = painter;
        this._url = [Geometry.getMarkerPathBase64(symbol), symbol['markerWidth'], symbol['markerHeight']];
        this.style = this._defineStyle(this.translate());
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

VectorPathMarkerSymbolizer.test = function (symbol) {
    if (!symbol) {
        return false;
    }
    if (isNil(symbol['markerFile']) && symbol['markerType'] === 'path') {
        return true;
    }
    return false;
};
