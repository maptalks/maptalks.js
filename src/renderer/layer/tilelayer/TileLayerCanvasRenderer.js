import {
    IS_NODE,
    loadImage
} from 'core/util';
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
        const map = this.getMap();
        if (map.getPitch()) {
            if (console) {
                console.warn('TileLayer with canvas renderer can\'t be pitched, use dom renderer (\'renderer\' : \'dom\') instead.');
            }
            this.clear();
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

        if (!this.canvas) {
            this.createCanvas();
        }
        // reset current transformation matrix to the identity matrix
        this.context.setTransform(1, 0, 0, 1, 0, 0);

        //visit all the tiles
        this._totalTileToLoad = this._tileToLoadCounter = 0;
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
        } else if (!this.getMap().isInteracting()) {
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
        if (map.isDragRotating()) {
            return true;
        }
        if (map.isZooming()) {
            return false;
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
                const tileId = p.split('@')[0],
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
        let x = cp.x,
            y = cp.y;
        if (transformed) {
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
            tileSize['width'], tileSize['height']);
        if (this.layer.options['debug']) {
            const p = new Point(x, y);
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
            ctx.restore();
        }
        if (transformed) {
            ctx.restore();
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
        const zoom = this._tileZoom;
        if (zoom !== tileImage[this.propertyOfTileZoom]) {
            return;
        }
        this._tileToLoadCounter--;
        const point = tileImage[this.propertyOfPointOnTile];
        this._drawTile(point, tileImage);

        if (!IS_NODE) {
            // const tileSize = this.layer.getTileSize();
            // const mapExtent = this.getMap()._get2DExtent();
            // if (mapExtent.intersects(new PointExtent(point, point.add(tileSize['width'], tileSize['height'])))) {
            this.setCanvasUpdated();
            // }
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
}

TileLayer.registerRenderer('canvas', TileLayerRenderer);
