Z.symbolizer.DebugSymbolizer = Z.symbolizer.PointSymbolizer.extend({

    styles:{
        'stroke' : {
            'stroke':'#000',
            'stroke-opacity' : 1,
            'stroke-width' : 1
        }
    },

    initialize:function(symbol, geometry) {
        this.symbol = symbol;
        this.geometry = geometry;
    },

    getPlacement:function() {
        return 'center';
    },

    getDxDy:function() {
        return new Z.Point(0,0);
    },

    symbolize:function(ctx, resources) {
        var geometry = this.geometry,
            layer = geometry.getLayer();
        if (!geometry.options['debug'] && !layer.options['debug']) {
            return;
        }
         var map = this.getMap();
        if (map._zooming) {
            return;
        }
        Z.Canvas.prepareCanvas(ctx, this.styles['stroke']);
        var op = this.styles['stroke']['stroke-opacity'];

        //outline
        var pixelExtent = geometry._getPainter().getPixelExtent(),
        size = pixelExtent.getSize();
        var nw = map.viewPointToContainerPoint(pixelExtent.getMin());
        Z.Canvas.rectangle(ctx, nw, size, op, 0);

        //center cross and id if have any.
        var points = this._getRenderContainerPoints();

        var id = this.geometry.getId();
        var cross = Z.symbolizer.VectorMarkerSymbolizer._getVectorPoints('cross',10, 10);
        for (var i = 0; i < points.length; i++) {
            var p = points[i];
            if (!Z.Util.isNil(id)) {
                Z.Canvas.fillText(ctx, id, p.add(new Z.Point(8,-4)), 'rgba(0,0,0,1)');
            }
            var c = [];
            for (var ii = 0; ii < cross.length; ii++) {
                c.push(cross[ii].add(p));
            }
            Z.Canvas.path(ctx,c.slice(0,2), op);
            Z.Canvas.path(ctx,c.slice(2,4), op);
        }
    }

});
