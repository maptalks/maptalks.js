Z.symbolizer.ImageMarkerSymbolizer = Z.symbolizer.PointSymbolizer.extend({

    initialize:function(symbol, geometry) {
        this.symbol = symbol;
        this.geometry = geometry;
        this.style = this.translate();
    },


    symbolize:function(ctx, resources) {
        var cookedPoints = this._getRenderContainerPoints();
        if (!Z.Util.isArrayHasData(cookedPoints)) {
            return;
        }
        var style = this.style;
        var img = this._getImage(resources);
        if (!img) {
            // console.error('img missed');
            return;
        }
        this._prepareContext(ctx);
        var width = style['markerWidth'];
        var height = style['markerHeight'];
        if (!Z.Util.isNumber(width) || !Z.Util.isNumber(height)) {
            width = img.width;
            height = img.height;
            style['markerWidth'] = width;
            style['markerHeight'] = height;
            this.geometry._getPainter()._removeCache();
        }
        if (!(this instanceof Z.symbolizer.VectorPathMarkerSymbolizer) &&
            Z.Util.isNumber(style['markerOpacity']) && style['markerOpacity'] < 1)  {
            ctx.globalAlpha *= style['markerOpacity'];
        }
        for (var i = 0, len=cookedPoints.length;i<len;i++) {
            //图片定位到中心底部
            var pt = cookedPoints[i].add(new Z.Point(-width/2,-height/2));
            Z.Canvas.image(ctx, pt, img, width, height);
        }
    },

    _getImage:function(resources) {
        var style = this.style;
        var url = style['markerFile'];
        var img = !resources?null:resources.getImage(url);
        return img;
    },

    getPlacement:function() {
        return this.symbol['markerPlacement'];
    },

    getDxDy:function() {
        var s = this.style;
        var dx = s['markerDx'],
            dy = s['markerDy'];
        return new Z.Point(dx, dy);
    },

    getMarkerExtent:function() {
        var width = this.style['markerWidth'],
            height = this.style['markerHeight'];
        var dxdy = this.getDxDy();
        var extent = new Z.Extent(dxdy.add(new Z.Point(-width/2,height/2)),dxdy.add(new Z.Point(width/2,-height/2)));
        return extent;
    },

    translate:function() {
        var s = this.symbol;
        return {
            "markerFile" : s["markerFile"],
            "markerWidth" : Z.Util.getValueOrDefault(s["markerWidth"], null),
            "markerHeight" : Z.Util.getValueOrDefault(s["markerHeight"], null),
            "markerOpacity" : Z.Util.getValueOrDefault(s["markerOpacity"], 1),
            "markerDx" : Z.Util.getValueOrDefault(s["markerDx"], 0),
            "markerDy" : Z.Util.getValueOrDefault(s["markerDy"], 0)
        };
    }
});


Z.symbolizer.ImageMarkerSymbolizer.test=function(geometry, symbol) {
    if (!geometry || !symbol) {
        return false;
    }
    var layer = geometry.getLayer();
    if (!layer || !layer.isCanvasRender()) {
        return false;
    }
    if (!Z.Util.isNil(symbol['markerFile'])) {
        return true;
    }
    return false;
};
