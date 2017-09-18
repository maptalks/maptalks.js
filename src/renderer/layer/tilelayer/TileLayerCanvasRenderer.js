import {
    IS_NODE,
    loadImage,
    emptyImageUrl
} from 'core/util';
import {
    on
} from 'core/util/dom';
import PointExtent from 'geo/PointExtent';
import Canvas2D from 'core/Canvas';
import TileLayer from 'layer/tile/TileLayer';
import CanvasRenderer from 'renderer/layer/CanvasRenderer';
import TileCache from './TileCache';
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
        if (!IS_NODE && this.layer.options['cacheTiles']) {
            this._tileCache = new TileCache();
        }
        this._tileQueue = {};
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
        if (mask2DExtent && !mask2DExtent.intersects(this._extent2D)) {
            this.completeRender();
            return;
        }
        if (!this._tileRended) {
            this._tileRended = {};
        }
        const tileRended = this._tileRended,
            tiles = tileGrid['tiles'],
            tileCache = this._tileCache,
            tileSize = layer.getTileSize(),
            zoom = map.getZoom();

        this._tileZoom = tileGrid.zoom;
        this._tileRended = {};
        this._tileQueue = {};

        if (!this.canvas) {
            this.createCanvas();
        } else {
            // reset current transformation matrix to the identity matrix
            this.resetCanvasTransform();
        }
        this._drawBackground();
        this._retireLoadingTiles();
        //visit all the tiles
        this._totalTileToLoad = this._tileToLoadCounter = 0;
        let fading = false;
        for (let i = tiles.length - 1; i >= 0; i--) {
            const tile = tiles[i],
                tileId = tiles[i]['id'];
            if (zoom === this._tileZoom) {
                const tile2DExtent = new PointExtent(tile['point'], tile['point'].add(tileSize.toPoint()));
                if (!this._extent2D.intersects(tile2DExtent) || (mask2DExtent && !mask2DExtent.intersects(tile2DExtent))) {
                    continue;
                }
            }
            //load tile in cache at first if it has.
            const cached = tileRended[tileId] || (tileCache ? tileCache.get(tileId) : null);
            this._totalTileToLoad++;
            if (this._tilesLoading && this._tilesLoading[tileId]) {
                this._tilesLoading[tileId].current = true;
            }
            if (cached) {
                this._drawTile(tile['point'], cached, tileId);
                if (this._getTileOpacity(cached) < 1) {
                    fading = true;
                }
                this._tileRended[tileId] = cached;
            } else {
                this._tileToLoadCounter++;
                this._tileQueue[tileId + '@' + tile['point'].toString()] = tile;
            }
        }
        this._abortLoading();
        if (this._tileToLoadCounter === 0) {
            if (!fading && !map.options['zoomBackground']) {
                delete this.background;
            }
            this.completeRender();
        } else {
            this._scheduleLoadTileQueue();
        }
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

    _scheduleLoadTileQueue() {
        this._loadTileQueue();
    }

    _loadTileQueue() {
        for (const p in this._tileQueue) {
            if (this._tileQueue.hasOwnProperty(p)) {
                const tileId = p.split('@')[0],
                    tile = this._tileQueue[p];
                delete this._tileQueue[p];
                if (!this._tileCache || !this._tileCache[tileId]) {
                    this._loadTile(tile);
                } else {
                    this._drawTileAndRequest(this._tileCache[tileId], tile);
                }
            }
        }
    }


    _loadTile(tile) {
        const crossOrigin = this.layer.options['crossOrigin'];
        const tileSize = this.layer.getTileSize();
        const tileImage = new Image();
        tileImage.width = tileSize['width'];
        tileImage.height = tileSize['height'];

        on(tileImage, 'load', this._onTileLoad.bind(this, tileImage, tile));
        on(tileImage, 'error', this._onTileError.bind(this, tileImage, tile));

        if (crossOrigin) {
            tileImage.crossOrigin = crossOrigin;
        }
        if (!this._tilesLoading) {
            this._tilesLoading = {};
        }
        this._tilesLoading[tile['id']] = tileImage;
        loadImage(tileImage, [tile['url']]);
    }

    _onTileLoad(tileImage, tileInfo) {
        const id = tileInfo['id'];
        if (!IS_NODE) {
            if (!this._tileRended) {
                // removed
                return;
            }
            if (this._tileCache) {
                this._tileCache.add(id, tileImage);
            }
            this._tileRended[id] = tileImage;
        }
        tileImage.loadTime = Date.now();
        delete this._tilesLoading[id];
        this._drawTileAndRequest(tileImage, tileInfo);
    }

    _onTileError(tileImage, tileInfo) {
        delete this._tilesLoading[tileInfo['id']];
        this._clearTileRectAndRequest(tileImage, tileInfo['z']);
    }

    _drawTile(point, tileImage, tileId) {
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
        if (opacity <= 0) {
            this.setToRedraw();
            return;
        } else if (opacity < 1) {
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
        tileImage = null;
    }

    _getTileOpacity(tile) {
        return Math.min(1, (Date.now() - tile.loadTime) / 200);
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
        this._tileToLoadCounter--;
        const point = tileInfo['point'];
        this._drawTile(point, tileImage, id);

        if (!IS_NODE) {
            this.setCanvasUpdated();
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
        delete this._tileZoom;
    }

    _retireLoadingTiles() {
        if (this._tilesLoading) {
            for (const p in this._tilesLoading) {
                this._tilesLoading[p].current = false;
            }
        }
    }

    _abortLoading() {
        for (const i in this._tilesLoading) {
            const tile = this._tilesLoading[i];
            if (!tile.current) {
                tile.onload = falseFn;
                tile.onerror = falseFn;
                tile.src = emptyImageUrl;
                delete this._tilesLoading[i];
            }
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
