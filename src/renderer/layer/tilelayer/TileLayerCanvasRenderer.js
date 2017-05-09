import {
    IS_NODE,
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
        if (!IS_NODE && this.layer.options['cacheTiles']) {
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
        const layer = this.layer;
        const tileGrid = layer._getTiles();
        if (!tileGrid) {
            this.completeRender();
            return;
        }
        if (!this._tileRended) {
            this._tileRended = {};
        }
        const tileRended = this._tileRended;
        this._tileRended = {};

        const tiles = tileGrid['tiles'],
            tileCache = this._tileCache,
            tileSize = layer.getTileSize();

        // this._extent2D = tileGrid['fullExtent'];
        // this._northWest = tileGrid['northWest'];
        if (!this.canvas) {
            this.createCanvas();
        }
        // this.resizeCanvas(tileGrid['fullExtent'].getSize());
        const mask2DExtent = this.prepareCanvas();
        if (mask2DExtent && !mask2DExtent.intersects(this._extent2D)) {
            this.completeRender();
            return;
        }

        //visit all the tiles
        this._totalTileToLoad = this._tileToLoadCounter = 0;
        for (let i = tiles.length - 1; i >= 0; i--) {
            const tile = tiles[i];
            const tileId = tiles[i]['id'];
            //load tile in cache at first if it has.
            const cached = tileRended[tileId] || (tileCache ? tileCache.get(tileId) : null);
            const tile2DExtent = new PointExtent(tile['point'], tile['point'].add(tileSize.toPoint()));
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
                this.setToRedraw();
            }
            this._scheduleLoadTileQueue();
        }
    }

    needToRedraw() {
        const map = this.getMap();
        if (map.isInteracting()) {
            return true;
        }
        return super.needToRedraw();
    }

    hitDetect() {
        return false;
    }

    _scheduleLoadTileQueue() {
        this._loadTileQueue();
    }

    _loadTileQueue() {
        const me = this;
        function onTileLoad() {
            if (!IS_NODE) {
                if (!me._tileRended) {
                    // removed
                    return;
                }
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

        for (const p in this._tileQueue) {
            if (this._tileQueue.hasOwnProperty(p)) {
                const tileId = p.split('@')[0];
                const tile = this._tileQueue[p];
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
        const crossOrigin = this.layer.options['crossOrigin'];
        const tileSize = this.layer.getTileSize();
        const tileImage = new Image();
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
        const tileSize = this.layer.getTileSize();
        const ctx = this.context;
        Canvas2D.image(ctx, tileImage,
            Math.floor(point.x - this._northWest.x), Math.floor(point.y - this._northWest.y),
            tileSize['width'], tileSize['height']);
        if (this.layer.options['debug']) {
            const p = point.sub(this._northWest);
            ctx.save();
            const color = '#0f0';
            ctx.strokeStyle = color;
            ctx.fillStyle = color;
            ctx.strokeWidth = 10;
            ctx.font = '15px monospace';
            Canvas2D.rectangle(ctx, p, tileSize, 1, 0);
            const xyz = tileImage[this.propertyOfTileId].split('__');
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
        const zoom = this.getMap().getZoom();
        if (zoom !== tileImage[this.propertyOfTileZoom]) {
            return;
        }
        this._tileToLoadCounter--;
        const point = tileImage[this.propertyOfPointOnTile];
        this._drawTile(point, tileImage);

        if (!IS_NODE) {
            const tileSize = this.layer.getTileSize();
            const mapExtent = this.getMap()._get2DExtent();
            if (mapExtent.intersects(new PointExtent(point, point.add(tileSize['width'], tileSize['height'])))) {
                this.setToRedraw();
            }
        }
        if (this._tileToLoadCounter === 0) {
            this._onTileLoadComplete();
        }
    }

    _onTileLoadComplete() {
        this.completeRender();
    }

    /**
     * Clear tiles and request map to render
     * @param  {Image} tileImage
     */
    _clearTileRectAndRequest(tileImage) {
        if (!this.getMap()) {
            return;
        }
        const zoom = this.getMap().getZoom();
        if (zoom !== tileImage[this.propertyOfTileZoom]) {
            return;
        }
        if (!IS_NODE) {
            this.setToRedraw();
        }
        this._tileToLoadCounter--;
        if (this._tileToLoadCounter === 0) {
            this._onTileLoadComplete();
        }
    }

    onRemove() {
        delete this._mapRender;
        delete this._tileCache;
        delete this._tileRended;
        delete this._tileQueue;
    }
}

TileLayer.registerRenderer('canvas', TileLayerRenderer);
