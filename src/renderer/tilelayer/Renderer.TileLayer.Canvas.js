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

    initialize:function(layer) {
        this._layer = layer;
        this._mapRender = layer.getMap()._getRenderer();
        this._tileCache = new Z.TileLayer.TileCache();
        this._registerEvents();
        this._tileQueue = {};
    },

    remove:function() {
        var map = this.getMap();
        map.off('_moveend _resize _zoomend',this._onMapEvent,this);
        if (this._onMapMoving) {
            map.off('_moving',this._onMapMoving,this);
        }
        this._requestMapToRender();
    },

    clear:function() {
        this._clearCanvas();
        this._requestMapToRender();
    },

    clearExecutors:function() {
        clearTimeout(this._loadQueueTimeout);
    },

    _render:function() {
        var map = this.getMap();
        if (!map) {
            return;
        }
        if (!this._layer.isVisible()) {
            this._fireLoadedEvent();
            return;
        }
        var layer = this._layer;
        var tileGrid = layer._getTiles();
        if (!tileGrid) {
            this._fireLoadedEvent();
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

        this._canvasFullExtent =  this.getMap()._getViewExtent();
        var viewExtent = this._canvasFullExtent;
        var maskViewExtent = this._prepareCanvas(viewExtent);
        if (maskViewExtent) {
            if (!maskViewExtent.intersects(viewExtent)) {
                this._fireLoadedEvent();
                return;
            }
        }

        //遍历瓦片
        this._tileToLoadCounter = 0;
        var tile, tileId, cached, tileViewExtent;
        for (var i = tiles.length - 1; i >= 0; i--) {
            tile = tiles[i];
            tileId = tiles[i]['id'];
            //如果缓存中已存有瓦片, 则从不再请求而从缓存中读取.
            cached = tileRended[tileId] || tileCache.get(tileId);
            tileViewExtent = new Z.PointExtent(tile['viewPoint'],
                                tile['viewPoint'].add(tileSize.toPoint()));
            if (!viewExtent.intersects(tileViewExtent)) {
                continue;
            }
            if (cached) {
                    //画瓦片
                this._drawTile(tile['viewPoint'], cached);
                this._tileRended[tileId] = cached;
            } else {

                this._tileToLoadCounter++;
                this._tileQueue[tileId+"@"+tile['viewPoint'].toString()] = tile;
            }
        }

        if (this._tileToLoadCounter === 0){
            this._requestMapToRender();
            this._fireLoadedEvent();
        } else {
            this._totalTileToLoad = this._tileToLoadCounter;
            this._scheduleLoadTileQueue();
        }
    },

    getCanvasImage:function() {
        if (!this._canvasFullExtent || this._renderZoom !== this.getMap().getZoom()) {
            return null;
        }
         var gradualOpacity = null;
        if (this._gradualLoading && this._totalTileToLoad && this._layer.options['gradualLoading']) {
            gradualOpacity = ((this._totalTileToLoad - this._tileToLoadCounter) / this._totalTileToLoad)*1.5 ;
            if (gradualOpacity > 1) {
                gradualOpacity = 1;
            }
        }
        var size = this._canvasFullExtent.getSize();
        var point = this._canvasFullExtent.getMin();
        return {'image':this._canvas,'layer':this._layer,'point':this.getMap().viewPointToContainerPoint(point),'size':size,'opacity':gradualOpacity};
    },

    getPaintContext:function() {
        return [this._context];
    },

    _scheduleLoadTileQueue:function() {

        if (this._loadQueueTimeout) {
            clearTimeout(this._loadQueueTimeout);
        }

        var me = this;
        this._loadQueueTimeout = setTimeout(function(){me._loadTileQueue();},10);
    },

    _loadTileQueue:function() {
        var me = this;
        function onTileLoad() {
            me._tileCache.add(this[me.propertyOfTileId], this);
            me._tileRended[this[me.propertyOfTileId]] = this;
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
                if (!this._tileCache[tileId]) {
                    this._loadTile(tileId, tile, onTileLoad, onTileError);
                } else {
                    this._drawTileAndRequest(this._tileCache[tileId]);
                }

            }
        }

    },


    _loadTile:function(tileId, tile, onTileLoad, onTileError) {
        var crossOrigin = this._layer.options['crossOrigin'];
        var tileSize = this._layer.getTileSize();
        var tileImage = new Image();
        tileImage.width = tileSize['width'];
        tileImage.height = tileSize['height'];
        tileImage[this.propertyOfTileId]=tileId;
        tileImage[this.propertyOfPointOnTile] = tile['viewPoint'];
        tileImage[this.propertyOfTileZoom] = tile['zoom'];
        tileImage.onload = onTileLoad;
        tileImage.onabort = onTileError;
        tileImage.onerror = onTileError;
        if (crossOrigin) {
            tileImage.crossOrigin = crossOrigin;
        }
        Z.Util.loadImage(tileImage, [tile['url']]);
    },


    _drawTile:function(point, tileImage) {
        if (!point) {
            return;
        }
        var tileSize = this._layer.getTileSize();
        Z.Canvas.image(this._context, tileImage,
            point.x-this._canvasFullExtent['xmin'], point.y-this._canvasFullExtent['ymin'],
            tileSize['width'], tileSize['height']);
        if (this._layer.options['debug']) {
            this._context.save();
            this._context.strokeStyle = 'rgb(0,0,0)';
            this._context.fillStyle = 'rgb(0,0,0)';
            this._context.strokeWidth = 10;
            this._context.font='15px monospace';
            Z.Canvas.rectangle(this._context, p, tileSize, 1, 0);
            var xyz = tileImage[this.propertyOfTileId].split('__');
            Z.Canvas.fillText(this._context, 'x:'+xyz[1]+',y:'+xyz[0]+',z:'+xyz[2], p.add(new Z.Point(10,20)), 'rgb(0,0,0)');
            this._context.restore();
        }
    },

    /**
     * 绘制瓦片, 并请求地图重绘
     * @param  {Point} point        瓦片左上角坐标
     * @param  {Image} tileImage 瓦片图片对象
     */
    _drawTileAndRequest:function(tileImage) {
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
        this._drawTile(point, tileImage);

        if (!Z.node) {
            var tileSize = this._layer.getTileSize();
            var viewExtent = this.getMap()._getViewExtent();
            if (viewExtent.intersects(new Z.PointExtent(point, point.add(new Z.Point(tileSize['width'], tileSize['height']))))) {
                this._requestMapToRender();
            }
        }
        if (this._tileToLoadCounter === 0) {
            this._onTileLoadComplete();
        }
    },

    _onTileLoadComplete:function() {
        //In browser, map will be requested to render once a tile was loaded.
        //but in node, map will be requested to render when the layer is loaded.
        if (Z.node) {
            this._requestMapToRender();
        }
        this._fireLoadedEvent();
    },

    /**
     * 清除瓦片区域, 并请求地图重绘
     * @param  {Point} point        瓦片左上角坐标
     */
    _clearTileRectAndRequest:function(tileImage) {
        if (!this.getMap()) {
            return;
        }
        var zoom = this.getMap().getZoom();
        if (zoom !== tileImage[this.propertyOfTileZoom]) {
            return;
        }
        this._tileToLoadCounter--;
        if (this._tileToLoadCounter === 0) {
            this._onTileLoadComplete();
        }
    },

    /**
     * @override
     */
    _requestMapToRender:function() {
        if (Z.node) {
            if (this.getMap() && !this.getMap()._isBusy()) {
                this._mapRender.render();
            }
            return;
        }
        if (this._mapRenderRequest) {
            clearTimeout(this._mapRenderRequest);
        }
        var me = this;
        this._mapRenderRequest = setTimeout(function() {
            if (me.getMap() && !me.getMap()._isBusy()) {
                me._mapRender.render();
            }
        }, 1);
    },

    _registerEvents:function() {
        var map = this.getMap();
        map.on('_moveend _zoomend _resize',this._onMapEvent,this);
        if (this._layer.options['renderWhenPanning']) {
        var rendSpan = this._layer.options['renderSpanWhenPanning'];
            if (Z.Util.isNumber(rendSpan) && rendSpan >= 0) {
                if (rendSpan > 0) {
                    this._onMapMoving = Z.Util.throttle(function() {
                            this._gradualLoading = false;
                            this.render();
                        },rendSpan,this);
                } else {
                    this._onMapMoving = function() {
                        this._gradualLoading = false;
                        this.render();
                    };
                }
                map.on('_moving',this._onMapMoving,this);
            }
        }

    },

    _onMapEvent:function(param) {
        if (param['type'] === '_moveend' || param['type'] === '_zoomend') {
            if (param['type'] === '_zoomend') {
                this._gradualLoading = true;
            } else {
                this._gradualLoading = false;
            }
            this.render();
        } else if (param['type'] === '_resize') {
            this._resizeCanvas();
            this.render();
        }
    }



});

Z.TileLayer.registerRenderer('canvas',Z.renderer.tilelayer.Canvas);
