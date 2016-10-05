Z.symbolizer.VectorPathMarkerSymbolizer = Z.symbolizer.ImageMarkerSymbolizer.extend({

    initialize:function (symbol, geometry) {
        this.symbol = symbol;
        this.geometry = geometry;
        this._url = [Z.Geometry.getMarkerPathBase64(symbol), symbol['markerWidth'], symbol['markerHeight']];
        this.style = this._defineStyle(this.translate());
        //IE must have a valid width and height to draw a svg image
        //otherwise, error will be thrown
        if (Z.Util.isNil(this.style['markerWidth'])) {
            this.style['markerWidth'] = 80;
        }
        if (Z.Util.isNil(this.style['markerHeight'])) {
            this.style['markerHeight'] = 80;
        }
        this._pathImage = new Image();
        this._pathImage.src = this._url[0];
    },

    _prepareContext: function () {
        //for VectorPathMarkerSymbolizer, opacity is already added into SVG element.
    },

    _getImage:function (resources) {
        if (resources && resources.isResourceLoaded(this._url)) {
            return resources.getImage(this._url);
        }
        if (resources) {
            resources.addResource(this._url, this._pathImage);
        }
        return this._pathImage;
    }
});


Z.symbolizer.VectorPathMarkerSymbolizer.test = function (symbol) {
    if (!symbol) {
        return false;
    }
    if (Z.Util.isNil(symbol['markerFile']) && symbol['markerType'] === 'path') {
        return true;
    }
    return false;
};
