import { IS_NODE, isNil, isArrayHasData, isFunction, isInteger } from 'core/util';
import Browser from 'core/Browser';
import Point from 'geo/Point';
import Size from 'geo/Size';
import PointExtent from 'geo/PointExtent';
import TileConfig from './tileinfo/TileConfig';
import TileSystem from './tileinfo/TileSystem';
import Layer from '../Layer';

/**
 * @property {Object}              options                     - TileLayer's options
 * @property {String}              options.urlTemplate         - url templates
 * @property {String[]|Number[]}   [options.subdomains=null]   - subdomains to replace '{s}' in urlTemplate
 * @property {Boolean}             [options.repeatWorld=true]  - tiles will be loaded repeatedly outside the world.
 * @property {String}              [options.fragmentShader=null]  - custom fragment shader, replace <a href="https://github.com/maptalks/maptalks.js/blob/master/src/renderer/layer/tilelayer/TileLayerGLRenderer.js#L8">the default fragment shader</a>
 * @property {String}              [options.crossOrigin=null]  - tile image's corssOrigin
 * @property {Number[]}            [options.tileSize=[256, 256]] - size of the tile image, [width, height]
 * @property {Number[]}            [options.tileSystem=null]     - tile system number arrays
 * @property {Boolean}             [options.fadeAnimation=true]  - fade animation when loading tiles
 * @property {Boolean}             [options.debug=false]         - if set to true, tiles will have borders and a title of its coordinates.
 * @property {Boolean}             [options.cacheTiles=true]     - whether cache tiles
 * @property {Boolean}             [options.renderOnMoving=false]  - whether render layer when moving map
 * @property {String}              [options.renderer=gl]         - TileLayer's renderer, canvas or gl. gl tiles requires image CORS that canvas doesn't. canvas tiles can't pitch.
 * @memberOf TileLayer
 * @instance
 */
const options = {
    'urlTemplate': null,
    'subdomains': null,

    'repeatWorld': true,

    //map's animation duration to start tilelayer's animation
    'durationToAnimate' : 2000,
    //the update interval to render tiles during tilelayer's animation
    'updateIntervalOnAnimating' : 400,

    'cssFilter': null,

    'crossOrigin': null,

    'tileSize': [256, 256],

    'tileSystem': null,

    'fadeAnimation' : !IS_NODE,

    'debug': false,

    'cacheTiles': true,

    'renderer' : (() => {
        return Browser.webgl ? 'gl' : 'canvas';
    })(),

    'renderOnMoving' : false
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
        return new Size(this.options['tileSize']);
    }

    /**
     * Get tiles at zoom z (or current zoom)
     * @param {Number} z - zoom
     * @return {Object[]} tile descriptors
     */
    getTiles(z) {
        return this._getTiles(z);
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

    _getTileZoom() {
        const map = this.getMap();
        let zoom = map.getZoom();
        if (!isInteger(zoom)) {
            if (map.isZooming()) {
                zoom = (zoom > map._frameZoom ? Math.floor(zoom) : Math.ceil(zoom));
            } else {
                zoom = Math.round(zoom);
            }
        }
        return zoom;
    }

    _getTiles(z) {
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
            width = tileSize['width'],
            height = tileSize['height'];
        const zoom = isNil(z) ? this._getTileZoom() : z;

        const res = map.getResolution(zoom),
            extent2d = map._get2DExtent(zoom),
            containerCenter = new Point(map.width / 2, map.height / 2),
            center2d = map._containerPointToPoint(containerCenter, zoom);
        if (extent2d.getWidth() === 0 || extent2d.getHeight() === 0) {
            return {
                'zoom' : zoom,
                'anchor' : null,
                'tiles' : []
            };
        }

        //Get description of center tile including left and top offset
        const centerTile = tileConfig.getCenterTile(map._getPrjCenter(), res),
            offset = centerTile['offset'],
            center2D = map._prjToPoint(map._getPrjCenter(), zoom)._sub(offset.x, offset.y),
            mapVP = map.getViewPoint();

        const scale = map.getResolution() / res,
            centerVP = containerCenter.sub((scale !== 1 ? mapVP.multi(scale) : mapVP))._sub(offset.x, offset.y)._round();

        const keepBuffer = 1;

        //Number of tiles around the center tile
        const top = Math.ceil(Math.abs(center2d.y - extent2d.ymin - offset.y) / height) + keepBuffer,
            left = Math.ceil(Math.abs(center2d.x - extent2d.xmin - offset.x) / width) + keepBuffer,
            bottom = Math.ceil(Math.abs(extent2d.ymax - center2d.y + offset.y) / height) + keepBuffer,
            right = Math.ceil(Math.abs(extent2d.xmax - center2d.x + offset.x) / width) + keepBuffer;
        const layerId = this.getId();
        const tiles = [];
        for (let i = -(left); i < right; i++) {
            for (let j = -(top); j < bottom; j++) {
                const p = new Point(center2D.x + width * i, center2D.y + height * j),
                    vp = new Point(centerVP.x + width * i, centerVP.y + height * j),
                    idx = tileConfig.getNeighorTileIndex(centerTile['x'], centerTile['y'], i, j, res, this.options['repeatWorld']),
                    url = this.getTileUrl(idx['x'], idx['y'], zoom),
                    id = [layerId, idx['idy'], idx['idx'], zoom].join('__'),
                    tileExtent = new PointExtent(p, p.add(width, height)),
                    desc = {
                        'url': url,
                        'point': p,
                        'viewPoint' : vp,
                        'id': id,
                        'z': zoom,
                        'x' : idx['x'],
                        'y' : idx['y'],
                        'extent2d' : tileExtent
                    };
                tiles.push(desc);
            }
        }

        //sort tiles according to tile's distance to center
        tiles.sort(function (a, b) {
            return (b.point.distanceTo(center2D) - a.point.distanceTo(center2D));
        });

        //tile's view point at 0, 0, zoom
        const tileSystem = tileConfig.tileSystem;
        const anchor = centerVP.sub(centerTile.x * width * tileSystem.scale.x, -centerTile.y * height * tileSystem.scale.y);
        anchor.zoom = zoom;
        return {
            'zoom' : zoom,
            'anchor' : anchor,
            'extent' : new PointExtent(center2D - left * width, center2D - top * height, center2D + right * width, center2D + bottom * height),
            'tiles': tiles
        };
    }

    _initRenderer() {
        const renderer = this.options['renderer'];
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
        const map = this.getMap(),
            tileSize = this.getTileSize();
        this._defaultTileConfig = new TileConfig(TileSystem.getDefault(map.getProjection()), map.getFullExtent(), tileSize);
        if (this.options['tileSystem']) {
            this._tileConfig = new TileConfig(this.options['tileSystem'], map.getFullExtent(), tileSize);
        }
        //inherit baselayer's tileconfig
        if (map && map.getBaseLayer() && map.getBaseLayer() !== this && map.getBaseLayer()._getTileConfig) {
            const base = map.getBaseLayer()._getTileConfig();
            this._tileConfig = new TileConfig(base.tileSystem, base.fullExtent, tileSize);
        }
    }

    _getTileConfig() {
        if (!this._defaultTileConfig) {
            this._initTileConfig();
        }
        return this._tileConfig || this._defaultTileConfig;
    }

    getTileUrl(x, y, z) {
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

    _bindMap(map) {
        const baseLayer = map.getBaseLayer();
        if (baseLayer === this) {
            if (!baseLayer.options.hasOwnProperty('renderOnMoving')) {
                this.config({
                    'renderOnMoving': true
                });
            }
        }
        return super._bindMap.apply(this, arguments);
    }

    _isTileInExtent(tileInfo, extent) {
        const map = this.getMap();
        if (!map) {
            return false;
        }
        const tileZoom = tileInfo.z;
        const tileExtent = tileInfo.extent2d.convertTo(c => map._pointToContainerPoint(c, tileZoom));
        // add some buffer
        return extent.intersects(tileExtent._expand(1));
    }
}

TileLayer.registerJSONType('TileLayer');

TileLayer.mergeOptions(options);

export default TileLayer;
