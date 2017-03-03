import {
    join,
    throttle,
    requestAnimFrame
} from 'core/util';
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
import TileLayer from 'layer/tile/TileLayer';

/**
 * @classdesc
 * A renderer based on HTML Doms for TileLayers.
 * It is implemented based on Leaflet's GridLayer, and all the credits belongs to Leaflet.
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
            this._container.style.display = '';
        }
    }

    hide() {
        if (this._container) {
            this._container.style.display = 'none';
            this.clear();
        }
    }

    remove() {
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

    isCanvasRender() {
        return false;
    }

    render() {
        const layer = this.layer;
        const map = this.getMap();
        if (!this._container) {
            this._createLayerContainer();
        }
        const tileGrid = layer._getTiles();
        if (!tileGrid) {
            return;
        }

        const pitch = this.getMap().getPitch();

        // disable throttle of onMapMoving if map pitches.
        this.onMapMoving.time = pitch ? 0 : layer.options['updateInterval'];

        this._currentTileZoom = this.getMap().getZoom();
        const tiles = tileGrid['tiles'],
            queue = [];

        if (this._tiles) {
            for (var p in this._tiles) {
                this._tiles[p].current = false;
            }
        }

        var cachedTile;
        for (let i = tiles.length - 1; i >= 0; i--) {
            cachedTile = this._tiles[tiles[i]['id']];
            if (cachedTile) {
                //tile is already added
                cachedTile.current = true;
                if (pitch) {
                    cachedTile['el'].style[TRANSFORM] = 'translate3d(' + tiles[i]['viewPoint'].x + 'px, ' + tiles[i]['viewPoint'].y + 'px, 0px)';
                }
                continue;
            }
            tiles[i].current = true;
            queue.push(tiles[i]);
        }
        const container = this._getTileContainer();
        if (!map.layerMatrix) {
            removeTransform(container);
            if (container.style.width || container.style.height) {
                container.style.width = null;
                container.style.height = null;
            }
        } else {
            const matrix = join(map.layerMatrix);
            const size = map.getSize();
            if (parseInt(container.style.width) !== size['width'] || parseInt(container.style.height) !== size['height']) {
                container.style.width = size['width'] + 'px';
                container.style.height = size['height'] + 'px';
            }
            const offset = map.offsetPlatform();
            container.style[TRANSFORM] = 'translate3d(' + (-offset.x) + 'px, ' + (-offset.y) + 'px, 0px) matrix3D(' + matrix + ')';
        }

        if (queue.length > 0) {
            const fragment = document.createDocumentFragment();
            for (let i = 0, l = queue.length; i < l; i++) {
                fragment.appendChild(this._loadTile(queue[i]));
            }
            container.appendChild(fragment);
        }
    }

    onZooming(param) {
        const map = this.getMap();
        const zoom = Math.floor(param['from']);
        if (this._levelContainers && this._levelContainers[zoom]) {
            var matrix = param.matrix['view'];
            const pitch = map.getPitch();
            if (pitch) {
                matrix = matrix.slice(0);
                matrix[4] = matrix[5] = 0;
                const offset = map.offsetPlatform();
                const transform = 'translate3d(' + (-offset.x) + 'px, ' + (-offset.y) + 'px, 0px) matrix3D(' + join(map.layerMatrix) + ') matrix(' + matrix.join() + ')';
                this._levelContainers[zoom].style[TRANSFORM] = transform;
            } else {
                setTransformMatrix(this._levelContainers[zoom], matrix);
            }

        }
    }

    _loadTile(tile) {
        this._tiles[tile['id']] = tile;
        return this._createTile(tile, this._tileReady.bind(this));
    }

    _createTile(tile, done) {
        var tileSize = this.layer.getTileSize();
        var tileImage = createEl('img');
        tile['el'] = tileImage;

        on(tileImage, 'load', this._tileOnLoad.bind(this, done, tile));
        on(tileImage, 'error', this._tileOnError.bind(this, done, tile));

        if (this.layer.options['crossOrigin']) {
            tile.crossOrigin = this.layer.options['crossOrigin'];
        }

        tileImage.style.position = 'absolute';
        if (Browser.any3d) {
            tileImage.style[TRANSFORM] = 'translate3d(' + tile['viewPoint'].x + 'px, ' + tile['viewPoint'].y + 'px, 0px)';
        } else {
            tileImage.style.left = tile['viewPoint'].x + 'px';
            tileImage.style.top = tile['viewPoint'].y + 'px';
        }

        tileImage.alt = '';
        tileImage.width = tileSize['width'];
        tileImage.height = tileSize['height'];

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
            var container = this._levelContainers[zoom] = createEl('div', 'maptalks-tilelayer-level');
            container.style.cssText = 'position:absolute;left:0px;top:0px;';
            container.style.willChange = 'transform';
            this._container.appendChild(container);
        }
        return this._levelContainers[zoom];
    }

    _createLayerContainer() {
        var container = this._container = createEl('div', 'maptalks-tilelayer');
        container.style.cssText = 'position:absolute;left:0px;top:0px;';
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

    _onMapMoving() {
        if (!this.getMap().getPitch() && !this.layer.options['renderWhenPanning']) {
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
        if (!this._canTransform() && this._container) {
            this._container.style.display = 'none';
        }
    }

    onZoomEnd(param) {
        if (this._pruneTimeout) {
            clearTimeout(this._pruneTimeout);
        }
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
                this._container.style.display = '';
            }
        }
    }
}

TileLayer.registerRenderer('dom', TileLayerDomRenderer);
