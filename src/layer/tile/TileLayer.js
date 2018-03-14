import { IS_NODE, isNil, isArrayHasData, isFunction, isInteger } from '../../core/util';
import Browser from '../../core/Browser';
import Size from '../../geo/Size';
import PointExtent from '../../geo/PointExtent';
import TileConfig from './tileinfo/TileConfig';
import TileSystem from './tileinfo/TileSystem';
import Layer from '../Layer';
import SpatialReference from '../../map/spatial-reference/SpatialReference';

/**
 * @property {Object}              options                     - TileLayer's options
 * @property {String|Function}     options.urlTemplate         - url templates
 * @property {String[]|Number[]}   [options.subdomains=null]   - subdomains to replace '{s}' in urlTemplate
 * @property {Object}              [options.spatialReference=null] - TileLayer's spatial reference
 * @property {Number[]}            [options.tileSize=[256, 256]] - size of the tile image, [width, height]
 * @property {Number[]|Function}   [options.offset=[0, 0]]       - overall tile offset, [dx, dy], useful for tile sources from difference coordinate systems, e.g. (wgs84 and gcj02)
 * @property {Number[]}            [options.tileSystem=null]     - tile system number arrays
 * @property {Number}              [options.maxAvailableZoom=null] - Maximum zoom level for which tiles are available. Data from tiles at the maxzoom are used when displaying the map at higher zoom levels.
 * @property {Boolean}             [options.repeatWorld=true]  - tiles will be loaded repeatedly outside the world.
 * @property {Boolean}             [options.background=true]   - whether to draw a background during or after interacting, true by default
 * @property {Number}              [options.backgroundZoomDiff=6] - the zoom diff to find parent tile as background
 * @property {Boolean|Function}    [options.placeholder=false]    - a placeholder image to replace loading tile, can be a function with a parameter of the tile canvas
 * @property {String}              [options.fragmentShader=null]  - custom fragment shader, replace <a href="https://github.com/maptalks/maptalks.js/blob/master/src/renderer/layer/tilelayer/TileLayerGLRenderer.js#L8">the default fragment shader</a>
 * @property {String}              [options.crossOrigin=null]    - tile image's corssOrigin
 * @property {Boolean}             [options.fadeAnimation=true]  - fade animation when loading tiles
 * @property {Boolean}             [options.debug=false]         - if set to true, tiles will have borders and a title of its coordinates.
 * @property {String}              [options.renderer=gl]         - TileLayer's renderer, canvas or gl. gl tiles requires image CORS that canvas doesn't. canvas tiles can't pitch.
 * @property {Number}              [options.maxCacheSize=256]    - maximum number of tiles to cache
 * @memberOf TileLayer
 * @instance
 */
const options = {
    'urlTemplate': null,
    'subdomains': null,

    'repeatWorld': true,

    'background' : true,
    'backgroundZoomDiff' : 6,

    'placeholder' : false,

    'crossOrigin': null,

    'tileSize': [256, 256],

    'offset' : [0, 0],

    'tileSystem': null,

    'fadeAnimation' : !IS_NODE,

    'debug': false,

    'spatialReference' : null,

    'maxCacheSize' : 256,

    'renderer' : (() => {
        return Browser.webgl ? 'gl' : 'canvas';
    })(),

    'clipByPitch' : true,

    'maxAvailableZoom' : null
};

const urlPattern = /\{ *([\w_]+) *\}/g;

const MAX_VISIBLE_SIZE = 5;

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
     * Get tile's url
     * @param {Number} x
     * @param {Number} y
     * @param {Number} z
     * @returns {String} url
     */
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
        return urlTemplate.replace(urlPattern, function (str, key) {
            let value = data[key];

            if (value === undefined) {
                throw new Error('No value provided for variable ' + str);

            } else if (typeof value === 'function') {
                value = value(data);
            }
            return value;
        });
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
        const maxZoom = this.options['maxAvailableZoom'];
        if (!isNil(maxZoom) && zoom > maxZoom) {
            zoom = maxZoom;
        }
        return zoom;
    }

    _getTiles(z) {
        // rendWhenReady = false;
        const map = this.getMap();
        if (!map || !this.isVisible() || !map.width || !map.height) {
            return null;
        }

        const tileConfig = this._getTileConfig();
        if (!tileConfig) {
            return null;
        }

        const zoom = isNil(z) ? this._getTileZoom() : z;
        const emptyGrid = {
            'zoom' : zoom,
            'extent' : null,
            'tiles' : []
        };

        const offset = this._getTileOffset(zoom);
        const hasOffset = offset[0] || offset[1];

        let containerExtent = map.getContainerExtent();
        const extent2d = map._get2DExtent()._add(offset);
        const maskExtent = this._getMask2DExtent();
        if (maskExtent) {
            const intersection = maskExtent.intersection(extent2d);
            if (!intersection) {
                return emptyGrid;
            }
            containerExtent = intersection.convertTo(c => map._pointToContainerPoint(c));
        }
        const sr = this._sr;
        const mapSR = map.getSpatialReference();
        const res = sr.getResolution(zoom);

        //Get description of center tile including left and top offset
        let c;
        if (hasOffset) {
            c = this._project(map._pointToPrj(map._prjToPoint(map._getPrjCenter())._add(offset)));
        } else {
            c = this._project(map._getPrjCenter());
        }
        const pmin = this._project(map._pointToPrj(extent2d.getMin())),
            pmax = this._project(map._pointToPrj(extent2d.getMax()));

        const centerTile = tileConfig.getTileIndex(c, res),
            ltTile = tileConfig.getTileIndex(pmin, res),
            rbTile = tileConfig.getTileIndex(pmax, res);

        //Number of tiles around the center tile
        const top = Math.ceil(Math.abs(centerTile.y - ltTile.y)),
            left = Math.ceil(Math.abs(centerTile.x - ltTile.x)),
            bottom = Math.ceil(Math.abs(centerTile.y - rbTile.y)),
            right = Math.ceil(Math.abs(centerTile.x - rbTile.x));
        const layerId = this.getId(),
            renderer = this.getRenderer(),
            tileSize = this.getTileSize(),
            scale = this._getTileConfig().tileSystem.scale;
        const tiles = [], extent = new PointExtent();
        for (let i = -(left); i <= right; i++) {
            for (let j = -(top); j <= bottom; j++) {
                const idx = tileConfig.getNeighorTileIndex(centerTile['x'], centerTile['y'], i, j, res, this.options['repeatWorld']),
                    pnw = tileConfig.getTilePrjNW(idx.x, idx.y, res),
                    p = map._prjToPoint(this._unproject(pnw), zoom);
                let width, height;
                if (sr === mapSR) {
                    width = tileSize.width;
                    height = tileSize.height;
                } else {
                    const pse = tileConfig.getTilePrjSE(idx.x, idx.y, res),
                        pp = map._prjToPoint(this._unproject(pse), zoom);
                    width = Math.abs(Math.round(pp.x - p.x));
                    height = Math.abs(Math.round(pp.y - p.y));
                }
                const dx = scale.x * (idx.idx - idx.x) * width,
                    dy = -scale.y * (idx.idy - idx.y) * height;
                if (dx || dy) {
                    p._add(dx, dy);
                }
                if (sr !== mapSR) {
                    width++; //plus 1 to prevent white gaps
                    height++;
                }
                if (hasOffset) {
                    p._sub(offset);
                }
                const tileExtent = new PointExtent(p, p.add(width, height)),
                    tileInfo = {
                        'point': p,
                        'z': zoom,
                        'x' : idx.x,
                        'y' : idx.y,
                        'extent2d' : tileExtent
                    };
                if (this._isTileInExtent(tileInfo, containerExtent)) {
                    if (hasOffset) {
                        tileInfo.point._add(offset);
                        tileInfo.extent2d._add(offset);
                    }
                    tileInfo['size'] = [width, height];
                    tileInfo['dupKey'] = p.round().toArray().join() + ',' + width + ',' + height; //duplicate key of the tile
                    tileInfo['id'] = this._getTileId(idx, zoom); //unique id of the tile
                    tileInfo['layer'] = layerId;
                    if (!renderer || !renderer.isTileCachedOrLoading(tileInfo.id)) {
                        //getTileUrl is expensive, save it when tile is being processed by renderer
                        tileInfo['url'] = this.getTileUrl(idx.x, idx.y, zoom);
                    }
                    tiles.push(tileInfo);
                    extent._combine(tileExtent);
                }
            }
        }

        //sort tiles according to tile's distance to center
        const center = map._containerPointToPoint(containerExtent.getCenter(), zoom)._add(offset);
        tiles.sort(function (a, b) {
            return a.point.distanceTo(center) - b.point.distanceTo(center);
        });

        return {
            'offset' : offset,
            'zoom' : zoom,
            'extent' : extent,
            'tiles': tiles
        };
    }

    _getTileOffset(z) {
        const map = this.getMap();
        const scale = map._getResolution() / map._getResolution(z);
        let offset = this.options['offset'];
        if (isFunction(offset)) {
            offset = offset(this);
        }
        offset[0] *= scale;
        offset[1] *= scale;
        return offset;
    }

    _getTileId(idx, zoom, id) {
        //id is to mark GroupTileLayer's child layers
        return [id || this.getId(), idx.idy, idx.idx, zoom].join('__');
    }


    _project(pcoord) {
        const map = this.getMap();
        const sr = this._sr;
        if (sr !== map.getSpatialReference()) {
            return sr.getProjection().project(map.getProjection().unproject(pcoord));
        } else {
            return pcoord;
        }
    }

    _unproject(pcoord) {
        const map = this.getMap();
        const sr = this._sr;
        if (sr !== map.getSpatialReference()) {
            return map.getProjection().project(sr.getProjection().unproject(pcoord));
        } else {
            return pcoord;
        }
    }

    /**
     * initialize [tileConfig]{@link TileConfig} for the tilelayer
     * @private
     */
    _initTileConfig() {
        const map = this.getMap(),
            sr = this.options['spatialReference'] ? new SpatialReference(this.options['spatialReference']) : map.getSpatialReference(),
            tileSize = this.getTileSize();
        this._sr = sr;
        const projection = sr.getProjection(),
            fullExtent = sr.getFullExtent();
        this._defaultTileConfig = new TileConfig(TileSystem.getDefault(projection), fullExtent, tileSize);
        if (this.options['tileSystem']) {
            this._tileConfig = new TileConfig(this.options['tileSystem'], fullExtent, tileSize);
        }
        //inherit baselayer's tileconfig
        if (map && !this._tileConfig &&
            map.getSpatialReference() === sr &&
            map.getBaseLayer() &&
            map.getBaseLayer() !== this &&
            map.getBaseLayer()._getTileConfig) {
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

    _bindMap(map) {
        const baseLayer = map.getBaseLayer();
        if (baseLayer === this) {
            if (!baseLayer.options.hasOwnProperty('forceRenderOnMoving')) {
                this.config({
                    'forceRenderOnMoving': true
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
        if (tileExtent.getWidth() < MAX_VISIBLE_SIZE || tileExtent.getHeight() < MAX_VISIBLE_SIZE) {
            return false;
        }
        return extent.intersects(tileExtent);
    }

    getEvents() {
        return {
            'spatialreferencechange' : this._onSpatialReferenceChange
        };
    }

    _onSpatialReferenceChange() {
        delete this._tileConfig;
        delete this._defaultTileConfig;
        delete this._sr;
    }
}

TileLayer.registerJSONType('TileLayer');

TileLayer.mergeOptions(options);

export default TileLayer;
