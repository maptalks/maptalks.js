import {
    isNode,
    requestAnimFrame,
    cancelAnimFrame,
    loadImage
} from 'core/util';
import PointExtent from 'geo/PointExtent';
import Canvas2D from 'core/Canvas';
import TileLayer from 'layer/tile/TileLayer';
import CanvasRenderer from 'renderer/layer/CanvasRenderer';
import TileCache from './TileCache';

/**
 * @classdesc
 * Renderer class based on HTML5 Canvas2D for TileLayers
 * @class
 * @protected
 * @memberOf maptalks.renderer
 * @extends {renderer.CanvasRenderer}
 * @param {maptalks.TileLayer} layer - TileLayer to render
 */
export default class TileLayerRenderer extends CanvasRenderer {

    constructor(layer) {
        super(layer);
        this.propertyOfPointOnTile = '--maptalks-tile-point';
        this.propertyOfTileId = '--maptalks-tile-id';
        this.propertyOfTileZoom = '--maptalks-tile-zoom';
        this._mapRender = layer.getMap()._getRenderer();
        if (!isNode && this.layer.options['cacheTiles']) {
            this._tileCache = new TileCache();
        }
        this._tileQueue = {};
    }

    draw() {
        if (this.getMap().getPitch()) {
            if (console) {
                console.warn('TileLayer with canvas renderer can\'t be pitched, use dom renderer (\'renderer\' : \'dom\') instead.');
            }
            this.clear();
            return;
        }
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

        // this._extent2D = tileGrid['fullExtent'];
        // this._northWest = tileGrid['northWest'];
        if (!this.canvas) {
            this.createCanvas();
        }
        // this.resizeCanvas(tileGrid['fullExtent'].getSize());
        var mask2DExtent = this.prepareCanvas();
        if (mask2DExtent && !mask2DExtent.intersects(this._extent2D)) {
            this.completeRender();
            return;
        }

        //visit all the tiles
        this._totalTileToLoad = this._tileToLoadCounter = 0;
        var tile, tileId, cached, tile2DExtent;
        for (var i = tiles.length - 1; i >= 0; i--) {
            tile = tiles[i];
            tileId = tiles[i]['id'];
            //load tile in cache at first if it has.
            cached = tileRended[tileId] || (tileCache ? tileCache.get(tileId) : null);
            tile2DExtent = new PointExtent(tile['point'],
                tile['point'].add(tileSize.toPoint()));
            if (!this._extent2D.intersects(tile2DExtent) || (mask2DExtent && !mask2DExtent.intersects(tile2DExtent))) {
                continue;
            }
            this._totalTileToLoad++;
            if (cached) {
                this._drawTile(tile['point'], cached);
                this._tileRended[tileId] = cached;
            } else {

                this._tileToLoadCounter++;
                this._tileQueue[tileId + '@' + tile['point'].toString()] = tile;
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
    }

    hitDetect() {
        return false;
    }

    _scheduleLoadTileQueue() {
        if (this._loadQueueTimeout) {
            cancelAnimFrame(this._loadQueueTimeout);
        }
        this._loadQueueTimeout = requestAnimFrame(() => {
            if (this.getMap()) {
                this._loadTileQueue();
            }
        });
    }

    _loadTileQueue() {
        var me = this;
        function onTileLoad() {
            if (!isNode) {
                if (me._tileCache) {
                    me._tileCache.add(this[me.propertyOfTileId], this);
                }
                me._tileRended[this[me.propertyOfTileId]] = this;
            }
            me._drawTileAndRequest(this);
        }

        function onTileError() {
            me._clearTileRectAndRequest(this);
        }
        var tileId, tile;
        for (let p in this._tileQueue) {
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
    }


    _loadTile(tileId, tile, onTileLoad, onTileError) {
        var crossOrigin = this.layer.options['crossOrigin'];
        var tileSize = this.layer.getTileSize();
        var tileImage = new Image();
        tileImage.width = tileSize['width'];
        tileImage.height = tileSize['height'];
        tileImage[this.propertyOfTileId] = tileId;
        tileImage[this.propertyOfPointOnTile] = tile['point'];
        tileImage[this.propertyOfTileZoom] = tile['z'];
        tileImage.onload = onTileLoad;
        tileImage.onabort = onTileError;
        tileImage.onerror = onTileError;
        if (crossOrigin) {
            tileImage.crossOrigin = crossOrigin;
        }
        loadImage(tileImage, [tile['url']]);
    }


    _drawTile(point, tileImage) {
        if (!point) {
            return;
        }
        var tileSize = this.layer.getTileSize();
        const ctx = this.context;
        Canvas2D.image(ctx, tileImage,
            Math.floor(point.x - this._northWest.x), Math.floor(point.y - this._northWest.y),
            tileSize['width'], tileSize['height']);
        if (this.layer.options['debug']) {
            var p = point.substract(this._northWest);
            ctx.save();
            const color = '#0f0';
            ctx.strokeStyle = color;
            ctx.fillStyle = color;
            ctx.strokeWidth = 10;
            ctx.font = '15px monospace';
            Canvas2D.rectangle(ctx, p, tileSize, 1, 0);
            var xyz = tileImage[this.propertyOfTileId].split('__');
            Canvas2D.fillText(ctx, 'x:' + xyz[1] + ', y:' + xyz[0] + ', z:' + xyz[2], p.add(10, 20), color);
            Canvas2D.drawCross(ctx, p.add(tileSize['width'] / 2, tileSize['height'] / 2), 2, color);
            this.context.restore();
        }
        tileImage = null;
    }

    /**
     * draw tiles and request map to render
     * @param  {Image} tileImage
     */
    _drawTileAndRequest(tileImage) {
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

        if (!isNode) {
            var tileSize = this.layer.getTileSize();
            var mapExtent = this.getMap()._get2DExtent();
            if (mapExtent.intersects(new PointExtent(point, point.add(tileSize['width'], tileSize['height'])))) {
                this.requestMapToRender();
            }
        }
        if (this._tileToLoadCounter === 0) {
            this._onTileLoadComplete();
        }
    }

    _onTileLoadComplete() {
        //In browser, map will be requested to render once a tile was loaded.
        //but in node, map will be requested to render when the layer is loaded.
        if (isNode) {
            this.requestMapToRender();
        }
        this.fireLoadedEvent();
    }

    /**
     * Clear tiles and request map to render
     * @param  {Image} tileImage
     */
    _clearTileRectAndRequest(tileImage) {
        if (!this.getMap()) {
            return;
        }
        var zoom = this.getMap().getZoom();
        if (zoom !== tileImage[this.propertyOfTileZoom]) {
            return;
        }
        if (!isNode) {
            this.requestMapToRender();
        }
        this._tileToLoadCounter--;
        if (this._tileToLoadCounter === 0) {
            this._onTileLoadComplete();
        }
    }

    /**
     * @override
     */
    requestMapToRender() {
        if (isNode) {
            if (this.getMap() && !this.getMap().isZooming()) {
                this._mapRender.render();
            }
            return;
        }
        if (this._mapRenderRequest) {
            cancelAnimFrame(this._mapRenderRequest);
        }
        this._mapRenderRequest = requestAnimFrame(() => {
            if (this.getMap() && !this.getMap().isZooming()) {
                this._mapRender.render();
            }
        });
    }

    onRemove() {
        cancelAnimFrame(this._loadQueueTimeout);
        cancelAnimFrame(this._mapRenderRequest);
        delete this._mapRender;
        delete this._tileCache;
        delete this._tileRended;
        delete this._tileQueue;
    }
}

TileLayer.registerRenderer('canvas', TileLayerRenderer);
