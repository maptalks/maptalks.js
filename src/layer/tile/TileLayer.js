import { isNode, isArrayHasData, isFunction } from 'core/util';
import Browser from 'core/Browser';
import Point from 'geo/Point';
import Size from 'geo/Size';
import PointExtent from 'geo/PointExtent';
import Layer from '../Layer';
import { TileConfig, TileSystem } from './tileinfo';

/**
 * @classdesc
 * A layer used to display tiled map services, such as [google maps]{@link http://maps.google.com}, [open street maps]{@link http://www.osm.org}
 * @class
 * @category layer
 * @extends Layer
 * @param {String|Number} id - tile layer's id
 * @param {Object} [options=null] - options defined in [TileLayer]{@link TileLayer#options}
 * @example
 * new TileLayer("tile",{
        urlTemplate : 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        subdomains:['a','b','c']
    })
 */
export const TileLayer = Layer.extend(/** @lends TileLayer.prototype */ {

    /**
     * @property {Object}              options                     - TileLayer's options
     * @property {String}              [options.errorTileUrl=null] - tile's url when error
     * @property {String}              options.urlTemplate         - url templates
     * @property {String[]|Number[]}   [options.subdomains=null]   - subdomains to replace '{s}' in urlTemplate
     * @property {Boolean}             [options.repeatWorld=true]  - tiles will be loaded repeatedly outside the world.
     * @property {String}              [options.crossOrigin=null]  - tile Image's corssOrigin
     * @property {Object}              [options.tileSize={'width':256, 'height':256}] - size of the tile image
     * @property {Number[]}            [options.tileSystem=null]   - tile system number arrays
     * @property {Boolean}             [options.debug=false]       - if set to true, tiles will have borders and a title of its coordinates.
     */
    options: {
        'errorTileUrl': null,
        'urlTemplate': null,
        'subdomains': null,

        'gradualLoading': true,

        'repeatWorld': true,

        'renderWhenPanning': false,
        //移图时地图的更新间隔, 默认为0即实时更新, -1表示不更新.如果效率较慢则可改为适当的值
        'updateInterval': (function () {
            return Browser.mobile ? -1 : 200;
        })(),

        'cssFilter': null,

        'crossOrigin': null,

        'tileSize': {
            'width': 256,
            'height': 256
        },

        'tileSystem': null,
        'debug': false,

        'cacheTiles': true,

        'keepBuffer': null,

        'baseLayerRenderer': (function () {
            return isNode ? 'canvas' : 'dom';
        })()
    },


    /**
     * Get tile size of the tile layer
     * @return {Size}
     */
    getTileSize: function () {
        var size = this.options['tileSize'];
        return new Size(size['width'], size['height']);
    },

    /**
     * Clear the layer
     * @return {TileLayer} this
     */
    clear: function () {
        if (this._renderer) {
            this._renderer.clear();
        }
        /**
         * clear event, fired when tile layer is cleared.
         *
         * @event TileLayer#clear
         * @type {Object}
         * @property {String} type - clear
         * @property {TileLayer} target - tile layer
         */
        this.fire('clear');
        return this;
    },

    _initRenderer: function () {
        var renderer = this.options['renderer'];
        if (this.getMap().getBaseLayer() === this) {
            renderer = this.options['baseLayerRenderer'];
            if (this.getMap()._getRenderer()._isCanvasContainer) {
                renderer = 'canvas';
            }
        }
        if (!this.constructor.getRendererClass) {
            return;
        }
        var clazz = this.constructor.getRendererClass(renderer);
        if (!clazz) {
            return;
        }
        this._renderer = new clazz(this);
        this._renderer.setZIndex(this.getZIndex());
        this._switchEvents('on', this._renderer);
    },

    /**
     * initialize [tileConfig]{@link TileConfig} for the tilelayer
     * @private
     */
    _initTileConfig: function () {
        var map = this.getMap();
        this._defaultTileConfig = new TileConfig(TileSystem.getDefault(map.getProjection()), map.getFullExtent(), this.getTileSize());
        if (this.options['tileSystem']) {
            this._tileConfig = new TileConfig(this.options['tileSystem'], map.getFullExtent(), this.getTileSize());
        }
    },

    _getTileConfig: function () {
        if (!this._defaultTileConfig) {
            this._initTileConfig();
        }
        var tileConfig = this._tileConfig;
        if (tileConfig) {
            return tileConfig;
        }
        var map = this.getMap();
        //inherit baselayer's tileconfig
        if (map && map.getBaseLayer() && map.getBaseLayer()._getTileConfig) {
            return map.getBaseLayer()._getTileConfig();
        }
        return this._defaultTileConfig;
    },

    _getTiles: function () {
        // rendWhenReady = false;
        var map = this.getMap();
        if (!map) {
            return null;
        }
        if (!this.isVisible()) {
            return null;
        }

        var tileConfig = this._getTileConfig();
        if (!tileConfig) {
            return null;
        }

        var tileSize = this.getTileSize(),
            zoom = map.getZoom(),
            res = map._getResolution();

        var mapW = map.width,
            mapH = map.height,
            containerCenter = new Point(mapW / 2, mapH / 2),
            containerExtent = map.getContainerExtent();

        //中心瓦片信息,包括瓦片编号,和中心点在瓦片上相对左上角的位置
        var centerTile = tileConfig.getCenterTile(map._getPrjCenter(), res),
            //计算中心瓦片的top和left偏移值
            centerPoint = new Point(mapW / 2 - centerTile['offsetLeft'],
                mapH / 2 - centerTile['offsetTop']);
        var center2D = map._containerPointToPoint(centerPoint);

        var keepBuffer = this.getMask() ? 0 : this.options['keepBuffer'] === null ? map.getBaseLayer() === this ? 1 : 0 : this.options['keepBuffer'];
        //中心瓦片上下左右的瓦片数
        var top = Math.ceil(Math.abs(containerCenter.y - containerExtent['ymin'] - centerTile['offsetTop']) / tileSize['height']) + keepBuffer,
            left = Math.ceil(Math.abs(containerCenter.x - containerExtent['xmin'] - centerTile['offsetLeft']) / tileSize['width']) + keepBuffer,
            bottom = Math.ceil(Math.abs(containerExtent['ymax'] - containerCenter.y + centerTile['offsetTop']) / tileSize['height']) + keepBuffer,
            right = Math.ceil(Math.abs(containerExtent['xmax'] - containerCenter.x + centerTile['offsetLeft']) / tileSize['width']) + keepBuffer;

        var tiles = [],
            fullExtent = new PointExtent(),
            northWest = new Point(center2D.x - left * tileSize['width'], center2D.y - top * tileSize['height']);

        for (var i = -(left); i < right; i++) {
            for (var j = -(top); j < bottom; j++) {
                var tileIndex = tileConfig.getNeighorTileIndex(centerTile['y'], centerTile['x'], j, i, res, this.options['repeatWorld']),
                    tileUrl = this._getTileUrl(tileIndex['x'], tileIndex['y'], zoom),
                    tileId = [tileIndex['y'], tileIndex['x'], zoom].join('__'),
                    tileDesc = {
                        'url': tileUrl,
                        'point': new Point(center2D.x + tileSize['width'] * i, center2D.y + tileSize['height'] * j),
                        'id': tileId,
                        'zoom': zoom
                    };
                tiles.push(tileDesc);
                fullExtent._combine(new PointExtent(
                    tileDesc['point'],
                    tileDesc['point'].add(tileSize['width'], tileSize['height'])
                ));
            }
        }

        //sort tiles according to tile's distance to center
        tiles.sort(function (a, b) {
            return (b['point'].distanceTo(center2D) - a['point'].distanceTo(center2D));
        });
        return {
            'tiles': tiles,
            'fullExtent': fullExtent,
            'northWest': northWest
        };
    },

    _getTileUrl: function (x, y, z) {
        if (!this.options['urlTemplate']) {
            return this.options['errorTileUrl'];
        }
        var urlTemplate = this.options['urlTemplate'];
        var domain = '';
        if (this.options['subdomains']) {
            var subdomains = this.options['subdomains'];
            if (isArrayHasData(subdomains)) {
                var length = subdomains.length;
                var s = (x + y) % length;
                if (s < 0) {
                    s = 0;
                }
                domain = subdomains[s];
            }
        }
        if (isFunction(urlTemplate)) {
            return urlTemplate(x, y, z, domain);
        }
        var data = {
            'x': x,
            'y': y,
            'z': z,
            's': domain
        };
        return urlTemplate.replace(/\{ *([\w_]+) *\}/g, function (str, key) {
            var value = data[key];

            if (value === undefined) {
                throw new Error('No value provided for variable ' + str);

            } else if (typeof value === 'function') {
                value = value(data);
            }
            return value;
        });
    }
});

/**
 * Export the tile layer's profile json. <br>
 * Layer's profile is a snapshot of the layer in JSON format. <br>
 * It can be used to reproduce the instance by [fromJSON]{@link Layer#fromJSON} method
 * @return {Object} layer's profile JSON
 */
TileLayer.prototype.toJSON = function () {
    var profile = {
        'type': 'TileLayer',
        'id': this.getId(),
        'options': this.config()
    };
    return profile;
};

/**
 * Reproduce a TileLayer from layer's profile JSON.
 * @param  {Object} layerJSON - layer's profile JSON
 * @return {TileLayer}
 * @static
 * @private
 * @function
 */
TileLayer.fromJSON = function (layerJSON) {
    if (!layerJSON || layerJSON['type'] !== 'TileLayer') {
        return null;
    }
    return new TileLayer(layerJSON['id'], layerJSON['options']);
};
