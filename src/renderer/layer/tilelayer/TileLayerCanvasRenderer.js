import {
    loadImage,
    emptyImageUrl,
    now
} from '../../../core/util';
import Browser from '../../../core/Browser';
import Canvas2D from '../../../core/Canvas';
import TileLayer from '../../../layer/tile/TileLayer';
import CanvasRenderer from '../CanvasRenderer';
import Point from '../../../geo/Point';
import LruCache from '../../../core/util/LruCache';

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
        this.tilesInView = {};
        this.tilesLoading = {};
        this.tileCache = new LruCache(layer.options['maxCacheSize'], this.deleteTile.bind(this));
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
        const allTiles = tileGrid['tiles'];

        this._tileZoom = tileGrid.zoom;

        // reset current transformation matrix to the identity matrix
        this.resetCanvasTransform();
        const loadingCount = this._markTiles(),
            tileLimit = this._getTileLimitOnInteracting();

        this._tileCountToLoad = 0;
        let loading = false;
        const tiles = [], parentTiles = [], parentKeys = {};
        //visit all the tiles
        const tileQueue = {};
        for (let i = allTiles.length - 1; i >= 0; i--) {
            const tile = allTiles[i],
                tileId = allTiles[i]['id'];
            //load tile in cache at first if it has.
            const cached = this._getCachedTile(tileId);
            let tileIsLoading = false;
            if (this._isLoadingTile(tileId)) {
                tileIsLoading = loading = true;
                this.tilesLoading[tileId].current = true;
            } else if (cached) {
                if (this.getTileOpacity(cached.image) < 1) {
                    tileIsLoading = loading = true;
                }
                tiles.push(cached);
                this.tileCache.add(tileId, cached);
            } else {
                tileIsLoading = loading = true;
                const hitLimit = tileLimit && (this._tileCountToLoad + loadingCount[0]) > tileLimit;
                if (!hitLimit && (!map.isInteracting() || (map.isMoving() || map.isRotating()))) {
                    this._tileCountToLoad++;
                    tileQueue[tileId + '@' + tile['point'].toArray().join()] = tile;
                }
            }

            if (tileIsLoading) {
                const parentTile = this.findParentTile(tile);
                if (parentTile && !parentKeys[parentTile.info.id]) {
                    parentKeys[parentTile.info.id] = 1;
                    parentTiles.push(parentTile);
                }
            }
        }
        this._drawTiles(tiles, parentTiles);
        if (this._tileCountToLoad === 0) {
            if (!loading) {
                //when map is animating, zooming session doesn't complete yet
                if (this._zoomSession && !map.isAnimating()) {
                    delete this._zoomSession;
                }
                this.completeRender();
            }
        } else {
            this.loadTileQueue(tileQueue);
        }
        this._retireTiles();
    }

    _drawTiles(tiles, parentTiles) {
        if (parentTiles.length > 0) {
            parentTiles.sort((t1, t2) => Math.abs(t1.info.z - this._tileZoom) - Math.abs(t2.info.z - this._tileZoom));
            parentTiles.forEach(t => this._drawTileAndRecord(t));
        }
        tiles.forEach(t => this._drawTileAndRecord(t));
        if (this.layer.options['background'] && tiles.length === 0 && parentTiles.length === 0) {
            const keys = Object.keys(this.tilesInView);
            const extent = this.getMap().getContainerExtent();
            keys.forEach(key => {
                const tile = this.tilesInView[key];
                if (this.layer._isTileInExtent(tile.info, extent)) {
                    this._drawTileAndRecord(tile);
                }
            });
        }
        // console.log(Object.keys(this.tilesInView).length);
        // console.log(tiles.length, parentTiles.length);
    }

    _drawTileAndRecord(tile) {
        tile.current = true;
        this.tilesInView[tile.info.id] = tile;
        this.drawTile(tile.info, tile.image);
    }

    drawOnInteracting() {
        this.draw();
    }

    needToRedraw() {
        const map = this.getMap();
        if (map.getPitch()) {
            return super.needToRedraw();
        }
        if (map.isRotating() || map.isZooming()) {
            return true;
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
        this.tilesInView = {};
        this.tilesLoading = {};
        this.tileCache.reset();
        super.clear();
    }

    _isLoadingTile(tileId) {
        return !!this.tilesLoading[tileId];
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
        if (!this.layer.options['clipByPitch']) {
            return false;
        }
        const clipExtent = map.getContainerExtent();
        const r = Browser.retina ? 2 : 1;
        ctx.save();
        ctx.strokeStyle = 'rgba(0, 0, 0, 0)';
        ctx.beginPath();
        ctx.rect(0, Math.ceil(clipExtent.ymin) * r, Math.ceil(clipExtent.getWidth()) * r, Math.ceil(clipExtent.getHeight()) * r);
        ctx.stroke();
        ctx.clip();
        return true;
    }

    loadTileQueue(tileQueue) {
        for (const p in tileQueue) {
            if (tileQueue.hasOwnProperty(p)) {
                const tile = tileQueue[p];
                const tileImage = this.loadTile(tile);
                if (tileImage.loadTime === undefined) {
                    // tile image's loading may not be async
                    this.tilesLoading[tile['id']] = {
                        image : tileImage,
                        current : true,
                        info : tile
                    };
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

    cancelTileLoading(tileImage) {
        if (!tileImage) return;
        tileImage.onload = falseFn;
        tileImage.onerror = falseFn;
        tileImage.src = emptyImageUrl;
    }

    onTileLoad(tileImage, tileInfo) {
        if (!this.layer) {
            return;
        }
        const id = tileInfo['id'];
        if (!this.tilesInView) {
            // removed
            return;
        }
        tileImage.loadTime = now();
        delete this.tilesLoading[id];
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
            this.cancelTileLoading(tileImage);
        }
        tileImage.loadTime = 0;
        delete this.tilesLoading[tileInfo['id']];
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
            if (zoom !== tileZoom) {
                const scale = map._getResolution(tileZoom) / map._getResolution();
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

    findParentTile(info) {
        const map = this.getMap();
        if (!this.layer.options['background']) {
            return null;
        }
        const d = map.getSpatialReference().getZoomDirection(),
            layer = this.layer,
            zoomDiff = layer.options['backgroundZoomDiff'];
        const center = info.extent2d.getCenter(),
            prj = map._pointToPrj(center, info.z);
        for (let diff = 1; diff <= zoomDiff; diff++) {
            const z = info.z - d * diff;
            const res = map.getResolution(z);
            const tileIndex = layer._getTileConfig().getTileIndex(prj, res);
            const id = layer._getTileId(tileIndex, z);
            if (this.tileCache.has(id)) {
                const tile = this.tileCache.getAndRemove(id);
                this.tileCache.add(id, tile);
                return tile;
            }
        }
        return null;
    }

    _getCachedTile(tileId) {
        const tilesInView = this.tilesInView;
        let cached = this.tileCache.getAndRemove(tileId);
        if (cached) {
            tilesInView[tileId] = cached;
            const tilesLoading = this.tilesLoading;
            if (tilesLoading && tilesLoading[tileId]) {
                tilesLoading[tileId].current = false;
                this.cancelTileLoading(tilesLoading[tileId]);
                delete tilesLoading[tileId];
            }
        } else {
            cached = tilesInView[tileId];
        }
        return cached;
    }

    _addTileToCache(tileInfo, tileImage) {
        this.tilesInView[tileInfo.id] = {
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
        this.tileCache.reset();
        this._clearCaches();
    }

    _clearCaches() {
        delete this.tilesInView;
        delete this._tileZoom;
        delete this.tilesLoading;
        delete this._backCanvas;
    }

    _markTiles() {
        let a = 0, b = 0;
        if (this.tilesLoading) {
            for (const p in this.tilesLoading) {
                this.tilesLoading[p].current = false;
                a++;
            }
        }
        if (this.tilesInView) {
            for (const p in this.tilesInView) {
                this.tilesInView[p].current = false;
                b++;
            }
        }
        return [a, b];
    }

    _retireTiles(force) {
        for (const i in this.tilesLoading) {
            const tile = this.tilesLoading[i];
            if (force || !tile.current) {
                // abort loading tiles
                if (tile.image) {
                    this.cancelTileLoading(tile.image);
                }
                this.deleteTile(tile);
                delete this.tilesLoading[i];
            }
        }
        for (const i in this.tilesInView) {
            const tile = this.tilesInView[i];
            if (!tile.current) {
                delete this.tilesInView[i];
                if (!this.tileCache.has(i)) {
                    this.deleteTile(tile);
                }
            }
        }
    }

    deleteTile(tile) {
        if (!tile || !tile.image) {
            return;
        }
        delete tile.image.onload;
        delete tile.image.onerror;
    }

    onZoomStart(e) {
        this._zoomSession = 1;
        super.onZoomStart(e);
    }
}

TileLayer.registerRenderer('canvas', TileLayerCanvasRenderer);

function falseFn() { return false; }

export default TileLayerCanvasRenderer;
