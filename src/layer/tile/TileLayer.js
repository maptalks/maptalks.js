import { IS_NODE, isArrayHasData, isFunction, isInteger } from 'core/util';
import Browser from 'core/Browser';
import Point from 'geo/Point';
import Size from 'geo/Size';
import TileConfig from './tileinfo/TileConfig';
import TileSystem from './tileinfo/TileSystem';
import Layer from '../Layer';

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
 * @memberOf TileLayer
 * @instance
 */
const options = {
    'errorTileUrl': null,
    'urlTemplate': null,
    'subdomains': null,

    'repeatWorld': true,

    'renderOnMoving': false,
    'renderOnRotating' : false,
    //移图时地图的更新间隔, 默认为0即实时更新, -1表示不更新.如果效率较慢则可改为适当的值
    'updateInterval': (() => {
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

    'container' : 'back',

    'baseLayerRenderer': (() => {
        return IS_NODE ? 'canvas' : 'dom';
    })()
};


/**
 * @classdesc
 * A layer used to display tiled map services, such as [google maps]{@link http://maps.google.com}, [open street maps]{@link http://www.osm.org}
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
class TileLayer extends Layer {

    /**
     * Reproduce a TileLayer from layer's profile JSON.
     * @param  {Object} layerJSON - layer's profile JSON
     * @return {TileLayer}
     * @static
     * @private
     * @function
     */
    static fromJSON(layerJSON) {
        if (!layerJSON || layerJSON['type'] !== 'TileLayer') {
            return null;
        }
        return new TileLayer(layerJSON['id'], layerJSON['options']);
    }


    /**
     * Get tile size of the tile layer
     * @return {Size}
     */
    getTileSize() {
        const size = this.options['tileSize'];
        return new Size(size['width'], size['height']);
    }

    /**
     * Get tile descriptors
     * @return {Object[]} tile descriptors
     */
    getTiles() {
        return this._getTiles();
    }

    /**
     * Clear the layer
     * @return {TileLayer} this
     */
    clear() {
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
    }

    /**
     * Export the tile layer's profile json. <br>
     * Layer's profile is a snapshot of the layer in JSON format. <br>
     * It can be used to reproduce the instance by [fromJSON]{@link Layer#fromJSON} method
     * @return {Object} layer's profile JSON
     */
    toJSON() {
        const profile = {
            'type': this.getJSONType(),
            'id': this.getId(),
            'options': this.config()
        };
        return profile;
    }

    _getTiles() {
        // rendWhenReady = false;
        const map = this.getMap();
        if (!map) {
            return null;
        }
        if (!this.isVisible()) {
            return null;
        }

        const tileConfig = this._getTileConfig();
        if (!tileConfig) {
            return null;
        }

        const tileSize = this.getTileSize(),
            tileW = tileSize['width'],
            tileH = tileSize['height'];
        let zoom = map.getZoom();
        if (!isInteger(zoom)) {
            if (map.isZooming()) {
                zoom = (zoom > map._frameZoom ? Math.floor(zoom) : Math.ceil(zoom));
            } else {
                zoom = Math.round(zoom);
            }
        }

        const res = map._getResolution(zoom);

        const extent2d = map._get2DExtent(zoom);
        const containerCenter = new Point(map.width / 2, map.height / 2),
            center2d = map._containerPointToPoint(containerCenter, zoom);
        if (extent2d.getWidth() === 0 || extent2d.getHeight() === 0) {
            return {
                'tiles' : []
            };
        }

        //Get description of center tile including left and top offset
        const centerTile = tileConfig.getCenterTile(map._getPrjCenter(), res);
        const offset = centerTile['offset'];
        const center2D = map._prjToPoint(map._getPrjCenter(), zoom)._sub(offset.x, offset.y);
        const mapOffset = map.offsetPlatform();
        const scale = map._getResolution() / res;
        const centerViewPoint = containerCenter.sub((scale !== 1 ? mapOffset.multi(scale) : mapOffset))._sub(offset.x, offset.y)._round();

        const keepBuffer = this.getMask() ? 0 : this.options['keepBuffer'] === null ? map.isTransforming() ? 0 : map.getBaseLayer() === this ? 1 : 0 : this.options['keepBuffer'];

        //Number of tiles around the center tile
        const top = Math.ceil(Math.abs(center2d.y - extent2d['ymin'] - offset.y) / tileH) + keepBuffer,
            left = Math.ceil(Math.abs(center2d.x - extent2d['xmin'] - offset.x) / tileW) + keepBuffer,
            bottom = Math.ceil(Math.abs(extent2d['ymax'] - center2d.y + offset.y) / tileH) + keepBuffer,
            right = Math.ceil(Math.abs(extent2d['xmax'] - center2d.x + offset.x) / tileW) + keepBuffer;

        const tiles = [];
        let centerTileId;
        for (let i = -(left); i < right; i++) {
            for (let j = -(top); j < bottom; j++) {
                const p = new Point(center2D.x + tileW * i, center2D.y + tileH * j);
                const vp = new Point(centerViewPoint.x + tileW * i, centerViewPoint.y + tileH * j);
                const tileIndex = tileConfig.getNeighorTileIndex(centerTile['x'], centerTile['y'], i, j, res, this.options['repeatWorld']),
                    tileUrl = this._getTileUrl(tileIndex['x'], tileIndex['y'], zoom),
                    tileId = [tileIndex['idy'], tileIndex['idx'], zoom].join('__'),
                    tileDesc = {
                        'url': tileUrl,
                        'point': p,
                        'viewPoint' : vp,
                        'id': tileId,
                        'z': zoom,
                        'x' : tileIndex['x'],
                        'y' : tileIndex['y']
                    };
                tiles.push(tileDesc);
                if (i === 0 && j === 0) {
                    centerTileId = tileId;
                }
            }
        }

        //sort tiles according to tile's distance to center
        tiles.sort(function (a, b) {
            return (b['point'].distanceTo(center2D) - a['point'].distanceTo(center2D));
        });
        return {
            'zoom' : zoom,
            'center' : centerTileId,
            'centerViewPoint' : centerViewPoint,
            'tiles': tiles
        };
    }

    _initRenderer() {
        let renderer = this.options['renderer'];
        if (this.getMap().getBaseLayer() === this) {
            renderer = this.options['baseLayerRenderer'];
            if (this.getMap()._getRenderer()._containerIsCanvas) {
                renderer = 'canvas';
            }
        }
        if (!this.constructor.getRendererClass) {
            return;
        }
        const clazz = this.constructor.getRendererClass(renderer);
        if (!clazz) {
            return;
        }
        this._renderer = new clazz(this);
        this._renderer.setZIndex(this.getZIndex());
        this._switchEvents('on', this._renderer);
    }

    /**
     * initialize [tileConfig]{@link TileConfig} for the tilelayer
     * @private
     */
    _initTileConfig() {
        const map = this.getMap();
        this._defaultTileConfig = new TileConfig(TileSystem.getDefault(map.getProjection()), map.getFullExtent(), this.getTileSize());
        if (this.options['tileSystem']) {
            this._tileConfig = new TileConfig(this.options['tileSystem'], map.getFullExtent(), this.getTileSize());
        }
        //inherit baselayer's tileconfig
        if (map && map.getBaseLayer() && map.getBaseLayer() !== this && map.getBaseLayer()._getTileConfig) {
            const base = map.getBaseLayer()._getTileConfig();
            this._tileConfig = new TileConfig(base.tileSystem, base.fullExtent, this.getTileSize());
        }
    }

    _getTileConfig() {
        if (!this._defaultTileConfig) {
            this._initTileConfig();
        }
        return this._tileConfig || this._defaultTileConfig;
    }

    _getTileUrl(x, y, z) {
        if (!this.options['urlTemplate']) {
            return this.options['errorTileUrl'];
        }
        const urlTemplate = this.options['urlTemplate'];
        let domain = '';
        if (this.options['subdomains']) {
            const subdomains = this.options['subdomains'];
            if (isArrayHasData(subdomains)) {
                const length = subdomains.length;
                let s = (x + y) % length;
                if (s < 0) {
                    s = 0;
                }
                domain = subdomains[s];
            }
        }
        if (isFunction(urlTemplate)) {
            return urlTemplate(x, y, z, domain);
        }
        const data = {
            'x': x,
            'y': y,
            'z': z,
            's': domain
        };
        return urlTemplate.replace(/\{ *([\w_]+) *\}/g, function (str, key) {
            let value = data[key];

            if (value === undefined) {
                throw new Error('No value provided for variable ' + str);

            } else if (typeof value === 'function') {
                value = value(data);
            }
            return value;
        });
    }
}

TileLayer.registerJSONType('TileLayer');

TileLayer.mergeOptions(options);

export default TileLayer;
