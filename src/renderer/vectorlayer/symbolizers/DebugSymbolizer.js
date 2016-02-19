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
        var geometry = this.geometry;
        if (!geometry.options['debug']) {
            return;
        }
        /*var ext = geometry._getPainter().getPixelExtent();
        var xmin = ext['xmin'],
            ymin = ext['ymin'],
            xmax = ext['xmax'],
            ymax = ext['ymax'];
        var points =[
                new Z.Point(xmin, ymax), new Z.Point(xmax, ymax), new Z.Point(xmax, ymin),
                new Z.Point(xmin, ymin), new Z.Point(xmin, ymax)
            ];


        Z.Canvas.path(ctx, points, op);*/
        Z.Canvas.setDefaultCanvasSetting(ctx);
        var points = this._getRenderContainerPoints();
        Z.Canvas.prepareCanvas(ctx, this.styles['stroke']);
        var op = this.styles['stroke']['stroke-opacity'];
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
