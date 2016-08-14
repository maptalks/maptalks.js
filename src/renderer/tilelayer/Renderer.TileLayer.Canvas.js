/**
 * @classdesc
 * Renderer class based on HTML5 Canvas2D for TileLayers
 * @class
 * @protected
 * @memberOf maptalks.renderer.tilelayer
 * @name Canvas
 * @extends {maptalks.renderer.Canvas}
 * @param {maptalks.TileLayer} layer - layer of the renderer
 */
Z.renderer.tilelayer.Canvas = Z.renderer.Canvas.extend(/** @lends Z.renderer.tilelayer.Canvas.prototype */{

    propertyOfPointOnTile   : '--maptalks-tile-point',
    propertyOfTileId        : '--maptalks-tile-id',
    propertyOfTileZoom      : '--maptalks-tile-zoom',

    initialize:function (layer) {
        this.layer = layer;
        this._mapRender = layer.getMap()._getRenderer();
        if (!Z.node || !this.layer.options['cacheTiles']) {
            this._tileCache = new Z.TileLayer.TileCache();
        }
        this._tileQueue = {};
    },

    clear:function () {
        this.clearCanvas();
        this.requestMapToRender();
    },

    clearExecutors:function () {
        clearTimeout(this._loadQueueTimeout);
    },

    draw:function () {
        var layer = this.layer;
        var tileGrid = layer._getTiles();
        if (!tileGrid) {
            this.completeRender();
            return;
        }
        if (!this._tileRended) {
            this._tileRended = {};
        }
        var tileRended = this._tileRended;
        this._tileRended = {};

        var tiles = tileGrid['tiles'],
            tileCache = this._tileCache,
            tileSize = layer.getTileSize();

        this._extent2D = tileGrid['fullExtent'];
        this._viewExtent = tileGrid['viewExtent'];
        if (!this.canvas) {
            this.createCanvas();
        }
        this.resizeCanvas(tileGrid['fullExtent'].getSize());
        var mask2DExtent = this.prepareCanvas();
        if (mask2DExtent && !mask2DExtent.intersects(this._extent2D)) {
            this.completeRender();
            return;
        }

        //遍历瓦片
        this._totalTileToLoad = this._tileToLoadCounter = 0;
        var tile, tileId, cached, tile2DExtent;
        for (var i = tiles.length - 1; i >= 0; i--) {
            tile = tiles[i];
            tileId = tiles[i]['id'];
            //如果缓存中已存有瓦片, 则从不再请求而从缓存中读取.
            cached = tileRended[tileId] || tileCache ? tileCache.get(tileId) : null;
            tile2DExtent = new Z.PointExtent(tile['2dPoint'],
                                tile['2dPoint'].add(tileSize.toPoint()));
            if (!this._extent2D.intersects(tile2DExtent)) {
                continue;
            }
            this._totalTileToLoad++;
            if (cached) {
                this._drawTile(tile['viewPoint'], cached);
                this._tileRended[tileId] = cached;
            } else {

                this._tileToLoadCounter++;
                this._tileQueue[tileId + '@' + tile['viewPoint'].toString()] = tile;
            }
        }

        if (this._tileToLoadCounter === 0) {
            this.completeRender();
        } else {
            if (this._tileToLoadCounter < this._totalTileToLoad) {
                this.requestMapToRender();
            }
            this._scheduleLoadTileQueue();
        }
    },

    getCanvasImage:function () {
        if (this._renderZoom !== this.getMap().getZoom() || !this.canvas) {
            return null;
        }
        var gradualOpacity = null;
        if (this._gradualLoading && this._totalTileToLoad && this.layer.options['gradualLoading']) {
            gradualOpacity = ((this._totalTileToLoad - this._tileToLoadCounter) / this._totalTileToLoad) * 1.5;
            if (gradualOpacity > 1) {
                gradualOpacity = 1;
            }
        }
        var canvasImage = Z.renderer.Canvas.prototype.getCanvasImage.apply(this, arguments);
        canvasImage['opacity'] = gradualOpacity;
        return canvasImage;
        // var size = this._extent2D.getSize();
        // var point = this._extent2D.getMin();
        // return {'image':this.canvas, 'layer':this.layer, 'point':this.getMap()._pointToContainerPoint(point), 'size':size, 'opacity':gradualOpacity};
    },

    _scheduleLoadTileQueue:function () {

        if (this._loadQueueTimeout) {
            Z.Util.cancelAnimFrame(this._loadQueueTimeout);
        }

        var me = this;
        this._loadQueueTimeout = Z.Util.requestAnimFrame(function () { me._loadTileQueue(); });
    },

    _loadTileQueue:function () {
        var me = this;
        function onTileLoad() {
            if (!Z.node) {
                if (me._tileCache) { me._tileCache.add(this[me.propertyOfTileId], this); }
                me._tileRended[this[me.propertyOfTileId]] = this;
            }
            me._drawTileAndRequest(this);
        }
        function onTileError() {
            me._clearTileRectAndRequest(this);
        }
        var tileId, tile;
        for (var p in this._tileQueue) {
            if (this._tileQueue.hasOwnProperty(p)) {
                tileId = p.split('@')[0];
                tile = this._tileQueue[p];
                delete this._tileQueue[p];
                if (!this._tileCache || !this._tileCache[tileId]) {
                    this._loadTile(tileId, tile, onTileLoad, onTileError);
                } else {
                    this._drawTileAndRequest(this._tileCache[tileId]);
                }

            }
        }

    },


    _loadTile:function (tileId, tile, onTileLoad, onTileError) {
        var crossOrigin = this.layer.options['crossOrigin'];
        var tileSize = this.layer.getTileSize();
        var tileImage = new Image();
        tileImage.width = tileSize['width'];
        tileImage.height = tileSize['height'];
        tileImage[this.propertyOfTileId] = tileId;
        tileImage[this.propertyOfPointOnTile] = {
            'viewPoint' : tile['viewPoint'],
            '2dPoint' : tile['2dPoint']
        };
        tileImage[this.propertyOfTileZoom] = tile['zoom'];
        tileImage.onload = onTileLoad;
        tileImage.onabort = onTileError;
        tileImage.onerror = onTileError;
        if (crossOrigin) {
            tileImage.crossOrigin = crossOrigin;
        }
        Z.Util.loadImage(tileImage, [tile['url']]);
    },


    _drawTile:function (point, tileImage) {
        if (!point) {
            return;
        }
        var tileSize = this.layer.getTileSize();
        var leftTop = this._viewExtent.getMin();
        Z.Canvas.image(this.context, tileImage,
            point.x - leftTop.x, point.y - leftTop.y,
            tileSize['width'], tileSize['height']);
        if (this.layer.options['debug']) {
            var p = point.substract(leftTop);
            this.context.save();
            this.context.strokeStyle = 'rgb(0,0,0)';
            this.context.fillStyle = 'rgb(0,0,0)';
            this.context.strokeWidth = 10;
            this.context.font = '15px monospace';
            Z.Canvas.rectangle(this.context, p, tileSize, 1, 0);
            var xyz = tileImage[this.propertyOfTileId].split('__');
            Z.Canvas.fillText(this.context, 'x:' + xyz[1] + ',y:' + xyz[0] + ',z:' + xyz[2], p.add(10, 20), 'rgb(0,0,0)');
            this.context.restore();
        }
        tileImage = null;
    },

    /**
     * 绘制瓦片, 并请求地图重绘
     * @param  {Point} point        瓦片左上角坐标
     * @param  {Image} tileImage 瓦片图片对象
     */
    _drawTileAndRequest:function (tileImage) {
        //sometimes, layer may be removed from map here.
        if (!this.getMap()) {
            return;
        }
        var zoom = this.getMap().getZoom();
        if (zoom !== tileImage[this.propertyOfTileZoom]) {
            return;
        }
        this._tileToLoadCounter--;
        var point = tileImage[this.propertyOfPointOnTile];
        this._drawTile(point['viewPoint'], tileImage);

        if (!Z.node) {
            var tileSize = this.layer.getTileSize();
            var mapExtent = this.getMap()._get2DExtent();
            if (mapExtent.intersects(new Z.PointExtent(point['2dPoint'], point['2dPoint'].add(tileSize['width'], tileSize['height'])))) {
                this.requestMapToRender();
            }
        }
        if (this._tileToLoadCounter === 0) {
            this._onTileLoadComplete();
        }
    },

    _onTileLoadComplete:function () {
        //In browser, map will be requested to render once a tile was loaded.
        //but in node, map will be requested to render when the layer is loaded.
        if (Z.node) {
            this.requestMapToRender();
        }
        this.fireLoadedEvent();
    },

    /**
     * 清除瓦片区域, 并请求地图重绘
     * @param  {Point} point        瓦片左上角坐标
     */
    _clearTileRectAndRequest:function (tileImage) {
        if (!this.getMap()) {
            return;
        }
        var zoom = this.getMap().getZoom();
        if (zoom !== tileImage[this.propertyOfTileZoom]) {
            return;
        }
        if (!Z.node) {
            this.requestMapToRender();
        }
        this._tileToLoadCounter--;
        if (this._tileToLoadCounter === 0) {
            this._onTileLoadComplete();
        }
    },

    /**
     * @override
     */
    requestMapToRender:function () {
        if (Z.node) {
            if (this.getMap() && !this.getMap()._isBusy()) {
                this._mapRender.render();
            }
            return;
        }
        if (this._mapRenderRequest) {
            Z.Util.cancelAnimFrame(this._mapRenderRequest);
        }
        var me = this;
        this._mapRenderRequest = Z.Util.requestAnimFrame(function () {
            if (me.getMap() && !me.getMap()._isBusy()) {
                me._mapRender.render();
            }
        });
    },

    onMoveEnd: function () {
        this._gradualLoading = false;
        Z.renderer.Canvas.prototype.onMoveEnd.apply(this, arguments);
    },

    onZoomEnd: function () {
        this._gradualLoading = true;
        Z.renderer.Canvas.prototype.onZoomEnd.apply(this, arguments);
    },

    onRemove: function () {
        delete this._viewExtent;
        delete this._mapRender;
        delete this._tileCache;
        delete this._tileRended;
        delete this._tileQueue;
    }
});

Z.TileLayer.registerRenderer('canvas', Z.renderer.tilelayer.Canvas);
