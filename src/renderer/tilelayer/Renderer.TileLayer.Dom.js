/**
 * @classdesc
 * A renderer based on HTML Doms for TileLayers.
 * It is implemented based on Leaflet's GridLayer, and all the credits belongs to Leaflet.
 * @class
 * @protected
 * @memberOf maptalks.renderer.tilelayer
 * @name Dom
 * @extends {maptalks.Class}
 * @param {maptalks.TileLayer} layer - layer of the renderer
 */
Z.renderer.tilelayer.Dom = Z.Class.extend(/** @lends Z.renderer.tilelayer.Dom.prototype */{

    initialize:function (layer) {
        this.layer = layer;
        this._tiles = {};
        this._fadeAnimated = !Z.Browser.mobile && true;
    },

    getMap:function () {
        return this.layer.getMap();
    },

    show: function () {
        if (this._container) {
            this.render();
            this._container.style.display = '';
        }
    },

    hide: function () {
        if (this._container) {
            this._container.style.display = 'none';
            this.clear();
        }
    },

    remove:function () {
        delete this._tiles;
        delete this.layer;
        this._removeLayerContainer();
    },

    clear:function () {
        this._removeAllTiles();
        this._clearLayerContainer();
    },

    setZIndex: function (z) {
        this._zIndex = z;
        if (this._container) {
            this._container.style.zIndex = z;
        }
    },

    isCanvasRender: function () {
        return false;
    },

    render:function () {
        var layer = this.layer;
        if (!this._container) {
            this._createLayerContainer();
        }
        var tileGrid = layer._getTiles();
        if (!tileGrid) {
            return;
        }
        var tiles = tileGrid['tiles'],
            queue = [];


        if (this._tiles) {
            for (var p in this._tiles) {
                this._tiles[p].current = false;
            }
        }

        var tile;
        for (var i = tiles.length - 1; i >= 0; i--) {
            tile = tiles[i];
            if (this._tiles[tile['id']]) {
                //tile is already added
                this._tiles[tile['id']].current = true;
                continue;
            }
            tile.current = true;
            queue.push(tile);
        }
        var container = this._getTileContainer();
        Z.DomUtil.removeTransform(container);
        if (queue.length > 0) {
            var fragment = document.createDocumentFragment();
            for (i = 0; i < queue.length; i++) {
                fragment.appendChild(this._loadTile(queue[i]));
            }
            container.appendChild(fragment);
        }
    },

    transform: function (matrices) {
        if (!this._canTransform()) {
            return false;
        }
        var zoom = this.getMap().getZoom();
        if (this._levelContainers[zoom]) {
            if (matrices) {
                Z.DomUtil.setTransform(this._levelContainers[zoom], matrices['view']);
            } else {
                Z.DomUtil.removeTransform(this._levelContainers[zoom]);
            }
            // Z.DomUtil.setTransform(this._levelContainers[zoom], new Z.Point(matrices['view'].e, matrices['view'].f), matrices.scale.x);
        }
        return false;
    },

    _loadTile: function (tile) {
        this._tiles[tile['id']] = tile;
        return this._createTile(tile, Z.Util.bind(this._tileReady, this));
    },

    _createTile: function (tile, done) {
        var tileSize = this.layer.getTileSize();
        var tileImage = Z.DomUtil.createEl('img');

        tile['el'] = tileImage;

        Z.DomUtil.on(tileImage, 'load', Z.Util.bind(this._tileOnLoad, this, done, tile));
        Z.DomUtil.on(tileImage, 'error', Z.Util.bind(this._tileOnError, this, done, tile));

        if (this.layer.options['crossOrigin']) {
            tile.crossOrigin = this.layer.options['crossOrigin'];
        }

        tileImage.style.position = 'absolute';
        tileImage.style.left = Math.floor(tile['viewPoint'].x) + 'px';
        tileImage.style.top  = Math.floor(tile['viewPoint'].y) + 'px';

        tileImage.alt = '';
        tileImage.width = tileSize['width'];
        tileImage.height = tileSize['height'];

        Z.DomUtil.setOpacity(tileImage, 0);

        tileImage.src = tile['url'];

        return tileImage;
    },

    _tileReady: function (err, tile) {
        if (err) {
            /**
             * tileerror event, fired when layer is 'dom' rendered and a tile errors
             *
             * @event maptalks.TileLayer#tileerror
             * @type {Object}
             * @property {String} type - tileerror
             * @property {maptalks.TileLayer} target - tile layer
             * @property {String} err  - error message
             * @property {Object} tile - tile
             */
            this.layer.fire('tileerror', {
                error: err,
                tile: tile
            });
        }

        tile.loaded = Z.Util.now();

        if (this._fadeAnimated) {
            Z.Util.cancelAnimFrame(this._fadeFrame);
            this._fadeFrame = Z.Util.requestAnimFrame(Z.Util.bind(this._updateOpacity, this));
        } else {
            Z.DomUtil.setOpacity(tile['el'], 1);
            tile.active = true;
            this._pruneTiles();
        }

        /**
         * tileload event, fired when layer is 'dom' rendered and a tile is loaded
         *
         * @event maptalks.TileLayer#tileload
         * @type {Object}
         * @property {String} type - tileload
         * @property {maptalks.TileLayer} target - tile layer
         * @property {Object} tile - tile
         */
        this.layer.fire('tileload', {
            tile: tile
        });

        if (this._noTilesToLoad()) {
            this.layer.fire('layerload');

            if (Z.Browser.ielt9) {
                Z.Util.requestAnimFrame(this._pruneTiles, this);
            } else {
                if (this._pruneTimeout) {
                    clearTimeout(this._pruneTimeout);
                }
                var timeout = this.getMap() ? this.getMap().options['zoomAnimationDuration'] : 250,
                    pruneLevels = this.getMap() ? !this.getMap().options['zoomBackground'] : true;
                // Wait a bit more than 0.2 secs (the duration of the tile fade-in)
                // to trigger a pruning.
                this._pruneTimeout = setTimeout(Z.Util.bind(this._pruneTiles, this, pruneLevels), timeout + 100);
            }
        }
    },

    _tileOnLoad: function (done, tile) {
        // For https://github.com/Leaflet/Leaflet/issues/3332
        if (Z.Browser.ielt9) {
            setTimeout(Z.Util.bind(done, this, null, tile), 0);
        } else {
            done.call(this, null, tile);
        }
    },

    _tileOnError: function (done, tile) {
        var errorUrl = this.layer.options['errorTileUrl'];
        if (errorUrl) {
            tile['el'].src = errorUrl;
        } else {
            tile['el'].style.display = 'none';
        }
        done.call(this, 'error', tile);
    },

    _updateOpacity: function () {
        if (!this.getMap()) { return; }

        // IE doesn't inherit filter opacity properly, so we're forced to set it on tiles
        if (Z.Browser.ielt9) {
            return;
        }

        Z.DomUtil.setOpacity(this._container, this.layer.options['opacity']);

        var now = Z.Util.now(),
            nextFrame = false;
        var tile, fade;
        for (var key in this._tiles) {
            tile = this._tiles[key];
            if (!tile.current || !tile.loaded) { continue; }

            fade = Math.min(1, (now - tile.loaded) / 200);

            Z.DomUtil.setOpacity(tile['el'], fade);
            if (!nextFrame && fade < 1) {
                nextFrame = true;
            }
        }

        if (nextFrame) {
            Z.Util.cancelAnimFrame(this._fadeFrame);
            this._fadeFrame = Z.Util.requestAnimFrame(Z.Util.bind(this._updateOpacity, this));
        }
    },

    _noTilesToLoad: function () {
        for (var key in this._tiles) {
            if (!this._tiles[key].loaded) { return false; }
        }
        return true;
    },

    _pruneTiles: function (pruneLevels) {
        var map = this.getMap();
        if (!map) {
            return;
        }

        var key,
            zoom = map.getZoom();

        if (!this.layer.isVisible()) {
            this._removeAllTiles();
            return;
        }

        for (key in this._tiles) {
            if (this._tiles[key].zoom === zoom && !this._tiles[key].current) {
                this._removeTile(key);
            }
        }

        if (pruneLevels) {
            for (key in this._tiles) {
                if (this._tiles[key].zoom !== zoom) {
                    this._removeTile(key);
                }
            }
            for (var z in this._levelContainers) {
                if (+z !== zoom) {
                    Z.DomUtil.removeDomNode(this._levelContainers[z]);
                    this._removeTilesAtZoom(z);
                    delete this._levelContainers[z];
                }
            }
        }

    },

    _removeTile: function (key) {
        var tile = this._tiles[key];
        if (!tile) { return; }

        Z.DomUtil.removeDomNode(tile.el);

        delete this._tiles[key];

        /**
         * tileunload event, fired when layer is 'dom' rendered and a tile is removed
         *
         * @event maptalks.TileLayer#tileunload
         * @type {Object}
         * @property {String} type - tileunload
         * @property {maptalks.TileLayer} target - tile layer
         * @property {Object} tile - tile
         */
        this.layer.fire('tileunload', {
            tile: tile
        });
    },

    _removeTilesAtZoom: function (zoom) {
        for (var key in this._tiles) {
            if (+this._tiles[key]['zoom'] !== +zoom) {
                continue;
            }
            this._removeTile(key);
        }
    },

    _removeAllTiles: function () {
        for (var key in this._tiles) {
            this._removeTile(key);
        }
    },

    _getTileContainer: function () {
        if (!this._levelContainers) {
            this._levelContainers = {};
        }
        var zoom = this.getMap().getZoom();
        if (!this._levelContainers[zoom]) {
            var container = this._levelContainers[zoom] = Z.DomUtil.createEl('div', 'maptalks-tilelayer-level');
            container.style.cssText = 'position:absolute;left:0px;top:0px;';
            container.style.willChange = 'transform';
            this._container.appendChild(container);
        }
        return this._levelContainers[zoom];
    },

    _createLayerContainer: function () {
        var container = this._container = Z.DomUtil.createEl('div', 'maptalks-tilelayer');
        container.style.cssText = 'position:absolute;left:0px;top:0px;';
        if (this._zIndex) {
            container.style.zIndex = this._zIndex;
        }
        this.getMap()._panels['layer'].appendChild(container);
    },

    _clearLayerContainer:function () {
        if (this._container) {
            this._container.innerHTML = '';
        }
        delete this._levelContainers;
    },

    _removeLayerContainer:function () {
        if (this._container) {
            Z.DomUtil.removeDomNode(this._container);
        }
        delete this._container;
        delete this._levelContainers;
    },

    getEvents:function () {
        var events = {
            '_zoomstart'    : this.onZoomStart,
            '_touchzoomstart' : this._onTouchZoomStart,
            '_zoomend'      : this.onZoomEnd,
            '_moveend _resize' : this.render,
            '_movestart'    : this.onMoveStart
        };
        if (!this._onMapMoving && this.layer.options['renderWhenPanning']) {
            var rendSpan = this.layer.options['renderSpanWhenPanning'];
            if (Z.Util.isNumber(rendSpan) && rendSpan >= 0) {
                if (rendSpan > 0) {
                    this._onMapMoving = Z.Util.throttle(function () {
                        this.render();
                    }, rendSpan, this);
                } else {
                    this._onMapMoving = function () {
                        this.render();
                    };
                }
            }
        }
        if (this._onMapMoving) {
            events['_moving'] = this._onMapMoving;
        }
        return events;
    },

    _canTransform: function () {
        return Z.Browser.any3d || Z.Browser.ie9;
    },

    onMoveStart: function () {
        // this._fadeAnimated = false;
    },

    _onTouchZoomStart: function () {
        this._pruneTiles(true);
    },

    onZoomStart: function () {
        this._fadeAnimated = !Z.Browser.mobile && true;
        this._pruneTiles(true);
        this._zoomStartPos = this.getMap().offsetPlatform();
        if (!this._canTransform()) {
            this._container.style.display = 'none';
        }
    },

    onZoomEnd: function (param) {
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
});

Z.TileLayer.registerRenderer('dom', Z.renderer.tilelayer.Dom);
