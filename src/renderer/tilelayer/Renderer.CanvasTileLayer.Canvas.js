Z.renderer.canvastilelayer = {};

Z.renderer.canvastilelayer.Canvas=Z.renderer.tilelayer.Canvas.extend({
    _loadTileQueue:function() {
        var me = this;
        function onTileLoad(canvas) {
            me._tileCache.add(canvas[me.propertyOfTileId], canvas);
            me._tileRended[me.propertyOfTileId] = canvas;
            me._drawTileAndRequest(canvas);

        }
        function onTileError(canvas) {
            me._clearTileRectAndRequest(canvas);
        }
        var tileSize = this._layer.getTileSize(),
            canvasClass = this._canvas.constructor,
            layer = this._layer,
            zoom = this.getMap().getZoom();
        var tileId, tile, tileCanvas;
        for (var p in this._tileQueue) {
            if (this._tileQueue.hasOwnProperty(p)) {
                tileId = p.split('@')[0];
                tile = this._tileQueue[p];
                delete this._tileQueue[p];
                if (!this._tileCache[tileId]) {
                    tileCanvas = Z.Canvas.createCanvas(tileSize['width'], tileSize['height'], canvasClass);
                    tileCanvas[this.propertyOfTileId]=tileId;
                    tileCanvas[this.propertyOfPointOnTile] = tile['viewPoint'];
                    tileCanvas[this.propertyOfTileZoom] = tile['zoom'];
                    layer.drawTile(tileCanvas, {
                            'url' : tile['url'],
                            'viewPoint' : tile['viewPoint'],
                            'zoom' : tile['zoom'],
                            'extent' : map.viewToExtent(new Z.PointExtent(tile['viewPoint'], tile['viewPoint'].add(tileSize.toPoint())))
                        }, function(error, canvas) {
                            if (error) {
                                onTileError(canvas)
                                return;
                            };
                            onTileLoad(canvas);
                        });
                } else {
                    this._drawTileAndRequest(this._tileCache[tileId]);
                }

            }
        }

    }
});

Z.CanvasTileLayer.registerRenderer('canvas', Z.renderer.canvastilelayer.Canvas);
