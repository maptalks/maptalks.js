Z.renderer.canvastilelayer = {};

Z.renderer.canvastilelayer.Canvas = Z.renderer.tilelayer.Canvas.extend({
    _loadTile:function (tileId, tile, onTileLoad, onTileError) {
        var tileSize = this.layer.getTileSize(),
            canvasClass = this.canvas.constructor,
            map = this.getMap();
        var r = Z.Browser.retina ? 2 : 1;
        var tileCanvas = Z.Canvas.createCanvas(tileSize['width'] * r, tileSize['height'] * r, canvasClass);

        tileCanvas[this.propertyOfTileId] = tileId;
        tileCanvas[this.propertyOfPointOnTile] = tile['viewPoint'];
        tileCanvas[this.propertyOfTileZoom] = tile['zoom'];
        this.layer.drawTile(tileCanvas, {
            'url' : tile['url'],
            'viewPoint' : tile['viewPoint'],
            'zoom' : tile['zoom'],
            'extent' : map._pointToExtent(new Z.PointExtent(tile['2dPoint'], tile['2dPoint'].add(tileSize.toPoint())))
        }, function (error) {
            if (error) {
                onTileError.call(tileCanvas);
                return;
            }
            onTileLoad.call(tileCanvas);
        });
    }
});

Z.CanvasTileLayer.registerRenderer('canvas', Z.renderer.canvastilelayer.Canvas);
