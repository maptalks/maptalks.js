import Ajax from 'core/Ajax';
import Browser from 'core/Browser';
import {
    IS_NODE,
    loadImage,
    emptyImageUrl
} from 'core/util';
import {
    on
} from 'core/util/dom';
import Canvas2D from 'core/Canvas';
import TileLayer from 'layer/tile/TileLayer';
import CanvasRenderer from 'renderer/layer/CanvasRenderer';
import Point from 'geo/Point';

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
        this._mapRender = layer.getMap()._getRenderer();
        this._tileRended = {};
        this._tileLoading = {};
    }

    draw() {
        const map = this.getMap();
        if (!this._isDrawable()) {
            return;
        }
        const layer = this.layer,
            tileGrid = layer._getTiles();
        if (!tileGrid) {
            this.completeRender();
            return;
        }

        const mask2DExtent = this.prepareCanvas();
        let extent = map.getContainerExtent();
        if (mask2DExtent) {
            if (!mask2DExtent.intersects(this._extent2D)) {
                this.completeRender();
                return;
            } else {
                extent = mask2DExtent.intersection(this._extent2D).converTo(c => map._pointToContainerPoint(c));
            }
        }
        const tiles = tileGrid['tiles'];

        this._tileZoom = tileGrid.zoom;

        if (!this.canvas) {
            this.createCanvas();
        } else {
            // reset current transformation matrix to the identity matrix
            this.resetCanvasTransform();
        }
        this._drawBackground();
        const loadingCount = this._markTiles(),
            tileLimit = this._getTileLimitOnInteracting();

        this._tileCountToLoad = 0;
        let fading = false;
        //visit all the tiles
        const tileQueue = {};
        for (let i = tiles.length - 1; i >= 0; i--) {
            const tile = tiles[i],
                tileId = tiles[i]['id'];
            //load tile in cache at first if it has.
            const cached = this._getCachedTile(tileId);
            if (!this.layer._isTileInExtent(tile, extent) || this._isLoadingTile(tileId)) {
                continue;
            }
            if (cached) {
                if (this._getTileOpacity(cached) < 1) {
                    fading = true;
                }
                this._drawTile(tile['point'], tileId, cached);
            } else {
                const hitLimit = map.isInteracting() && tileLimit && (this._tileCountToLoad + loadingCount[0]) > tileLimit;
                if (!hitLimit) {
                    this._tileCountToLoad++;
                    tileQueue[tileId + '@' + tile['point'].toArray().join()] = tile;
                }
            }
        }
        if (this._tileCountToLoad === 0) {
            if (!fading && !map.options['zoomBackground']) {
                delete this.background;
            }
            this.completeRender();
        } else {
            this._loadTileQueue(tileQueue);
        }
        this._retireTiles();
    }

    drawOnInteracting() {
        this.draw();
    }

    // Unlike other layers, TileLayerCanvasRenderer is special in drawing on interacting:
    // 1. it doesn't need to redraw on zooming and moving, map just merges layer's canvas as it is into map canvas with necessary transforming.
    // 2. it needs to redraw on drag rotating: when rotating, every tile needs to be rotated.
    needToRedraw() {
        const map = this.getMap();
        if (map.isRotating()) {
            return true;
        }
        if (map.isZooming()) {
            return false;
        }
        if (map.isMoving()) {
            return true;
        }
        return super.needToRedraw();
    }

    hitDetect() {
        return false;
    }

    _getTileLimitOnInteracting() {
        return 0;
    }

    _isDrawable() {
        if (this.getMap().getPitch()) {
            if (console) {
                console.warn('TileLayer with canvas renderer can\'t be pitched, use dom renderer (\'renderer\' : \'dom\') instead.');
            }
            this.clear();
            return false;
        }
        return true;
    }

    _isLoadingTile(tileId) {
        return !!this._tileLoading[tileId];
    }

    _loadTileQueue(tileQueue) {
        for (const p in tileQueue) {
            if (tileQueue.hasOwnProperty(p)) {
                const tileId = p.split('@')[0],
                    tile = tileQueue[p];
                if (!this._tileCache || !this._tileCache[tileId]) {
                    this._loadTile(tile);
                } else {
                    this._drawTileAndRequest(this._tileCache[tileId], tile);
                }
            }
        }
    }

    _loadTile(tile) {
        const tileSize = this.layer.getTileSize();
        const tileImage = new Image();
        tileImage.current = true;
        tileImage.width = tileSize['width'];
        tileImage.height = tileSize['height'];

        on(tileImage, 'load', this._onTileLoad.bind(this, tileImage, tile));
        on(tileImage, 'error', this._onTileError.bind(this, tileImage, tile));
        on(tileImage, 'abort', this._onTileError.bind(this, tileImage, tile));

        const crossOrigin = this.layer.options['crossOrigin'];
        if (crossOrigin) {
            tileImage.crossOrigin = crossOrigin;
        }
        this._tileLoading[tile['id']] = tileImage;
        this._loadImage(tileImage, tile['url']);
    }

    _loadImage(tileImage, url) {
        if (IS_NODE || Browser.ie9) {
            // ie9 doesn't support binary image
            return loadImage(tileImage, [url]);
        }
        return Ajax.getImage(tileImage, url);
    }

    _onTileLoad(tileImage, tileInfo) {
        const id = tileInfo['id'];
        if (!IS_NODE) {
            if (!this._tileRended) {
                // removed
                return;
            }
            tileImage.current = true;
            tileImage.loadTime = Date.now();
            delete this._tileLoading[id];
            this._addTileToCache(id, tileImage);
        }
        this.setToRedraw();
    }

    _onTileError(tileImage, tileInfo) {
        delete this._tileLoading[tileInfo['id']];
        this._clearTileRectAndRequest(tileImage, tileInfo['z']);
    }

    _drawTile(point, tileId, tileImage) {
        if (!point || !this.getMap()) {
            return;
        }
        const map = this.getMap(),
            zoom = map.getZoom(),
            tileSize = this.layer.getTileSize(),
            ctx = this.context,
            cp = map._pointToContainerPoint(point, this._tileZoom)._round(),
            bearing = map.getBearing(),
            transformed = bearing || zoom !== this._tileZoom;
        const opacity = this._getTileOpacity(tileImage);
        const alpha = ctx.globalAlpha;
        if (opacity < 1) {
            ctx.globalAlpha = opacity;
            this.setToRedraw();
        }
        let x = cp.x,
            y = cp.y,
            w = tileSize['width'],
            h = tileSize['height'];
        if (transformed) {
            w++;
            h++;
            ctx.save();
            ctx.translate(x, y);
            if (bearing) {
                ctx.rotate(-bearing * Math.PI / 180);
            }
            if (zoom !== this._tileZoom) {
                const scale = map._getResolution(this._tileZoom) / map._getResolution();
                ctx.scale(scale, scale);
            }
            x = y = 0;
        }
        Canvas2D.image(ctx, tileImage,
            x, y,
            w, h);
        if (this.layer.options['debug']) {
            const p = new Point(x, y),
                color = this.layer.options['debugOutline'],
                xyz = tileId.split('__');
            ctx.save();
            ctx.strokeStyle = color;
            ctx.fillStyle = color;
            ctx.strokeWidth = 10;
            ctx.font = '15px monospace';
            Canvas2D.rectangle(ctx, p, tileSize, 1, 0);
            Canvas2D.fillText(ctx, 'x:' + xyz[1] + ', y:' + xyz[0] + ', z:' + xyz[2], p.add(10, 20), color);
            Canvas2D.drawCross(ctx, p.add(w / 2, h / 2), 2, color);
            ctx.restore();
        }
        if (transformed) {
            ctx.restore();
        }
        if (ctx.globalAlpha !== alpha) {
            ctx.globalAlpha = alpha;
        }
    }

    _getCachedTile(tileId) {
        const cached = this._tileRended[tileId] || (this._tileCache ? this._tileCache.get(tileId) : null);
        if (this._tileRended[tileId]) {
            this._tileRended[tileId].current = true;
        }
        if (this._tileCache && this._tileCache.get(tileId)) {
            this._tileCache.get(tileId).current = true;
        }
        if (this._tileLoading && this._tileLoading[tileId]) {
            this._tileLoading[tileId].current = true;
        }
        return cached;
    }

    _addTileToCache(tileId, tileImage) {
        this._tileRended[tileId] = tileImage;
        tileImage.current = true;
        if (this._tileCache) {
            this._tileCache.add(tileId, tileImage);
        }
    }

    _getTileOpacity(tile) {
        return Math.min(1, (Date.now() - tile.loadTime) / 120);
    }

    /**
     * draw tiles and request map to render
     * @param  {Image} tileImage
     */
    _drawTileAndRequest(tileImage, tileInfo) {
        //sometimes, layer may be removed from map here.
        if (!this.getMap()) {
            return;
        }
        const zoom = this._tileZoom;
        if (zoom !== tileInfo['z']) {
            return;
        }
        const id = tileInfo['id'];
        this._tileCountToLoad--;
        const point = tileInfo['point'];
        this._drawTile(point, id, tileImage);
        if (!IS_NODE) {
            this.setCanvasUpdated();
        }
        if (this._tileCountToLoad === 0) {
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
    _clearTileRectAndRequest(tileImage, tileZoom) {
        if (!this.getMap()) {
            return;
        }
        const zoom = this.getMap().getZoom();
        if (zoom !== tileZoom) {
            return;
        }
        if (!IS_NODE) {
            this.setCanvasUpdated();
        }
        this._tileCountToLoad--;
        if (this._tileCountToLoad === 0) {
            this._onTileLoadComplete();
        }
    }

    onRemove() {
        delete this._mapRender;
        delete this._tileCache;
        delete this._tileRended;
        delete this._tileZoom;
        delete this._tileLoading;
    }

    _markTiles() {
        let a = 0, b = 0;
        if (this._tileLoading) {
            for (const p in this._tileLoading) {
                this._tileLoading[p].current = false;
                a++;
            }
        }
        if (this._tileRended) {
            for (const p in this._tileRended) {
                this._tileRended[p].current = false;
                b++;
            }
        }
        return [a, b];
    }

    _retireTiles() {
        for (const i in this._tileLoading) {
            const tile = this._tileLoading[i];
            if (!tile.current) {
                // abort loading tiles
                tile.onload = falseFn;
                tile.onerror = falseFn;
                tile.src = emptyImageUrl;
                this._deleteTile(tile);
                delete this._tileLoading[i];
            }
        }
        for (const i in this._tileRended) {
            const tile = this._tileRended[i];
            if (!tile.current) {
                this._deleteTile(tile);
                delete this._tileRended[i];
            }
        }
    }

    _deleteTile(tile) {
        if (!tile) {
            return;
        }
    }

    _drawBackground() {
        if (this.background) {
            const ctx = this.context,
                back = this.background,
                map = this.getMap();
            const scale = map._getResolution(back.tileZoom) / map._getResolution();
            const cp = map._pointToContainerPoint(back.nw, back.zoom);
            ctx.save();
            ctx.translate(cp.x, cp.y);
            ctx.scale(scale, scale);
            ctx.drawImage(back.canvas, 0, 0);
            ctx.restore();
        }
    }

    onZoomStart(e) {
        const map = this.getMap();
        const preserveBack = !IS_NODE && (map && this.layer === map.getBaseLayer());
        if (preserveBack) {
            this.background = {
                canvas : Canvas2D.copy(this.canvas),
                tileZoom : this._tileZoom,
                zoom : map.getZoom(),
                nw : this._northWest
            };
        }
        super.onZoomStart(e);
    }
}

TileLayer.registerRenderer('canvas', TileLayerRenderer);

function falseFn() { return false; }
