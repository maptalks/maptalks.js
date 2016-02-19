Z.symbolizer.VectorPathMarkerSymbolizer = Z.symbolizer.ImageMarkerSymbolizer.extend({

    initialize:function(symbol, geometry) {
        this.symbol = symbol;
        this.geometry = geometry;
        this.style = this.translate();
    },

    _getImage:function(resources) {
        var symbol = this.symbol;
        if (!symbol['markerPath']) {
            return null;
        }
        if (this._markerPathImage) {
            return this._markerPathImage;
        }
        var styles =  Z.symbolizer.VectorMarkerSymbolizer.translateStrokeAndFill(symbol);
        var pathWidth  = symbol['markerPathWidth'],
            pathHeight = symbol['markerPathHeight'];
        var svgStyles = [];
        if (styles) {
            for (var p in styles['stroke']) {
                if (styles['stroke'].hasOwnProperty(p)) {
                    if (!Z.Util.isNil(styles['stroke'][p])) {
                        svgStyles.push(p+'="'+styles['stroke'][p]+'"');
                    }
                }
            }
            for (var p in styles['fill']) {
                if (styles['fill'].hasOwnProperty(p)) {
                    if (!Z.Util.isNil(styles['fill'][p])) {
                        svgStyles.push(p+'="'+styles['fill'][p]+'"');
                    }
                }
            }
        }
        svgStyles = (svgStyles.length>0?svgStyles.join(' '):'');
        var svg = '<svg version="1.1" ';
        if (pathWidth && pathHeight) {
            svg += 'height="'+pathWidth+'" width="'+pathHeight+'"';
        }
        svg += ' xmlns="http://www.w3.org/2000/svg"><defs></defs>';
        var pathes = Z.Util.isArray(symbol['markerPath'])?symbol['markerPath']:[symbol['markerPath']];
        for (var i = 0; i < pathes.length; i++) {
            svg += '<path d="'
                +pathes[i]+'"'+' '+svgStyles+'></path>'
        }
        svg += '</svg>';
        var b64 = 'data:image/svg+xml;base64,'+Z.Util.btoa(svg);
        var img = new Image();
        img.src=b64;
        return img;
    }
});


Z.symbolizer.VectorPathMarkerSymbolizer.test=function(geometry, symbol) {
    if (!geometry || !symbol) {
        return false;
    }
    if (Z.Util.isNil(symbol['markerFile']) && 'path' === symbol['markerType']) {
        return true;
    }
    return false;
};
