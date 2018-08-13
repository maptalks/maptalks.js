//--------------------------------------------------------------
//THIS RENDERER IS NOT USED ANYMORE AND REPLACED BY GL RENDERER.
//--------------------------------------------------------------
//
//
//------------------
// It's a little bit tricky to test tilelayer with CI.
// run gulp test
// and test tilelayer manually at http://localhost:20000/tilelayer.html
//------------------
import {
    sign,
    join,
    requestAnimFrame,
    cancelAnimFrame,
    emptyImageUrl,
    now
} from '../../../core/util';
import * as mat4 from '../../../core/util/mat4';
import {
    on,
    createEl,
    setTransformMatrix,
    removeTransform,
    removeDomNode,
    setOpacity,
    TRANSFORM,
    CSSFILTER
} from '../../../core/util/dom';
import Class from '../../../core/Class';
import Browser from '../../../core/Browser';
import TileLayer from '../../../layer/tile/TileLayer';


const POSITION0 = 'position:absolute;';

/**
 * @classdesc
 * @deprecated
 *
 * A renderer based on HTML Doms for TileLayers.
 * It is implemented based on Leaflet's GridLayer.
 *
 * It is deprecated and replaced by {TileLayerGLRenderer}
 * @class
 * @protected
 * @memberOf renderer
 * @extends {Class}
 */
class TileLayerDomRenderer extends Class {

    /**
     * @param {TileLayer} layer - layer of the renderer
     */
    constructor(layer) {
        super();
        this.layer = layer;
        this._tiles = {};
        this._fadeAnimated = true;
    }

    getMap() {
        if (!this.layer) {
            return null;
        }
        return this.layer.getMap();
    }

    show() {
        if (this._container) {
            this.render();
            this._show();
        }
    }

    hide() {
        if (this._container) {
            this._hide();
            this.clear();
        }
    }

    remove() {
        this._abortLoading();
        delete this._tiles;
        delete this.layer;
        this._removeLayerContainer();
    }

    clear() {
        this._removeAllTiles();
        this._clearLayerContainer();
    }

    setZIndex(z) {
        this._zIndex = z;
        if (this._container) {
            this._container.style.zIndex = z;
        }
    }

    prepareRender() {
    }

    render() {
        this._renderTiles();
    }

    drawOnInteracting() {
        const map = this.getMap();
        if (!map) {
            return;
        }
        const isAnim = map._animPlayer && map._animPlayer.duration >= this.layer.options['durationToAnimate'];
        if (isAnim) {
            this._fadeAnimated = false;
            const tileZoom = this.layer._getTileZoom();
            if (map.isMoving()) {
                const nowTime = now();
                if (this._renderTime && nowTime - this._renderTime > this.layer.options['updateIntervalOnAnimating']) {
                    this._abortLoading(false);
                    this._renderTiles();
                } else {
                    this._renderTiles(true);
                }
                this._pruneLevels();
            } else if (map.isZooming()) {
                if (!this._curAnimZoom) {
                    this._curAnimZoom = this._startZoom;
                }
                const gap = 2;
                const s = sign(this._endZoom - this._startZoom);
                const next = this._curAnimZoom + gap * s;

                if (this._endZoom < this._startZoom && next === tileZoom) {
                    this._abortLoading(false);
                    this._renderTiles();
                    this._pruneLevels();
                    this._curAnimZoom = this._tileZoom;

                    const nextZoom = this._curAnimZoom + gap * s;
                    if (nextZoom !== this._tileZoom && nextZoom >= this._endZoom) {
                        const curTilesCount = this.layer.getTiles().tiles.length;
                        const nextGrid = this.layer.getTiles(nextZoom);
                        this._preloadTiles(nextGrid.tiles.slice(0, curTilesCount));
                    }
                } else {
                    this._drawOnZooming();
                }
            } else if (map.isRotating()) {
                this._drawOnDragRotating();
            }
        } else if (map.isZooming()) {
            this._drawOnZooming();
        } else if (map.isRotating()) {
            this._drawOnDragRotating();
        } else if (map.isMoving()) {
            this._drawOnMoving();
        }
    }

    _preloadTiles(tiles) {
        this._preLoaded = true;
        tiles.forEach(t => {
            new Image().src = t.url;
        });
    }

    needToRedraw() {
        if (this._redraw) {
            return true;
        }
        const map = this.getMap(),
            mapRenderer = map._getRenderer();
        return map.isInteracting() || mapRenderer.isViewChanged();
    }

    setToRedraw() {
        this._redraw = true;
    }

    _drawOnZooming() {
        if (!this._zoomParam) {
            return;
        }
        const map = this.getMap();
        const param = this._zoomParam;
        const zoom = this._tileZoom;
        if (this._levelContainers && this._levelContainers[zoom]) {
            if (map.domCssMatrix) {
                this._updateContainer();
            } else {
                const matrix = param.matrix['view'];
                setTransformMatrix(this._levelContainers[zoom], matrix);
            }
        }
        // delete this._zoomParam;
    }

    _drawOnMoving() {
        const map = this.getMap();
        // prevent render when zooming or dragrotating, which may crash the browser
        if (!map || !map.getPitch() && !this.layer.options['forceRenderOnMoving']) {
            return;
        }
        this.render();
    }

    _drawOnDragRotating() {
        // when rotation is canceled, tiles needs to be repositioned.
        const mat = this.getMap().domCssMatrix;
        if (!mat || this.layer.options['renderOnRotating']) {
            this._renderTiles();
        } else {
            this._updateContainer();
        }
    }

    _renderTiles(escapeTileLoading) {
        this._redraw = false;
        if (!this._container) {
            this._createLayerContainer();
        }
        const tileGrid = this.layer.getTiles(escapeTileLoading ? this._tileZoom : undefined);
        if (!tileGrid || tileGrid.tiles.length === 0) {
            return;
        }

        const queue = this._getTileQueue(tileGrid);

        if (escapeTileLoading) {
            this._updateContainer();
            return;
        }

        this._tileZoom = tileGrid['zoom'];
        this._tileExtent = tileGrid['extent'];
        this._renderTime = now();

        this._updateContainer();

        if (queue.length > 0) {
            const container = this._getTileContainer(tileGrid['zoom']);
            const fragment = document.createDocumentFragment();
            for (let i = 0, l = queue.length; i < l; i++) {
                fragment.appendChild(this._loadTile(queue[i]));
            }
            container.tile.appendChild(fragment);
        }

        if (queue.length === 0) {
            this.layer.fire('layerload');
        }
    }

    _getTileQueue(tileGrid) {
        const tiles = tileGrid['tiles'],
            queue = [];
        delete this._centerOffset;
        if (!this._anchor || this._anchor.zoom !== tileGrid.zoom) {
            this._anchor = tileGrid.anchor;
        }
        let offset;
        if (this._preAnchor && this._preAnchor.zoom === tileGrid.zoom) {
            offset = tileGrid.anchor.sub(this._preAnchor);
        }
        // center tile's position may be changed, e.g. map is pitching
        for (let i = tiles.length - 1; i >= 0; i--) {
            const cachedTile = this._tiles[tiles[i]['id']];
            if (cachedTile) {
                //tile is already added
                cachedTile.current = true;
                continue;
            }
            tiles[i].current = true;
            if (offset && !offset.isZero()) {
                tiles[i]['viewPoint']._sub(offset);
            }
            queue.push(tiles[i]);
        }
        this._centerOffset = tileGrid.anchor.sub(this._anchor);
        this._preAnchor = tileGrid.anchor;
        if (offset && !offset.isZero()) {
            this._preAnchor._sub(offset);
        }
        return queue;
    }


    /**
     * Update container's transform style in the following cases :
     * 1 at an integer zoom
     * 2 at a fractional zoom
     * 3 with domCssMatrix(pitch/bearing) at an integer zoom
     * 4 with domCssMatrix(pitch/bearing) at a fractional zoom
     * @private
     */
    _updateContainer() {
        const map = this.getMap(),
            tileZoom = this._tileZoom,
            domMat = map.domCssMatrix,
            container = this._getTileContainer(tileZoom),
            size = map.getSize(),
            fraction = map.getResolution(tileZoom) / map.getResolution(),
            centerOffset = this._centerOffset;
        const containerStyle = container.style;
        if (containerStyle.left) {
            // Remove container's left/top if it has.
            // Left, top is set in onZoomEnd to keep container's position when map platform's offset is reset to 0.
            containerStyle.left = null;
            containerStyle.top = null;
        }
        if (!domMat) {
            let style = '';
            if (centerOffset && !centerOffset.isZero()) {
                const offset = centerOffset.multi(fraction);
                style = Browser.any3d ? 'translate3d(' + offset.x + 'px, ' + offset.y + 'px, 0px) ' :
                    'translate(' + offset.x + 'px, ' + offset.y + 'px) ';
            }
            if (fraction !== 1) {
                // fractional zoom
                const matrix = [fraction, 0, 0, fraction, size['width'] / 2 *  (1 - fraction), size['height'] / 2 *  (1 - fraction)];
                style += 'matrix(' + matrix.join() + ')';
            }
            this._resetDomCssMatrix();
            if (style !== '') {
                container.tile.style[TRANSFORM] = style;
            } else {
                removeTransform(container.tile);
            }
            return;
        }

        if (Browser.chrome && Browser.chromeVersion.startsWith('60')) {
            const err =  'DOM TileLayer can\'t pitch or rotate due to a crash bug with chrome 60.';
            if (!this._reported) {
                this._reported = true;
                if (window.confirm(err + ' Click OK to redirect to the bug report.')) {
                    window.location.href = 'https://bugs.chromium.org/p/chromium/issues/detail?id=752382&q=&colspec=ID%20Pri%20M%20Stars%20ReleaseBlock%20Component%20Status%20Owner%20Summary%20OS%20Modified&start=200';
                    return;
                }
            }
            throw new Error(err);
        }

        // update container when map is rotating or pitching.

        // reduce repaint causing by dom updateing
        this._container.style.display = 'none';
        if (parseInt(containerStyle.width) !== size['width'] || parseInt(containerStyle.height) !== size['height']) {
            containerStyle.width = size['width'] + 'px';
            containerStyle.height = size['height'] + 'px';
        }
        let matrix;
        if (fraction !== 1) {
            const m = new Float32Array();
            if (map.isZooming() && this._zoomParam) {
                const origin = this._zoomParam['origin'],
                    // when origin is not in the center with pitch, layer scaling is not fit for map's scaling, add a offset to fix.
                    pitch = map.getPitch(),
                    offset = [
                        (origin.x - size['width'] / 2)  * (1 - fraction),
                        //FIXME Math.cos(pitch * Math.PI / 180) is just a magic num, works when tilting but may have problem when rotating
                        (origin.y - size['height'] / 2) * (1 - fraction) * (pitch ? Math.cos(pitch * Math.PI / 180) : 1),
                        0
                    ];
                mat4.translate(m, m, offset);
            }
            mat4.multiply(m, m, domMat);
            // Fractional zoom, multiply current domCssMat with fraction
            mat4.scale(m, m, [fraction, fraction, 1]);
            matrix = join(m);
        } else {
            matrix = join(domMat);
        }
        const mapOffset = map.getViewPoint().round();
        let tileOffset;
        if (map.isZooming() && !map.isMoving()) {
            // when map is zooming, mapOffset is fixed when zoom starts
            // should multiply with zoom fraction if zoom start from a fractional zoom
            const startFraction = map.getResolution(tileZoom) / map.getResolution(this._startZoom);
            tileOffset = mapOffset.multi(1 / startFraction);
        } else {
            tileOffset = mapOffset.multi(1 / fraction);
        }
        if (centerOffset) {
            tileOffset._add(centerOffset);
        }
        container.tile.style[TRANSFORM] = 'translate3d(' + tileOffset.x + 'px, ' + tileOffset.y + 'px, 0px)';
        containerStyle[TRANSFORM] = 'translate3d(' + (-mapOffset.x) + 'px, ' + (-mapOffset.y) + 'px, 0px) matrix3D(' + matrix + ')';
        this._container.style.display = '';
    }

    _resetDomCssMatrix() {
        const container = this._getTileContainer(this._tileZoom);
        removeTransform(container);
        if (container.style.width || container.style.height) {
            container.style.width = null;
            container.style.height = null;
        }
    }

    _getTileSize() {
        const size = this.layer.getTileSize();
        const tileSize = [size['width'], size['height']];
        const map = this.getMap();
        // A workround to fix seams between tiles when transforming tile container.
        // Should be a webkit's bug:
        // https://bugs.chromium.org/p/chromium/issues/detail?id=600120
        // related issue by Leaflet:
        // https://github.com/Leaflet/Leaflet/issues/3575
        if (Browser.webkit && (map.isTransforming() || map.isZooming() || map.getZoom() !== this._tileZoom)) {
            tileSize[0]++;
            tileSize[1]++;
        }
        return tileSize;
    }

    _loadTile(tile) {
        this._tiles[tile['id']] = tile;
        return this._createTile(tile, this._tileReady.bind(this));
    }

    _createTile(tile, done) {
        const tileSize = this._getTileSize();
        const w = tileSize[0],
            h = tileSize[1];

        const tileImage = createEl('img');
        tile['el'] = tileImage;
        tile['size'] = tileSize;
        tile['pos'] = tile['viewPoint'];

        on(tileImage, 'load', this._tileOnLoad.bind(this, done, tile));
        on(tileImage, 'error', this._tileOnError.bind(this, done, tile));

        if (this.layer.options['crossOrigin']) {
            tileImage.crossOrigin = this.layer.options['crossOrigin'];
        }

        tileImage.style.position = 'absolute';
        this._posTileImage(tileImage, tile['viewPoint']);

        tileImage.alt = '';
        tileImage.width = w;
        tileImage.height = h;
        tileImage.style.maxWidth = (w + 1) + 'px';
        tileImage.style.maxHeight = (h + 1) + 'px';

        setOpacity(tileImage, 0);

        if (this.layer.options['cssFilter']) {
            tileImage.style[CSSFILTER] = this.layer.options['cssFilter'];
        }

        tileImage.src = tile['url'];

        return tileImage;
    }

    _tileReady(err, tile) {
        if (!this.layer) {
            return;
        }
        if (err) {
            /**
             * tileerror event, fired when layer is 'dom' rendered and a tile errors
             *
             * @event TileLayer#tileerror
             * @type {Object}
             * @property {String} type - tileerror
             * @property {TileLayer} target - tile layer
             * @property {String} err  - error message
             * @property {Object} tile - tile
             */
            this.layer.fire('tileerror', {
                error: err,
                tile: tile
            });
        }

        tile.loaded = now();

        const map = this.getMap();

        if (this._fadeAnimated) {
            setOpacity(tile.el, 0);
            cancelAnimFrame(this._fadeFrame);
            this._fadeFrame = requestAnimFrame(this._updateOpacity.bind(this));
        } else {
            setOpacity(tile.el, 1);
            tile.active = true;
        }

        /**
         * tileload event, fired when layer is 'dom' rendered and a tile is loaded
         *
         * @event TileLayer#tileload
         * @type {Object}
         * @property {String} type - tileload
         * @property {TileLayer} target - tile layer
         * @property {Object} tile - tile
         */
        this.layer.fire('tileload', {
            tile: tile
        });

        if (this._noTilesToLoad()) {
            if (this._pruneTimeout) {
                clearTimeout(this._pruneTimeout);
            }
            if (map.isInteracting()) {
                this._pruneLevels();
            } else {
                this.layer.fire('layerload');
                const timeout = map ? map.options['zoomAnimationDuration'] : 250,
                    pruneLevels = (map && this.layer === map.getBaseLayer()) ? !map.options['zoomBackground'] : true;
                // Wait a bit more than 0.2 secs (the duration of the tile fade-in)
                // to trigger a pruning.
                this._pruneTimeout = setTimeout(this._pruneTiles.bind(this, pruneLevels), timeout + 100);
            }
        }
    }

    _tileOnLoad(done, tile) {
        // For https://github.com/Leaflet/Leaflet/issues/3332
        if (Browser.ielt9) {
            setTimeout(done.bind(this, null, tile), 0);
        } else {
            done.call(this, null, tile);
        }
    }

    _tileOnError(done, tile) {
        if (!this.layer) {
            return;
        }
        const errorUrl = this.layer.options['errorTileUrl'];
        if (errorUrl) {
            tile['el'].src = errorUrl;
        } else {
            tile['el'].style.display = 'none';
        }
        done.call(this, 'error', tile);
    }

    _noTilesToLoad() {
        for (const key in this._tiles) {
            if (!this._tiles[key].loaded) {
                return false;
            }
        }
        return true;
    }

    _updateOpacity() {
        if (!this.getMap()) { return; }

        const now = +new Date();
        let nextFrame = false;

        for (const key in this._tiles) {
            const tile = this._tiles[key];
            if (!tile.current || !tile.loaded) { continue; }

            const fade = Math.min(1, (now - tile.loaded) / 200);

            setOpacity(tile.el, fade);
            if (fade < 1) {
                nextFrame = true;
            } else {
                tile.active = true;
            }
        }

        if (nextFrame) {
            cancelAnimFrame(this._fadeFrame);
            this._fadeFrame = requestAnimFrame(this._updateOpacity.bind(this));
        }
    }

    _pruneTiles(pruneLevels = true) {
        const map = this.getMap();
        if (!map || map.isMoving()) {
            return;
        }
        this._abortLoading();

        const zoom = this._tileZoom;

        if (!this.layer.isVisible()) {
            this._removeAllTiles();
            return;
        }

        for (const key in this._tiles) {
            if (this._tiles[key]['z'] === zoom && !this._tiles[key].current) {
                this._removeTile(key);
            }
        }

        if (pruneLevels) {
            for (const key in this._tiles) {
                if (this._tiles[key]['z'] !== zoom) {
                    this._removeTile(key);
                }
            }
            this._pruneLevels();
        }

    }

    _pruneLevels() {
        const zoom = this._tileZoom;
        for (const z in this._levelContainers) {
            if (+z !== zoom) {
                this._removeTileContainer(z);
            }
        }
    }

    _removeTileContainer(z) {
        if (!this._levelContainers[z]) {
            return;
        }
        removeDomNode(this._levelContainers[z]);
        this._removeTilesAtZoom(z);
        delete this._levelContainers[z];
    }

    _removeTile(key) {
        const tile = this._tiles[key];
        if (!tile) {
            return;
        }

        removeDomNode(tile.el);

        delete this._tiles[key];

        /**
         * tileunload event, fired when layer is 'dom' rendered and a tile is removed
         *
         * @event TileLayer#tileunload
         * @type {Object}
         * @property {String} type - tileunload
         * @property {TileLayer} target - tile layer
         * @property {Object} tile - tile
         */
        this.layer.fire('tileunload', {
            tile: tile
        });
    }

    _removeTilesAtZoom(zoom) {
        for (const key in this._tiles) {
            if (+this._tiles[key]['z'] !== +zoom) {
                continue;
            }
            this._removeTile(key);
        }
    }

    _removeAllTiles() {
        for (const key in this._tiles) {
            this._removeTile(key);
        }
    }

    _getTileContainer(zoom) {
        if (!this._levelContainers) {
            this._levelContainers = {};
        }
        if (!this._levelContainers[zoom]) {
            const container = this._levelContainers[zoom] = createEl('div', 'maptalks-tilelayer-level');
            container.style.cssText = POSITION0;

            const tileContainer =  createEl('div');
            tileContainer.style.cssText = POSITION0;// + ';will-change:transform';
            container.appendChild(tileContainer);
            container.tile = tileContainer;
            this._container.appendChild(container);
        }
        return this._levelContainers[zoom];
    }

    _createLayerContainer() {
        const container = this._container = createEl('div', 'maptalks-tilelayer');
        container.style.cssText = POSITION0;
        if (this._zIndex) {
            container.style.zIndex = this._zIndex;
        }
        const parentContainer = this.layer.options['container'] === 'front' ? this.getMap()._panels['frontLayer'] : this.getMap()._panels['backLayer'];
        parentContainer.appendChild(container);
    }

    _clearLayerContainer() {
        if (this._container) {
            this._container.innerHTML = '';
        }
        delete this._levelContainers;
    }

    _removeLayerContainer() {
        if (this._container) {
            removeDomNode(this._container);
        }
        delete this._container;
        delete this._levelContainers;
    }

    getEvents() {
        const events = {
            '_zoomstart'    : this.onZoomStart,
            //prune tiles before drag rotating to reduce tiles when rotating
            '_touchzoomstart _dragrotatestart' : this._pruneTiles,
            '_movestart' : this.onMoveStart,
            '_zooming'      : this.onZooming,
            '_zoomend'      : this.onZoomEnd,
            '_dragrotateend' : this.render
        };
        return events;
    }

    _canTransform() {
        return Browser.any3d || Browser.ie9;
    }

    _show() {
        this._container.style.display = '';
    }

    _hide() {
        this._container.style.display = 'none';
    }

    _posTileImage(tileImage, pos) {
        tileImage.style.left = pos.x + 'px';
        tileImage.style.top = pos.y + 'px';
    }

    onMoveStart() {
        if (this.getMap().getPitch()) {
            this._pruneLevels();
        }
    }

    onZoomStart(param) {
        const map = this.getMap();
        this._fadeAnimated = false;
        this._startZoom = map.getZoom();
        this._endZoom = param.to;
        this._mapOffset = map.offsetPlatform().round();
        if (!this._canTransform()) {
            this._hide();
        }
        this._pruneTiles();
    }

    onZooming(param) {
        this._zoomParam = param;
    }

    onZoomEnd() {
        if (!this.getMap() || !this._levelContainers) {
            return;
        }
        if (!this._zoomParam && this._tileZoom !== this.layer._getTileZoom()) {
            // zoom without animation
            this._removeTileContainer(this._tileZoom);
        }
        if (this._pruneTimeout) {
            clearTimeout(this._pruneTimeout);
        }
        const container = this._levelContainers[this._tileZoom];
        if (container) {
            if (this._canTransform()) {
                if (container && this._mapOffset) {
                    // Container at old _tileZoom becomes background of new zoom container.
                    // When zooming ends, map's platform offset will be reset to 0,
                    // thus old container's left and top will be set with map's platform offset when zooming starts to force old container staying in the right position.
                    container.style.left = this._mapOffset.x + 'px';
                    container.style.top = this._mapOffset.y + 'px';
                    delete this._mapOffset;
                }
            } else {
                container.style.display = 'none';
                this._show();
            }
        }
        this._fadeAnimated = !Browser.mobile && this._startZoom !== this._endZoom;
        delete this._zoomParam;
        delete this._endZoom;
        delete this._startZoom;
        delete this._curAnimZoom;
        this.setToRedraw();
    }

    _abortLoading(removeDOM) {
        for (const i in this._tiles) {
            if (this._tiles[i].abort) {
                continue;
            }
            if (this._tiles[i].z !== this._tileZoom || !this._tiles[i].current) {
                this._tiles[i].abort = true;
                const tile = this._tiles[i].el;

                tile.onload = falseFn;
                tile.onerror = falseFn;

                if (!tile.loaded) {
                    tile.src = emptyImageUrl;
                    if (removeDOM) {
                        removeDomNode(tile);
                    }
                }
            }
        }
    }
}

function falseFn() { return false; }

TileLayer.registerRenderer('dom', TileLayerDomRenderer);

export default TileLayerDomRenderer;
