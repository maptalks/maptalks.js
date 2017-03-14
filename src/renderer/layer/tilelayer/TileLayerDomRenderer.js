import {
    join,
    throttle,
    requestAnimFrame
} from 'core/util';
import * as mat4 from 'core/util/mat4';
import {
    on,
    createEl,
    setTransformMatrix,
    removeTransform,
    removeDomNode,
    setOpacity,
    TRANSFORM,
    TRANSITION,
    CSSFILTER
} from 'core/util/dom';
import Class from 'core/Class';
import Browser from 'core/Browser';
import Point from 'geo/Point';
import TileLayer from 'layer/tile/TileLayer';


const POSITION0 = 'position:absolute;';

/**
 * @classdesc
 * A renderer based on HTML Doms for TileLayers.
 * It is implemented based on Leaflet's GridLayer.
 * @class
 * @protected
 * @memberOf tilelayer
 * @name Dom
 * @extends {Class}
 * @param {TileLayer} layer - layer of the renderer
 */
export default class TileLayerDomRenderer extends Class {

    constructor(layer) {
        super();
        this.layer = layer;
        this._tiles = {};
        this._fadeAnimated = !Browser.mobile && true;
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
        delete this._tiles;
        delete this.layer;
        this._clearCameraCache();
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

    isCanvasRender() {
        return false;
    }

    render(updateTiles = true) {
        const layer = this.layer;
        if (!this._container) {
            this._createLayerContainer();
        }
        const tileGrid = this.layer._getTiles();
        if (!tileGrid) {
            return;
        }

        const queue = this._getTileQueue(tileGrid);

        const camMat = this.getMap().getCameraMatrix();
        // disable throttle of onMapMoving if map tilts or rotates.
        this.onMapMoving.time = camMat ? 0 : layer.options['updateInterval'];


        this._currentTileZoom = this.getMap().getZoom();

        this._prepareTileContainer();

        if (updateTiles && queue.length > 0) {
            const container = this._getTileContainer();
            const fragment = document.createDocumentFragment();
            for (let i = 0, l = queue.length; i < l; i++) {
                fragment.appendChild(this._loadTile(queue[i]));
            }
            this._appendTileFragment(container, fragment);
        }
        this._updateTileSize();
    }

    _getTileQueue(tileGrid) {
        const tiles = tileGrid['tiles'],
            queue = [];
        const mat = this.getMap().getCameraMatrix();

        const preCamOffset = this._camOffset;
        if (!this._camOffset || (!mat && !this._camOffset.isZero())) {
            // offset of tile container due to camera matrix
            this._camOffset = new Point(0, 0);
        }

        if (this._preCenterId && mat) {
            // caculate tile container's offset if map is pitching
            let preCenterTilePos = this._tiles[this._preCenterId]['viewPoint'];
            let current;
            for (let i = tiles.length - 1; i >= 0; i--) {
                if (tiles[i]['id'] === this._preCenterId) {
                    current = tiles[i]['viewPoint'];
                    break;
                }
            }
            if (current) {
                const offset = current.sub(preCenterTilePos);
                this._camOffset._add(offset);
            }
        }

        if (this._tiles) {
            // when camera is canceled, all current tiles needs to be repositioned (adding pre camera offset)
            const repos = !mat && preCamOffset && !preCamOffset.isZero();
            for (let p in this._tiles) {
                let t = this._tiles[p];
                this._tiles[p].current = false;
                if (repos) {
                    let pos = t['pos'];
                    pos._add(preCamOffset);
                    t['el'].style[TRANSFORM] = 'translate3d(' + pos.x + 'px, ' + pos.y + 'px, 0px)';
                    t['viewPoint'] = pos;
                }
            }
        }

        var cachedTile;
        for (let i = tiles.length - 1; i >= 0; i--) {
            cachedTile = this._tiles[tiles[i]['id']];
            if (cachedTile) {
                //tile is already added
                cachedTile.current = true;
                if (mat) {
                    cachedTile['viewPoint'] = tiles[i]['viewPoint'];
                }
                continue;
            }
            tiles[i].current = true;
            if (mat && this._camOffset) {
                tiles[i]['viewPoint']._sub(this._camOffset);
            }
            queue.push(tiles[i]);
        }
        this._preCenterId = tileGrid['center'];

        return queue;
    }

    _prepareTileContainer() {
        const map = this.getMap();
        const camMat = map.getCameraMatrix();
        const container = this._getTileContainer();
        if (!camMat) {
            removeTransform(container);
            if (container.style.width || container.style.height) {
                container.style.width = null;
                container.style.height = null;
                removeTransform(container.childNodes[0]);
            }
        } else {
            const size = map.getSize();
            if (parseInt(container.style.width) !== size['width'] || parseInt(container.style.height) !== size['height']) {
                container.style.width = size['width'] + 'px';
                container.style.height = size['height'] + 'px';
            }
            const matrix = join(camMat);
            const mapOffset = map.offsetPlatform();
            container.childNodes[0].style[TRANSFORM] = 'translate3d(' + (this._camOffset.x + mapOffset.x) + 'px, ' + (this._camOffset.y + mapOffset.y) + 'px, 0px)';
            container.style[TRANSFORM] = 'translate3d(' + (-mapOffset.x) + 'px, ' + (-mapOffset.y) + 'px, 0px) matrix3D(' + matrix + ')';
        }
    }

    onZooming(param) {
        const map = this.getMap();
        const zoom = Math.floor(param['from']);
        if (this._levelContainers && this._levelContainers[zoom]) {
            const matrix = param.matrix['view'];
            if (map.getCameraMatrix()) {
                const pitch = map.getPitch();
                const scale = matrix[0];
                const size = map.getSize();
                const origin = param['origin'];
                const m = mat4.create();
                const matOffset = [
                    (origin.x - size['width'] / 2)  * (1 - scale),
                    //FIXME Math.cos(pitch * Math.PI / 180) is just a magic num, works when tilting but may have problem when rotating
                    (origin.y - size['height'] / 2) * (1 - scale) * (pitch ? Math.cos(pitch * Math.PI / 180) : 1),
                    0
                ];

                // rotation is right
                mat4.translate(m, m, matOffset);
                mat4.multiply(m, m, map.getCameraMatrix());
                mat4.scale(m, m, [scale, scale, 1]);

                // mat4.translate(m, m, matOffset);
                // mat4.scale(m, m, [scale, scale, 1]);
                // mat4.multiply(m, m, map.getCameraMatrix());

                const offset = map.offsetPlatform();
                const transform = 'translate3d(' + (-offset.x) + 'px, ' + (-offset.y) + 'px, 0px) matrix3D(' + join(m) + ')';
                this._levelContainers[zoom].style[TRANSFORM] = transform;
            } else {
                setTransformMatrix(this._levelContainers[zoom], matrix);
            }

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
        if (Browser.webkit && (map.getCameraMatrix() || map.isZooming())) {
            tileSize[0]++;
            tileSize[1]++;
        }
        return tileSize;
    }

    /**
     * update tile images' size
     */
    _updateTileSize() {
        if (this._tiles) {
            const size = this._getTileSize();
            for (let p in this._tiles) {
                if (this._tiles[p].current) {
                    if (size[0] !== this._tiles[p]['size'][0]) {
                        this._tiles[p]['size'] = size;
                        let img = this._tiles[p]['el'];
                        if (img) {
                            img.width = size[0];
                            img.height = size[1];
                        }
                    } else {
                        break;
                    }
                }
            }
        }
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
            tile.crossOrigin = this.layer.options['crossOrigin'];
        }

        tileImage.style.position = 'absolute';
        if (Browser.any3d) {
            tileImage.style[TRANSFORM] = 'translate3d(' + tile['viewPoint'].x + 'px, ' + tile['viewPoint'].y + 'px, 0px)';
        } else {
            tileImage.style[TRANSFORM] = 'translate(' + tile['viewPoint'].x + 'px, ' + tile['viewPoint'].y + 'px)';
        }

        tileImage.alt = '';
        tileImage.width = w;
        tileImage.height = h;

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

        tile.loaded = Date.now();

        var map = this.getMap();

        if (this._fadeAnimated) {
            tile['el'].style[TRANSITION] = 'opacity 250ms';
        }

        setOpacity(tile['el'], 1);
        tile.active = true;

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
            this.layer.fire('layerload');

            if (Browser.ielt9) {
                requestAnimFrame(this._pruneTiles, this);
            } else {
                if (this._pruneTimeout) {
                    clearTimeout(this._pruneTimeout);
                }
                var timeout = map ? map.options['zoomAnimationDuration'] : 250,
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
        var errorUrl = this.layer.options['errorTileUrl'];
        if (errorUrl) {
            tile['el'].src = errorUrl;
        } else {
            tile['el'].style.display = 'none';
        }
        done.call(this, 'error', tile);
    }

    _noTilesToLoad() {
        for (var key in this._tiles) {
            if (!this._tiles[key].loaded) {
                return false;
            }
        }
        return true;
    }

    _pruneTiles(pruneLevels) {
        var map = this.getMap();
        if (!map || map.isMoving()) {
            return;
        }

        var key,
            zoom = this._currentTileZoom;

        if (!this.layer.isVisible()) {
            this._removeAllTiles();
            return;
        }

        for (key in this._tiles) {
            if (this._tiles[key]['z'] === zoom && !this._tiles[key].current) {
                this._removeTile(key);
            }
        }

        if (pruneLevels) {
            for (key in this._tiles) {
                if (this._tiles[key]['z'] !== zoom) {
                    this._removeTile(key);
                }
            }
            for (var z in this._levelContainers) {
                if (+z !== zoom) {
                    removeDomNode(this._levelContainers[z]);
                    this._removeTilesAtZoom(z);
                    delete this._levelContainers[z];
                }
            }
        }

    }

    _removeTile(key) {
        var tile = this._tiles[key];
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
        for (var key in this._tiles) {
            if (+this._tiles[key]['z'] !== +zoom) {
                continue;
            }
            this._removeTile(key);
        }
    }

    _removeAllTiles() {
        for (var key in this._tiles) {
            this._removeTile(key);
        }
    }

    _getTileContainer() {
        if (!this._levelContainers) {
            this._levelContainers = {};
        }
        var zoom = this.getMap().getZoom();
        if (!this._levelContainers[zoom]) {
            const container = this._levelContainers[zoom] = createEl('div', 'maptalks-tilelayer-level');
            container.style.cssText = POSITION0;

            const tileContainer =  createEl('div');
            tileContainer.style.cssText = POSITION0;
            tileContainer.style.willChange = 'transform';
            container.appendChild(tileContainer);

            this._container.appendChild(container);
        }
        return this._levelContainers[zoom];
    }

    _appendTileFragment(container, fragment) {
        if (container.childNodes[0]) {
            container.childNodes[0].appendChild(fragment);
        }
    }

    _createLayerContainer() {
        var container = this._container = createEl('div', 'maptalks-tilelayer');
        container.style.cssText = POSITION0;
        if (this._zIndex) {
            container.style.zIndex = this._zIndex;
        }
        var parentContainer = this.layer.options['container'] === 'front' ? this.getMap()._panels['frontLayer'] : this.getMap()._panels['backLayer'];
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
            '_touchzoomstart' : this._onTouchZoomStart,
            '_zooming'      : this.onZooming,
            '_zoomend'      : this.onZoomEnd,
            '_moveend _resize' : this.render,
            '_movestart'    : this.onMoveStart
        };
        if (!this.onMapMoving) {
            const interval = this.layer.options['updateInterval'];
            this.onMapMoving = throttle(this._onMapMoving, interval, this);
        }
        events['_moving'] = this.onMapMoving;
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

    _onMapMoving() {
        if (!this.getMap() || !this.getMap().getPitch() && !this.layer.options['renderWhenPanning']) {
            return;
        }
        this.render();
    }

    onMoveStart() {
        // this._fadeAnimated = false;
    }

    _onTouchZoomStart() {
        this._pruneTiles(true);
    }

    onZoomStart() {
        this._fadeAnimated = !Browser.mobile && true;
        this._pruneTiles(true);
        this._zoomStartPos = this.getMap().offsetPlatform();
        if (!this._canTransform()) {
            this._hide();
        }
        this._updateTileSize();
    }

    onZoomEnd(param) {
        if (this._pruneTimeout) {
            clearTimeout(this._pruneTimeout);
        }
        this._clearCameraCache();
        this.render();
        if (this._levelContainers) {
            if (this._canTransform()) {
                if (this._levelContainers[param.from] && this._zoomStartPos) {
                    this._levelContainers[param.from].style.left = this._zoomStartPos.x + 'px';
                    this._levelContainers[param.from].style.top = this._zoomStartPos.y + 'px';
                }
            } else {
                if (this._levelContainers[param.from]) {
                    this._levelContainers[param.from].style.display = 'none';
                }
                this._show();
            }
        }
    }

    _clearCameraCache() {
        delete this._preCenterId;
        delete this._camOffset;
    }
}

TileLayer.registerRenderer('dom', TileLayerDomRenderer);
