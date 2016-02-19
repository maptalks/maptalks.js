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
        var svgStyles = {};
        if (styles) {
            for (var p in styles['stroke']) {
                if (styles['stroke'].hasOwnProperty(p)) {
                    if (!Z.Util.isNil(styles['stroke'][p])) {
                        svgStyles[p] = styles['stroke'][p];
                    }
                }
            }
            for (var p in styles['fill']) {
                if (styles['fill'].hasOwnProperty(p)) {
                    if (!Z.Util.isNil(styles['fill'][p])) {
                        svgStyles[p] = styles['fill'][p];
                    }
                }
            }
        }

        var pathes = Z.Util.isArray(symbol['markerPath'])?symbol['markerPath']:[symbol['markerPath']];
        var pathesToRender = [];
        for (var i = 0; i < pathes.length; i++) {
            var pathObj;
            if (Z.Util.isString(pathes[i])) {
                pathObj = {'path' : pathes[i]};
            } else {
                pathObj = pathes[i];
            }
            var p = Z.Util.extend({},pathObj, svgStyles);
            p['d'] = p['path'];
            delete p['path'];
            pathesToRender.push(p);
        }
        var svgContent = ['<svg version="1.1"'];
        if (pathWidth && pathHeight) {
            svgContent.push('height="'+pathWidth+'" width="'+pathHeight+'"');
        }
         svgContent.push('xmlns="http://www.w3.org/2000/svg"><defs></defs>');

        for (var i = 0; i < pathesToRender.length; i++) {
            var strPath = '<path ';
            for (var p in pathesToRender[i]) {
                if (pathesToRender[i].hasOwnProperty(p)) {
                    strPath += ' '+p+'="'+pathesToRender[i][p]+'"';
                }
            }
            strPath +='></path>';
            svgContent.push(strPath);
        }
        svgContent.push('</svg>');
        var b64 = 'data:image/svg+xml;base64,'+Z.Util.btoa(svgContent.join(' '));
        var img = new Image();
        img.src=b64;
        this._markerPathImage = img;
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
