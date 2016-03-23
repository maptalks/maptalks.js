Z.renderer.canvastilelayer = {};

Z.renderer.canvastilelayer.Canvas=Z.renderer.tilelayer.Canvas.extend({
     _loadTile:function(tileId, tile, onTileLoad, onTileError) {
        var tileSize = this._layer.getTileSize(),
            canvasClass = this._canvas.constructor,
            layer = this._layer;
        var tileCanvas = Z.Canvas.createCanvas(tileSize['width'], tileSize['height'], canvasClass);
        tileCanvas[this.propertyOfTileId]=tileId;
        tileCanvas[this.propertyOfPointOnTile] = tile['viewPoint'];
        tileCanvas[this.propertyOfTileZoom] = tile['zoom'];
        layer.drawTile(tileCanvas, {
                'url' : tile['url'],
                'viewPoint' : tile['viewPoint'],
                'zoom' : tile['zoom'],
                'extent' : map.viewToExtent(new Z.PointExtent(tile['viewPoint'], tile['viewPoint'].add(tileSize.toPoint())))
            }, function(error) {
                if (error) {
                    onTileError.call(tileCanvas)
                    return;
                };
                onTileLoad.call(tileCanvas);
            });
    }
});

Z.CanvasTileLayer.registerRenderer('canvas', Z.renderer.canvastilelayer.Canvas);
