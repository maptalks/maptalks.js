import {
    IS_NODE,
    loadImage,
    emptyImageUrl,
    now
} from '../../../core/util';
import Browser from '../../../core/Browser';
import Canvas2D from '../../../core/Canvas';
import TileLayer from '../../../layer/tile/TileLayer';
import CanvasRenderer from '../CanvasRenderer';
import Point from '../../../geo/Point';

/**
 * @classdesc
 * Renderer class based on HTML5 Canvas2D for TileLayers
 * @class
 * @protected
 * @memberOf renderer
 * @extends {renderer.CanvasRenderer}
 */
class TileLayerCanvasRenderer extends CanvasRenderer {

    /**
     *
     * @param {TileLayer} layer - TileLayer to render
     */
    constructor(layer) {
        super(layer);
        this._tileRended = {};
        this._tileLoading = {};
    }

    prepareRender() {
        super.prepareRender();
        const tileZoom = this.layer._getTileZoom();
        const map = this.getMap();
        if (this._shouldSaveBack() && (map.isZooming() && (map.isMoving() || map.isRotating())) && this._tileZoom !== tileZoom) {
            this._saveBackground();
            this._backRefreshed = true;
        }
    }

    draw() {
        const map = this.getMap();
        if (!this.isDrawable()) {
            return;
        }
        const mask2DExtent = this.prepareCanvas();
        if (mask2DExtent) {
            if (!mask2DExtent.intersects(this._extent2D)) {
                this.completeRender();
                return;
            }
        }
        const layer = this.layer;
        const tileGrid = layer.getTiles();
        if (!tileGrid) {
            this.completeRender();
            return;
        }
        const tiles = tileGrid['tiles'];

        this._tileZoom = tileGrid.zoom;

        // reset current transformation matrix to the identity matrix
        this.resetCanvasTransform();
        this._drawBackground();
        const loadingCount = this._markTiles(),
            tileLimit = this._getTileLimitOnInteracting();

        this._tileCountToLoad = 0;
        let loading = false;
        //visit all the tiles
        const tileQueue = {};
        for (let i = tiles.length - 1; i >= 0; i--) {
            const tile = tiles[i],
                tileId = tiles[i]['id'];
            //load tile in cache at first if it has.
            const cached = this._getCachedTile(tileId);
            if (this._isLoadingTile(tileId)) {
                loading = true;
                continue;
            }
            if (cached) {
                if (!loading && this.getTileOpacity(cached.image) < 1) {
                    loading = true;
                }
                this.drawTile(cached.info, cached.image);
            } else {
                loading = true;
                const hitLimit = tileLimit && (this._tileCountToLoad + loadingCount[0]) > tileLimit;
                if (!hitLimit) {
                    this._tileCountToLoad++;
                    tileQueue[tileId + '@' + tile['point'].toArray().join()] = tile;
                }
            }
        }
        if (this._tileCountToLoad === 0) {
            if (!loading) {
                if (this.background && !map.isAnimating()) {
                    this.setToRedraw();
                    delete this.background;
                }
                this.completeRender();
            }
        } else {
            this.loadTileQueue(tileQueue);
        }
        this._retireTiles();
    }

    drawOnInteracting() {
        const map = this.getMap();
        if (map.isZooming() && !map.isMoving() && !map.isRotating()) {
            this._drawBackground();
            this.completeRender();
        } else {
            this.draw();
        }
    }

    // Unlike other layers, TileLayerCanvasRenderer is special in drawing on interacting:
    // 1. it doesn't need to redraw on zooming and moving, map just merges layer's canvas as it is into map canvas with necessary transforming.
    // 2. it needs to redraw on drag rotating: when rotating, every tile needs to be rotated.
    needToRedraw() {
        const map = this.getMap();
        if (map.getPitch()) {
            return super.needToRedraw();
        }
        if (map.isRotating()) {
            return true;
        }
        if (map.isZooming()) {
            return !!this.layer.options['forceRenderOnZooming'];
        }
        if (map.isMoving()) {
            return !!this.layer.options['forceRenderOnMoving'];
        }
        return super.needToRedraw();
    }

    hitDetect() {
        return false;
    }

    // limit tile number to load when map is interacting
    _getTileLimitOnInteracting() {
        if (this.getMap().isInteracting()) {
            return 3;
        }
        return 0;
    }

    isDrawable() {
        if (this.getMap().getPitch()) {
            if (console) {
                console.warn('TileLayer with canvas renderer can\'t be pitched, use gl renderer (\'renderer\' : \'gl\') instead.');
            }
            this.clear();
            return false;
        }
        return true;
    }

    clear() {
        this._clearCaches();
        this._tileRended = {};
        this._tileLoading = {};
        super.clear();
    }

    _isLoadingTile(tileId) {
        return !!this._tileLoading[tileId];
    }

    clipCanvas(context) {
        const mask = this.layer.getMask();
        if (!mask) {
            return this._clipByPitch(context);
        }
        return super.clipCanvas(context);
    }

    // clip canvas to avoid rough edge of tiles
    _clipByPitch(ctx) {
        const map = this.getMap();
        if (map.getPitch() <= map.options['maxVisualPitch']) {
            return false;
        }
        const clipExtent = map.getContainerExtent();
        ctx.save();
        ctx.strokeStyle = 'rgba(0, 0, 0, 0)';
        ctx.beginPath();
        ctx.rect(0, Math.ceil(clipExtent.ymin), Math.ceil(clipExtent.getWidth()), Math.ceil(clipExtent.getHeight()));
        ctx.stroke();
        ctx.clip();
        return true;
    }

    loadTileQueue(tileQueue) {
        for (const p in tileQueue) {
            if (tileQueue.hasOwnProperty(p)) {
                const tile = tileQueue[p];
                const tileImage = this.loadTile(tile);
                if (!tileImage.loadTime) {
                    // tile image's loading may not be async
                    tileImage.current = true;
                    this._tileLoading[tile['id']] = tileImage;
                }
            }
        }
    }

    loadTile(tile) {
        const tileSize = this.layer.getTileSize();
        const tileImage = new Image();

        tileImage.width = tileSize['width'];
        tileImage.height = tileSize['height'];

        tileImage.onload = this.onTileLoad.bind(this, tileImage, tile);
        tileImage.onerror = this.onTileError.bind(this, tileImage, tile);

        const crossOrigin = this.layer.options['crossOrigin'];
        if (crossOrigin) {
            tileImage.crossOrigin = crossOrigin;
        }
        this.loadTileImage(tileImage, tile['url']);
        return tileImage;
    }

    loadTileImage(tileImage, url) {
        return loadImage(tileImage, [url]);
    }

    onTileLoad(tileImage, tileInfo) {
        if (!this.layer) {
            return;
        }
        const id = tileInfo['id'];
        if (!this._tileRended) {
            // removed
            return;
        }
        tileImage.loadTime = now();
        delete this._tileLoading[id];
        this._addTileToCache(tileInfo, tileImage);
        this.setToRedraw();
        /**
         * tileload event, fired when tile is loaded.
         *
         * @event TileLayer#tileload
         * @type {Object}
         * @property {String} type - tileload
         * @property {TileLayer} target - tile layer
         * @property {Object} tileInfo - tile info
         * @property {Image} tileImage - tile image
         */
        this.layer.fire('tileload', { tile : tileInfo, tileImage: tileImage });
    }

    onTileError(tileImage, tileInfo) {
        if (!this.layer) {
            return;
        }
        if (tileImage instanceof Image) {
            tileImage.onload = falseFn;
            tileImage.onerror = falseFn;
            tileImage.src = emptyImageUrl;
        }
        tileImage.loadTime = 0;
        delete this._tileLoading[tileInfo['id']];
        this._addTileToCache(tileInfo, tileImage);
        this.setToRedraw();
        /**
         * tileerror event, fired when tile loading has error.
         *
         * @event TileLayer#tileerror
         * @type {Object}
         * @property {String} type - tileerror
         * @property {TileLayer} target - tile layer
         * @property {Object} tileInfo - tile info
         */
        this.layer.fire('tileerror', { tile : tileInfo });
    }

    drawTile(tileInfo, tileImage) {
        if (!tileImage || !this.getMap()) {
            return;
        }
        const point = tileInfo.point,
            tileZoom = tileInfo.z,
            tileId = tileInfo.id;
        const map = this.getMap(),
            tileSize = tileInfo.size,
            zoom = map.getZoom(),
            ctx = this.context,
            cp = map._pointToContainerPoint(point, tileZoom),
            bearing = map.getBearing(),
            transformed = bearing || zoom !== tileZoom;
        const opacity = this.getTileOpacity(tileImage);
        const alpha = ctx.globalAlpha;
        if (opacity < 1) {
            ctx.globalAlpha = opacity;
            this.setToRedraw();
        }
        if (!transformed) {
            cp._round();
        }
        let x = cp.x,
            y = cp.y;
        let w = tileSize[0], h = tileSize[1];
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
        Canvas2D.image(ctx, tileImage, x, y, w, h);
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
            Canvas2D.fillText(ctx, 'x:' + xyz[2] + ', y:' + xyz[1] + ', z:' + xyz[3], p.add(10, 20), color);
            Canvas2D.drawCross(ctx, p.add(w / 2, h / 2), 2, color);
            ctx.restore();
        }
        if (transformed) {
            ctx.restore();
        }
        if (ctx.globalAlpha !== alpha) {
            ctx.globalAlpha = alpha;
        }
        this.setCanvasUpdated();
    }

    _getCachedTile(tileId) {
        const cached = this._tileRended[tileId];
        if (this._tileRended[tileId]) {
            this._tileRended[tileId].current = true;
        }
        if (this._tileLoading && this._tileLoading[tileId]) {
            this._tileLoading[tileId].current = true;
        }
        return cached;
    }

    _addTileToCache(tileInfo, tileImage) {
        this._tileRended[tileInfo.id] = {
            image : tileImage,
            current : true,
            info : tileInfo
        };
    }

    getTileOpacity(tileImage) {
        if (!this.layer.options['fadeAnimation']) {
            return 1;
        }
        return Math.min(1, (now() - tileImage.loadTime) / (1000 / 60 * 10));
    }

    onRemove() {
        this._clearCaches();
    }

    _clearCaches() {
        delete this._tileRended;
        delete this._tileZoom;
        delete this._tileLoading;
        delete this._backCanvas;
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
                this.deleteTile(tile);
                delete this._tileLoading[i];
            }
        }
        for (const i in this._tileRended) {
            const tile = this._tileRended[i];
            if (!tile.current) {
                this.deleteTile(tile.image);
                delete this._tileRended[i];
            }
        }
    }

    deleteTile(tile) {
        if (!tile) {
            return;
        }
        delete tile.onload;
        delete tile.onerror;
    }

    _drawBackground() {
        const ctx = this.context;
        const back = this.background;
        if (back && back.southWest && ctx) {
            const map = this.getMap();
            let scale = map._getResolution(back.zoom) / map._getResolution();
            const cp = map._pointToContainerPoint(back.southWest, back.zoom);
            const bearing = map.getBearing() - back.bearing;
            if (Browser.retina) {
                scale *= 1 / 2;
            }
            ctx.save();
            ctx.translate(cp.x, cp.y);
            if (bearing) {
                ctx.rotate(-bearing * Math.PI / 180);
            }
            ctx.scale(scale, scale);
            ctx.drawImage(back.canvas, 0, -back.canvas.height);
            ctx.restore();
        }
    }

    _saveBackground() {
        const map = this.getMap();
        if (!map || !this.canvas) {
            return;
        }
        if (!this._backCanvas) {
            this._backCanvas = Canvas2D.createCanvas(1, 1);
        }
        this.background = {
            canvas : Canvas2D.copy(this.canvas, this._backCanvas),
            zoom : map.getZoom(),
            southWest : this._southWest,
            bearing : map.getBearing()
        };
    }

    _shouldSaveBack() {
        const layer = this.layer,
            map = this.getMap();
        if (IS_NODE || !this.canvas) {
            return false;
        }
        if (layer === map.getBaseLayer() && map.options['zoomBackground']) {
            return true;
        }
        return layer.options['zoomBackground'];
    }

    onZoomStart(e) {
        if (this._shouldSaveBack() || this.layer.options['forceRenderOnZooming']) {
            this._saveBackground();
        }
        super.onZoomStart(e);
    }

    onZoomEnd(e) {
        if (this._shouldSaveBack() && this._backRefreshed) {
            const map = this.getMap();
            this._southWest = map._containerPointToPoint(new Point(0, map.height));
            this._saveBackground();
            delete this._backRefreshed;
        }
        this._markTiles();
        this._retireTiles();
        super.onZoomEnd(e);
    }
}

TileLayer.registerRenderer('canvas', TileLayerCanvasRenderer);

function falseFn() { return false; }

export default TileLayerCanvasRenderer;
