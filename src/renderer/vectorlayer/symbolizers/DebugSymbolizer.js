Z.symbolizer.DebugSymbolizer = Z.symbolizer.PointSymbolizer.extend({

    styles:{
        'lineColor':'#000',
        'lineOpacity' : 1,
        'lineWidth' : 1
    },

    initialize:function (symbol, geometry) {
        this.symbol = symbol;
        this.geometry = geometry;
    },

    getPlacement:function () {
        return 'center';
    },

    getDxDy:function () {
        return new Z.Point(0, 0);
    },

    symbolize:function (ctx) {
        var geometry = this.geometry,
            layer = geometry.getLayer();
        if (!geometry.options['debug'] && !layer.options['debug']) {
            return;
        }
        var map = this.getMap();
        if (map._zooming) {
            return;
        }
        Z.Canvas.prepareCanvas(ctx, this.styles);
        var op = this.styles['lineOpacity'];

        //outline
        var pixelExtent = geometry._getPainter().getViewExtent(),
            size = pixelExtent.getSize();
        var nw = map.viewPointToContainerPoint(pixelExtent.getMin());
        Z.Canvas.rectangle(ctx, nw, size, op, 0);

        //center cross and id if have any.
        var points = this._getRenderContainerPoints();

        var id = this.geometry.getId();
        var cross = Z.symbolizer.VectorMarkerSymbolizer._getVectorPoints('cross', 10, 10);
        for (var i = 0; i < points.length; i++) {
            var p = points[i];
            if (!Z.Util.isNil(id)) {
                Z.Canvas.fillText(ctx, id, p.add(8, -4), 'rgba(0,0,0,1)');
            }
            var c = [];
            for (var ii = 0; ii < cross.length; ii++) {
                c.push(cross[ii].add(p));
            }
            Z.Canvas.path(ctx, c.slice(0, 2), op);
            Z.Canvas.path(ctx, c.slice(2, 4), op);
        }
    }

});
