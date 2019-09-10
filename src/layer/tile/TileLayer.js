import { IS_NODE, isNil, isNumber, isArrayHasData, isFunction, isInteger } from '../../core/util';
import Browser from '../../core/Browser';
import Size from '../../geo/Size';
import Point from '../../geo/Point';
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
 * @property {Number}              [options.maxAvailableZoom=null] - Maximum zoom level for which tiles are available. Data from tiles at the maxAvailableZoom are used when displaying the map at higher zoom levels.
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
 * @property {Boolean}             [options.cascadeTiles=true]      - draw cascaded tiles of different zooms to reduce tiles
 * @property {Number}              [options.minPitchToCascade=35]   - minimum pitch degree to begin tile cascade
 * @property {Number}              [options.zoomOffset=0]           - offset from map's zoom to tile's zoom
 * @property {Number}              [options.tileRetryCount=0]       - retry count of tiles
 * @memberOf TileLayer
 * @instance
 */
const options = {

    'urlTemplate': null,
    'subdomains': null,

    'repeatWorld': true,

    'background' : true,
    'backgroundZoomDiff' : 6,

    'loadingLimitOnInteracting' : 3,

    'tileRetryCount' : 0,

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

    'maxAvailableZoom' : null,

    'cascadeTiles' : true,
    'minPitchToCascade' : 35,

    'zoomOffset' : 0
};

const URL_PATTERN = /\{ *([\w_]+) *\}/g;

// const MAX_VISIBLE_SIZE = 5;

const TEMP_POINT = new Point(0, 0);
const TEMP_POINT0 = new Point(0, 0);
const TEMP_POINT1 = new Point(0, 0);
const TEMP_POINT2 = new Point(0, 0);
const TEMP_POINT3 = new Point(0, 0);
const TEMP_POINT_EXTENT = new PointExtent();

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
        let size = this.options['tileSize'];
        if (isNumber(size)) {
            size = [size, size];
        }
        return new Size(size);
    }

    /**
     * Get tiles at zoom z (or current zoom)
     * @param {Number} z - zoom
     * @return {Object[]} tile descriptors
     */
    getTiles(z, parentLayer) {
        const map = this.getMap();
        const parentRenderer = parentLayer && parentLayer.getRenderer();
        const mapExtent = map.getContainerExtent();
        const tileGrids = [];
        let count = 0;
        const minZoom = this.getMinZoom();
        const minPitchToCascade = this.options['minPitchToCascade'];
        const tileZoom = isNil(z) ? this._getTileZoom(map.getZoom()) : z;
        if (
            !isNil(z) ||
            !this.options['cascadeTiles'] ||
            map.getPitch() <= minPitchToCascade ||
            !isNil(minZoom) && tileZoom <= minZoom
        ) {
            const currentTiles = this._getTiles(tileZoom, mapExtent, undefined, parentRenderer);
            if (currentTiles) {
                count += currentTiles.tiles.length;
                tileGrids.push(currentTiles);
            }
            return {
                tileGrids, count
            };
        }

        const visualHeight = Math.floor(map._getVisualHeight(minPitchToCascade));
        const extent0 = new PointExtent(0, map.height - visualHeight, map.width, map.height);
        const currentTiles = this._getTiles(tileZoom, extent0, 0, parentRenderer);
        count += currentTiles ? currentTiles.tiles.length : 0;

        const extent1 = new PointExtent(0, mapExtent.ymin, map.width, extent0.ymin);
        const d = map.getSpatialReference().getZoomDirection();
        const parentTiles = this._getTiles(tileZoom - d, extent1, 1, parentRenderer);
        count += parentTiles ? parentTiles.tiles.length : 0;

        tileGrids.push(currentTiles, parentTiles);
        return {
            tileGrids, count
        };
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
        return urlTemplate.replace(URL_PATTERN, function (str, key) {
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

    /**
     * Get tilelayer's spatial reference.
     * @returns {SpatialReference} spatial reference
     */
    getSpatialReference() {
        const map = this.getMap();
        if  (map && (!this.options['spatialReference'] || SpatialReference.equals(this.options['spatialReference'], map.options['spatialReference']))) {
            return map.getSpatialReference();
        }
        this._sr = this._sr || new SpatialReference(this.options['spatialReference']);
        if (this._srMinZoom === undefined) {
            this._srMinZoom = this._sr.getMinZoom();
            this._srMaxZoom = this._sr.getMaxZoom();
        }
        return this._sr;
    }

    getMinZoom() {
        const sr = this.getSpatialReference();
        if (sr !== this.getMap().getSpatialReference()) {
            return Math.max(super.getMinZoom(), this._srMinZoom);
        }
        return super.getMinZoom();
    }

    getMaxZoom() {
        const sr = this.getSpatialReference();
        if (sr !== this.getMap().getSpatialReference()) {
            return Math.min(super.getMaxZoom(), this._srMaxZoom);
        }
        return super.getMaxZoom();
    }

    _getTileZoom(zoom) {
        if (!isInteger(zoom)) {
            zoom = Math.round(zoom);
        }
        const maxZoom = this.options['maxAvailableZoom'];
        if (!isNil(maxZoom) && zoom > maxZoom) {
            zoom = maxZoom;
        }
        return zoom;
    }

    _getTiles(z, containerExtent, maskID, parentRenderer) {
        // rendWhenReady = false;
        const map = this.getMap();
        const zoom = z + this.options['zoomOffset'];
        const offset = this._getTileOffset(zoom),
            hasOffset = offset[0] || offset[1];
        const emptyGrid = {
            'zoom' : z,
            'extent' : null,
            'offset' : offset,
            'tiles' : []
        };
        if (zoom < 0) {
            return emptyGrid;
        }
        const minZoom = this.getMinZoom(),
            maxZoom = this.getMaxZoom();
        if (!map || !this.isVisible() || !map.width || !map.height) {
            return emptyGrid;
        }
        if (!isNil(minZoom) && z < minZoom ||
            !isNil(maxZoom) && z > maxZoom) {
            return emptyGrid;
        }
        const tileConfig = this._getTileConfig();
        if (!tileConfig) {
            return emptyGrid;
        }

        const sr = this.getSpatialReference(),
            mapSR = map.getSpatialReference(),
            res = sr.getResolution(zoom);

        const extent2d = containerExtent.convertTo(c => map._containerPointToPoint(c, undefined, TEMP_POINT));
        const innerExtent2D = this._getInnerExtent(z, containerExtent, extent2d)._add(offset);
        extent2d._add(offset);
        const offsetExtent2D = extent2d.sub(offset);

        const maskExtent = this._getMask2DExtent();
        if (maskExtent) {
            const intersection = maskExtent.intersection(extent2d);
            if (!intersection) {
                return emptyGrid;
            }
            containerExtent = intersection.convertTo(c => map._pointToContainerPoint(c, undefined, 0, TEMP_POINT));
        }

        //Get description of center tile including left and top offset
        const prjCenter = map._containerPointToPrj(containerExtent.getCenter(), TEMP_POINT0);
        let c;
        if (hasOffset) {
            c = this._project(map._pointToPrj(map._prjToPoint(prjCenter, undefined, TEMP_POINT1)._add(offset), undefined, TEMP_POINT1), TEMP_POINT1);
        } else {
            c = this._project(prjCenter, TEMP_POINT1);
        }

        TEMP_POINT2.x = extent2d.xmin;
        TEMP_POINT2.y = extent2d.ymin;
        TEMP_POINT3.x = extent2d.xmax;
        TEMP_POINT3.y = extent2d.ymax;
        const pmin = this._project(map._pointToPrj(TEMP_POINT2, undefined, TEMP_POINT2), TEMP_POINT2);
        const pmax = this._project(map._pointToPrj(TEMP_POINT3, undefined, TEMP_POINT3), TEMP_POINT3);

        const centerTile = tileConfig.getTileIndex(c, res);
        const ltTile = tileConfig.getTileIndex(pmin, res);
        const rbTile = tileConfig.getTileIndex(pmax, res);

        // Number of tiles around the center tile
        const top = Math.ceil(Math.abs(centerTile.y - ltTile.y)),
            left = Math.ceil(Math.abs(centerTile.x - ltTile.x)),
            bottom = Math.ceil(Math.abs(centerTile.y - rbTile.y)),
            right = Math.ceil(Math.abs(centerTile.x - rbTile.x));
        const tileSize = this.getTileSize();
        const layerId = this.getId(),
            renderer = this.getRenderer() || parentRenderer,
            scale = this._getTileConfig().tileSystem.scale;
        const visited = {};
        const tiles = [], extent = new PointExtent();
        for (let i = -top; i <= bottom; i++) {
            let j = -left;
            let leftVisitEnd = -Infinity;
            let rightVisitEnd = false;
            while (j >= leftVisitEnd && j <= right) {
                const idx = tileConfig.getNeighorTileIndex(centerTile['x'], centerTile['y'], j, i, res, sr === mapSR && this.options['repeatWorld']);
                if (leftVisitEnd === -Infinity) {
                    //从左往右遍历中
                    j++;
                } else {
                    //从右往左遍历中
                    j--;
                }
                if (idx.out) {
                    continue;
                }
                let hasCachedInfo = false;
                const tileId = this._getTileId(idx, zoom); //unique id of the tile
                let tileInfo;
                if (!visited[tileId]) {
                    tileInfo = renderer && renderer.isTileCachedOrLoading(tileId);
                    visited[tileId] = 1;
                }
                if (tileInfo) {
                    tileInfo = tileInfo.info;
                    hasCachedInfo = true;
                }
                let p;
                if (tileInfo) {
                    const { point0 } = tileInfo;
                    p = tileInfo.point.set(point0.x, point0.y);
                } else {
                    const pnw = tileConfig.getTilePrjNW(idx.x, idx.y, res);
                    p = map._prjToPoint(this._unproject(pnw, TEMP_POINT3), z);
                }
                let width, height;
                if (sr === mapSR) {
                    width = tileSize.width;
                    height = tileSize.height;
                } else {
                    const pse = tileConfig.getTilePrjSE(idx.x, idx.y, res),
                        pp = map._prjToPoint(this._unproject(pse, TEMP_POINT3), z, TEMP_POINT3);
                    width = Math.ceil(Math.abs(pp.x - p.x));
                    height = Math.ceil(Math.abs(pp.y - p.y));
                }
                const dx = scale.x * (idx.idx - idx.x) * width,
                    dy = -scale.y * (idx.idy - idx.y) * height;
                if (dx || dy) {
                    p._add(dx, dy);
                }
                if (hasOffset) {
                    p._sub(offset);
                }
                if (!tileInfo) {
                    const tileExtent = new PointExtent(p.x, p.y, p.x + width, p.y + height);
                    tileInfo = {
                        //reserve point caculated by tileConfig
                        //so add offset because we have p._sub(offset) and p._add(dx, dy) if hasOffset
                        'point0': p.add(offset)._sub(dx, dy),
                        'point': p,
                        'z': z,
                        'x' : idx.x,
                        'y' : idx.y,
                        'extent2d' : tileExtent,
                        'mask' : maskID
                    };
                }

                const tileExtent = tileInfo.extent2d;
                if (rightVisitEnd || innerExtent2D.intersects(tileExtent) ||
                    !innerExtent2D.equals(offsetExtent2D) && this._isTileInExtent(tileInfo, containerExtent)) {
                    if (hasOffset) {
                        tileExtent.set(p.x, p.y, p.x + width, p.y + height);
                        tileInfo.point = p._add(offset);
                        tileExtent._add(offset);
                    }
                    if (!hasCachedInfo) {
                        tileInfo['size'] = [width, height];
                        // tileInfo['dupKey'] = z + ',' + idx.idx + ',' + idx.idy + ',' + idx.x + ',' + idx.y + ',' + width + ',' + height + ',' + layerId; //duplicate key of the tile
                        tileInfo['id'] = tileId; //unique id of the tile
                        tileInfo['dupKey'] = tileId; // for compatibility of old plugins
                        tileInfo['layer'] = layerId;
                        tileInfo['url'] = this.getTileUrl(idx.x, idx.y, zoom);
                    }
                    tiles.push(tileInfo);
                    extent._combine(tileExtent);
                    if (leftVisitEnd === -Infinity) {
                        //从左往右第一次遇到可视的瓦片，改为从右往左遍历
                        leftVisitEnd = j;
                        j = right;
                    } else if (!rightVisitEnd) {
                        //从右往左第一次遇到可视瓦片，之后的瓦片全部可视
                        rightVisitEnd = true;
                    }
                }
            }
        }

        //sort tiles according to tile's distance to center
        const center = map._containerPointToPoint(containerExtent.getCenter(), z, TEMP_POINT)._add(offset);
        tiles.sort(function (a, b) {
            return a.point.distanceTo(center) - b.point.distanceTo(center);
        });

        return {
            'offset' : offset,
            'zoom' : z,
            'extent' : extent,
            'tiles': tiles
        };
    }

    _getInnerExtent(zoom, containerExtent, extent2d) {
        const map = this.getMap(),
            res = map.getResolution(zoom),
            scale = map.getResolution() / res,
            center = extent2d.getCenter()._multi(scale),
            bearing = map.getBearing() * Math.PI / 180,
            ch = containerExtent.getHeight() / 2 * scale,
            cw  = containerExtent.getWidth() / 2 * scale,
            h = Math.abs(Math.cos(bearing) * ch) || ch,
            w  = Math.abs(Math.sin(bearing) * ch) || cw;
        return new PointExtent(center.x - w, center.y - h, center.x + w, center.y + h);
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
        return `${id || this.getId()}-${idx.idy}-${idx.idx}-${zoom}`;
    }


    _project(pcoord, out) {
        const map = this.getMap();
        const sr = this.getSpatialReference();
        const mapSR = map.getSpatialReference();
        if (sr !== mapSR) {
            const mapProjection = map.getProjection();
            const projection = sr.getProjection();
            return projection.project(mapProjection.unproject(pcoord, out), out);
        } else {
            return pcoord;
        }
    }

    _unproject(pcoord, out) {
        const map = this.getMap();
        const sr = this.getSpatialReference();
        const mapSR = map.getSpatialReference();
        if (sr !== mapSR) {
            const mapProjection = map.getProjection();
            const projection = sr.getProjection();
            return mapProjection.project(projection.unproject(pcoord, out), out);
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
            tileSize = this.getTileSize();
        const sr = this.getSpatialReference();
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
        if (!this._convertPointCallback) {
            this._convertPointCallback = convertPoint.bind(this);
        }
        const tileZoom = tileInfo.z;
        this._coordTileZoom = tileZoom;
        const tileExtent = tileInfo.extent2d.convertTo(this._convertPointCallback, TEMP_POINT_EXTENT);
        // if (tileExtent.getWidth() < MAX_VISIBLE_SIZE || tileExtent.getHeight() < MAX_VISIBLE_SIZE) {
        //     return false;
        // }
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
        const renderer = this.getRenderer();
        if (renderer) {
            renderer.clear();
        }
    }
}

TileLayer.registerJSONType('TileLayer');

TileLayer.mergeOptions(options);

export default TileLayer;

function convertPoint(c) {
    return this.getMap()._pointToContainerPoint(c, this._coordTileZoom, 0, TEMP_POINT);
}
