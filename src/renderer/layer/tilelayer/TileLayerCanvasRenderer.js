import {
    isNil,
    loadImage,
    emptyImageUrl,
    now,
    isFunction
} from '../../../core/util';
import Browser from '../../../core/Browser';
import Canvas2D from '../../../core/Canvas';
import TileLayer from '../../../layer/tile/TileLayer';
import CanvasRenderer from '../CanvasRenderer';
import Point from '../../../geo/Point';
import LruCache from '../../../core/util/LruCache';
import Canvas from '../../../core/Canvas';

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
        this._parentTiles = [];
        this._childTiles = [];
        this.tileCache = new LruCache(layer.options['maxCacheSize'], this.deleteTile.bind(this));
    }

    draw() {
        const map = this.getMap();
        if (!this.isDrawable()) {
            return;
        }
        const mask2DExtent = this.prepareCanvas();
        if (mask2DExtent) {
            if (!mask2DExtent.intersects(this.canvasExtent2D)) {
                this.completeRender();
                return;
            }
        }
        const layer = this.layer;
        const tileGrids = layer.getTiles().tileGrids;
        if (!tileGrids || !tileGrids.length) {
            this.completeRender();
            return;
        }

        let loadingCount = 0;
        let loading = false;
        const checkedTiles = {};
        const tiles = [],
            parentTiles = [], parentKeys = {},
            childTiles = [], childKeys = {},
            placeholders = [], placeholderKeys = {};
        //visit all the tiles
        const tileQueue = {};
        const preLoadingCount = this._markTiles(),
            loadingLimit = this._getLoadLimit();

        const l = tileGrids.length;

        // main tile grid is the last one (draws on top)
        this._tileZoom = tileGrids[0]['zoom'];
        this._tileOffset = tileGrids[0]['offset'];

        for (let i = 0; i < l; i++) {
            const tileGrid = tileGrids[i];
            const allTiles = tileGrid['tiles'];

            const placeholder = this._generatePlaceHolder(tileGrid.zoom);

            for (let i = 0, l = allTiles.length; i < l; i++) {
                const tile = allTiles[i],
                    tileId = tile['id'];
                //load tile in cache at first if it has.
                const cached = this._getCachedTile(tileId);
                let tileLoading = false;
                if (this._isLoadingTile(tileId)) {
                    tileLoading = loading = true;
                    this.tilesLoading[tileId].current = true;
                } else if (cached) {
                    if (this.getTileOpacity(cached.image) < 1) {
                        tileLoading = loading = true;
                    }
                    tiles.push(cached);
                } else {
                    tileLoading = loading = true;
                    const hitLimit = loadingLimit && (loadingCount + preLoadingCount[0]) > loadingLimit;
                    if (!hitLimit && (!map.isInteracting() || (map.isMoving() || map.isRotating()))) {
                        loadingCount++;
                        tileQueue[tileId + '@' + tile['point'].toArray().join()] = tile;
                    }
                }
                if (!tileLoading) continue;
                if (checkedTiles[tile.dupKey]) {
                    continue;
                }

                checkedTiles[tile.dupKey] = 1;
                if (placeholder && !placeholderKeys[tile.dupKey]) {
                    //tell gl renderer not to bind gl buffer with image
                    tile.cache = false;
                    placeholders.push({
                        image : placeholder,
                        info : tile
                    });

                    placeholderKeys[tile.dupKey] = 1;
                }

                const parentTile = this._findParentTile(tile);
                if (parentTile) {
                    const dupKey = parentTile.info.dupKey;
                    if (parentKeys[dupKey] === undefined) {
                        parentKeys[dupKey] = parentTiles.length;
                        parentTiles.push(parentTile);
                    }/* else {
                        //replace with parentTile of above tiles
                        parentTiles[parentKeys[dupKey]] = parentTile;
                    } */
                } else {
                    const children = this._findChildTiles(tile);
                    if (children.length) {
                        children.forEach(c => {
                            if (!childKeys[c.info.dupKey]) {
                                childTiles.push(c);
                                childKeys[c.info.dupKey] = 1;
                            }
                        });
                    }
                }
            }
        }

        this._drawTiles(tiles, parentTiles, childTiles, placeholders);
        if (!loadingCount) {
            if (!loading) {
                //redraw to remove parent tiles if any left in last paint
                if (!map.isAnimating() && (this._parentTiles.length || this._childTiles.length)) {
                    this._parentTiles = [];
                    this._childTiles = [];
                    this.setToRedraw();
                }
                this.completeRender();
            }
        } else {
            this.loadTileQueue(tileQueue);
        }
        this._retireTiles();
    }

    isTileCachedOrLoading(tileId) {
        return this.tilesLoading[tileId] || this.tilesInView[tileId] || this.tileCache.has(tileId);
    }

    _drawTiles(tiles, parentTiles, childTiles, placeholders) {
        if (parentTiles.length) {
            //closer the latter (to draw on top)
            parentTiles.sort((t1, t2) => Math.abs(t2.info.z - this._tileZoom) - Math.abs(t1.info.z - this._tileZoom));
            this._parentTiles = parentTiles;
        }
        if (childTiles.length) {
            this._childTiles = childTiles;
        }

        const context = { tiles, parentTiles, childTiles };
        this.onDrawTileStart(context);

        this._parentTiles.forEach(t => this._drawTileAndCache(t));
        this._childTiles.forEach(t => this._drawTileOffset(t.info, t.image));

        placeholders.forEach(t => this._drawTileOffset(t.info, t.image));

        const layer = this.layer,
            map = this.getMap();
        if (!layer.options['cascadeTiles'] || map.getPitch() <= layer.options['minPitchToCascade']) {
            tiles.forEach(t => this._drawTileAndCache(t));
        } else {
            //write current tiles and update stencil buffer to clip parent|child tiles with current tiles
            this.writeZoomStencil();
            let started = false;
            for (let i = 0, l = tiles.length; i < l; i++) {
                if (tiles[i].info.z !== this._tileZoom) {
                    if (!started) {
                        this.startZoomStencilTest();
                        started = true;
                    } else {
                        this.resumeZoomStencilTest();
                    }
                } else if (started) {
                    this.pauseZoomStencilTest();
                }
                this._drawTileAndCache(tiles[i]);
            }
            this.endZoomStencilTest();
        }

        this.onDrawTileEnd(context);

    }

    writeZoomStencil() {}
    startZoomStencilTest() {}
    endZoomStencilTest() {}
    pauseZoomStencilTest() {}
    resumeZoomStencilTest() {}

    onDrawTileStart() {}
    onDrawTileEnd() {}

    _drawTileOffset(info, image) {
        const offset = this._tileOffset;
        if (!offset[0] && !offset[1]) {
            this.drawTile(info, image);
            return;
        }
        const map = this.getMap();
        //tempararily add offset to tile info
        const scale = map._getResolution(this._tileZoom) / map._getResolution(info.z);
        offset[0] *= scale;
        offset[1] *= scale;
        info.point._sub(offset);
        info.extent2d._sub(offset);
        this.drawTile(info, image);
        //restore
        info.point._add(offset);
        info.extent2d._add(offset);
        offset[0] /= scale;
        offset[1] /= scale;
    }

    _drawTileAndCache(tile) {
        tile.current = true;
        this.tilesInView[tile.info.id] = tile;
        this._drawTileOffset(tile.info, tile.image);
        this.tileCache.add(tile.info.id, tile);
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
    _getLoadLimit() {
        if (this.getMap().isInteracting()) {
            return this.layer.options['loadingLimitOnInteracting'];
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
        this._retireTiles(true);
        this.tileCache.reset();
        this.tilesInView = {};
        this.tilesLoading = {};
        this._parentTiles = [];
        this._childTiles = [];
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

        this.loadTileImage(tileImage, tile['url']);
        return tileImage;
    }

    loadTileImage(tileImage, url) {
        const crossOrigin = this.layer.options['crossOrigin'];
        if (!isNil(crossOrigin)) {
            tileImage.crossOrigin = crossOrigin;
        }
        return loadImage(tileImage, [url]);
    }

    abortTileLoading(tileImage) {
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
            this.abortTileLoading(tileImage);
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

    _findChildTiles(info) {
        const layer = this._getLayerOfTile(info.layer);
        if (!layer.options['background']) {
            return [];
        }
        const map = this.getMap();
        const children = [];
        const min = info.extent2d.getMin(),
            max = info.extent2d.getMax(),
            pmin = layer._project(map._pointToPrj(min, info.z)),
            pmax = layer._project(map._pointToPrj(max, info.z));
        const zoomDiff = 3;
        for (let i = 1; i < zoomDiff; i++) {
            this._findChildTilesAt(children, pmin, pmax, layer, info.z + i);
        }

        return children;
    }

    _findChildTilesAt(children, pmin, pmax, layer, childZoom) {
        const zoomOffset = layer.options['zoomOffset'];
        const layerId = layer.getId(),
            res = layer.getSpatialReference().getResolution(childZoom + zoomOffset);
        if (!res) {
            return;
        }
        const dmin = layer._getTileConfig().getTileIndex(pmin, res),
            dmax = layer._getTileConfig().getTileIndex(pmax, res);
        const sx = Math.min(dmin.idx, dmax.idx), ex = Math.max(dmin.idx, dmax.idx);
        const sy = Math.min(dmin.idy, dmax.idy), ey = Math.max(dmin.idy, dmax.idy);
        let id, tile;
        for (let i = sx; i < ex; i++) {
            for (let ii = sy; ii < ey; ii++) {
                id = layer._getTileId({ idx : i, idy : ii }, childZoom + zoomOffset, layerId);
                if (this.tileCache.has(id)) {
                    tile = this.tileCache.getAndRemove(id);
                    children.push(tile);
                    this.tileCache.add(id, tile);
                }
            }
        }
    }

    _findParentTile(info) {
        const map = this.getMap(),
            layer = this._getLayerOfTile(info.layer);
        if (!layer.options['background']) {
            return null;
        }
        const sr = layer.getSpatialReference();
        const d = sr.getZoomDirection(),
            zoomOffset = layer.options['zoomOffset'],
            zoomDiff = layer.options['backgroundZoomDiff'];
        const center = info.extent2d.getCenter(),
            prj = layer._project(map._pointToPrj(center, info.z));
        for (let diff = 1; diff <= zoomDiff; diff++) {
            const z = info.z - d * diff;
            const res = sr.getResolution(z + zoomOffset);
            if (!res) continue;
            const tileIndex = layer._getTileConfig().getTileIndex(prj, res);
            const id = layer._getTileId(tileIndex, z + zoomOffset, info.layer);
            if (this.tileCache.has(id)) {
                const tile = this.tileCache.getAndRemove(id);
                this.tileCache.add(id, tile);
                return tile;
            }
        }
        return null;
    }

    _getLayerOfTile(layerId) {
        return this.layer.getChildLayer ? this.layer.getChildLayer(layerId) : this.layer;
    }

    _getCachedTile(tileId) {
        const tilesInView = this.tilesInView;
        let cached = this.tileCache.getAndRemove(tileId);
        if (cached) {
            tilesInView[tileId] = cached;
            const tilesLoading = this.tilesLoading;
            if (tilesLoading && tilesLoading[tileId]) {
                tilesLoading[tileId].current = false;
                this.abortTileLoading(tilesLoading[tileId]);
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
        if (!this.layer.options['fadeAnimation'] || !tileImage.loadTime) {
            return 1;
        }
        return Math.min(1, (now() - tileImage.loadTime) / (1000 / 60 * 10));
    }

    onRemove() {
        this.clear();
        delete this.tileCache;
        delete this._tilePlaceHolder;
        super.onRemove();
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
                    this.abortTileLoading(tile.image);
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
        tile.image.onload = null;
        tile.image.onerror = null;
    }

    _generatePlaceHolder(z) {
        const map = this.getMap();
        const placeholder = this.layer.options['placeholder'];
        if (!placeholder || map.getPitch()) {
            return null;
        }
        const tileSize = this.layer.getTileSize(),
            scale = map._getResolution(z) / map._getResolution(),
            canvas = this._tilePlaceHolder = this._tilePlaceHolder || Canvas.createCanvas(1, 1);
        canvas.width = tileSize.width * scale;
        canvas.height = tileSize.height * scale;
        if (isFunction(placeholder)) {
            placeholder(canvas);
        } else {
            defaultPlaceholder(canvas);
        }
        return canvas;
    }
}

TileLayer.registerRenderer('canvas', TileLayerCanvasRenderer);

function falseFn() { return false; }

function defaultPlaceholder(canvas) {
    const ctx = canvas.getContext('2d'),
        cw = canvas.width, ch = canvas.height,
        w = cw / 16, h = ch / 16;
    ctx.beginPath();
    for (let i = 0; i < 16; i++) {
        ctx.moveTo(0, i * h);
        ctx.lineTo(cw, i * h);
        ctx.moveTo(i * w, 0);
        ctx.lineTo(i * w, ch);
    }
    ctx.strokeStyle = 'rgba(180, 180, 180, 0.1)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.beginPath();
    const path = [
        [0, 0], [cw, 0], [0, ch], [cw, ch], [0, 0], [0, ch], [cw, 0], [cw, ch], [0, ch / 2], [cw, ch / 2], [cw / 2, 0], [cw / 2, ch]
    ];
    for (let i = 1; i < path.length; i += 2) {
        ctx.moveTo(path[i - 1][0], path[i - 1][1]);
        ctx.lineTo(path[i][0], path[i][1]);
    }
    ctx.lineWidth = 1 * 4;
    ctx.stroke();
}

export default TileLayerCanvasRenderer;
