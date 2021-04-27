import { IS_NODE, isNil, isNumber, isArrayHasData, isFunction, isInteger } from '../../core/util';
import Browser from '../../core/Browser';
import Size from '../../geo/Size';
import Point from '../../geo/Point';
import PointExtent from '../../geo/PointExtent';
import TileConfig from './tileinfo/TileConfig';
import TileSystem from './tileinfo/TileSystem';
import Layer from '../Layer';
import SpatialReference from '../../map/spatial-reference/SpatialReference';
import { intersectsBox } from 'frustum-intersects';
import * as vec3 from '../../core/util/vec3';

const isSetAvailable = typeof Set !== 'undefined';
class TileHashset {
    constructor() {
        this._table = isSetAvailable ? new Set() : {};
    }

    add(key) {
        if (isSetAvailable) {
            this._table.add(key);
        } else {
            this._table[key] = true;
        }
    }

    has(key) {
        if (isSetAvailable) {
            return this._table.has(key);
        } else {
            return this._table[key];
        }
    }

    reset() {
        if (isSetAvailable) {
            this._table.clear();
        } else {
            this._table = {};
        }

    }
}

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
 * @property {Number}              [options.zoomOffset=0]           - offset from map's zoom to tile's zoom
 * @property {Number}              [options.tileRetryCount=0]       - retry count of tiles
 * @property {String}              [options.errorUrl=null]       - image to replace when encountering error on loading tile image
 * @memberOf TileLayer
 * @instance
 */
const options = {

    'urlTemplate': null,
    'subdomains': null,

    'errorUrl': null,

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

    'zoomOffset' : 0
};

const URL_PATTERN = /\{ *([\w_]+) *\}/g;

// const MAX_VISIBLE_SIZE = 5;

const TEMP_POINT = new Point(0, 0);
const TEMP_POINT0 = new Point(0, 0);
const TEMP_POINT1 = new Point(0, 0);
const TEMP_POINT2 = new Point(0, 0);
const TEMP_POINT3 = new Point(0, 0);
const TEMP_POINT4 = new Point(0, 0);
const TEMP_POINT6 = new Point(0, 0);
// const TEMP_POINT_EXTENT = new PointExtent();
const TILE_BOX = [[0, 0, 0], [0, 0, 0]];
const ARR3 = [];

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
        if (this._tileSize) {
            return this._tileSize;
        }
        let size = this.options['tileSize'];
        if (isNumber(size)) {
            size = [size, size];
        }
        this._tileSize = new Size(size);
        return this._tileSize;
    }

    /**
     * Get tiles at zoom z (or current zoom)
     * @param {Number} z - zoom
     * @return {Object[]} tile descriptors
     */
    getTiles(z, parentLayer) {
        const map = this.getMap();
        const pitch = map.getPitch();
        const parentRenderer = parentLayer && parentLayer.getRenderer();
        const mapExtent = map.getContainerExtent();
        const tileGrids = [];
        let count = 0;
        const minZoom = this.getMinZoom();
        const cascadePitch0 = map.options['cascadePitches'][0];
        const cascadePitch1 = map.options['cascadePitches'][1];
        const visualHeight1 = Math.floor(map._getVisualHeight(cascadePitch1));
        const tileZoom = isNil(z) ? this._getTileZoom(map.getZoom()) : z;
        this._visitedTiles = new TileHashset();
        this._coordCache = {};
        if (
            !isNil(z) ||
            !this.options['cascadeTiles'] ||
            pitch <= cascadePitch0 ||
            !isNil(minZoom) && tileZoom <= minZoom
        ) {
            const containerExtent = pitch <= cascadePitch1 ? mapExtent : new PointExtent(0, map.height - visualHeight1, map.width, map.height);
            const currentTiles = this._getTiles(tileZoom, containerExtent, 2, parentRenderer);
            if (currentTiles) {
                count += currentTiles.tiles.length;
                tileGrids.push(currentTiles);
            }
            return {
                tileGrids, count
            };
        }
        const visualHeight0 = Math.floor(map._getVisualHeight(cascadePitch0));
        const extent0 = new PointExtent(0, map.height - visualHeight0, map.width, map.height);
        const currentTiles = this._getTiles(tileZoom, extent0, 0, parentRenderer);
        count += currentTiles ? currentTiles.tiles.length : 0;
        tileGrids.push(currentTiles);

        let cascadeHeight = extent0.ymin;

        const d = map.getSpatialReference().getZoomDirection();
        let cascadeLevels = d;
        let cascadeTiles1;
        if (pitch > cascadePitch1) {
            if (tileZoom - cascadeLevels <= minZoom) {
                cascadeLevels = 0;
            }
            const extent1 = new PointExtent(0, map.height - visualHeight1, map.width, cascadeHeight);
            cascadeTiles1 = this._getTiles(tileZoom - cascadeLevels, extent1, 1, parentRenderer);
            count += cascadeTiles1 ? cascadeTiles1.tiles.length : 0;
            cascadeHeight = extent1.ymin;
            cascadeLevels += 4 * d;
        }

        let cascadeTiles2;
        if (tileZoom - cascadeLevels >= minZoom) {
            const extent2 = new PointExtent(0, mapExtent.ymin, map.width, cascadeHeight);
            cascadeTiles2 = this._getTiles(tileZoom - cascadeLevels, extent2, 2, parentRenderer);
            count += cascadeTiles2 ? cascadeTiles2.tiles.length : 0;
            tileGrids.push(cascadeTiles2);
        }

        if (cascadeTiles1 && cascadeTiles2) {
            tileGrids[1] = cascadeTiles2;
            tileGrids[2] = cascadeTiles1;
        }

        // console.log(currentTiles && currentTiles.tiles.length, cascadeTiles1 && cascadeTiles1.tiles.length, cascadeTiles2 && cascadeTiles2.tiles.length);
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


    _getTiles(tileZoom, containerExtent, cascadeLevel, parentRenderer) {
        // rendWhenReady = false;
        const map = this.getMap();
        let z = tileZoom;
        let frustumMatrix = map.projViewMatrix;
        if (cascadeLevel < 2) {
            if (cascadeLevel === 0) {
                z -= 1;
            }
            frustumMatrix = cascadeLevel === 0 ? map.cascadeFrustumMatrix0 : cascadeLevel === 1 ?  map.cascadeFrustumMatrix1 : map.projViewMatrix;
        }
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
        const tileOffsets = {
            zoom: offset
        };
        const sr = this.getSpatialReference();
        const mapSR = map.getSpatialReference();
        const res = sr.getResolution(zoom);
        const glScale = map.getGLScale(z);
        const repeatWorld = sr === mapSR && this.options['repeatWorld'];

        const extent2d = containerExtent.convertTo(c => {
            let result;
            if (c.y > 0 && c.y < map.height) {
                const key = (c.x === 0 ? 0 : 1) + c.y;
                if (!this._coordCache[key]) {
                    this._coordCache[key] = map._containerPointToPoint(c);
                }
                result = this._coordCache[key];
            }
            result = map._containerPointToPoint(c, undefined, TEMP_POINT);
            return result;
        });
        // const innerExtent2D = this._getInnerExtent(z, containerExtent, extent2d)._add(offset);
        // extent2d._add(offset);

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
        const centerPoint = map._prjToPoint(prjCenter, zoom, TEMP_POINT1);
        let c;
        if (hasOffset) {
            c = this._project(map._pointToPrj(centerPoint._add(offset), zoom, TEMP_POINT1), TEMP_POINT1);
        } else {
            c = this._project(prjCenter, TEMP_POINT1);
        }

        const extentScale = map.getGLScale() / map.getGLScale(zoom);
        TEMP_POINT2.x = extent2d.xmin * extentScale;
        TEMP_POINT2.y = extent2d.ymax * extentScale;
        TEMP_POINT3.x = extent2d.xmax * extentScale;
        TEMP_POINT3.y = extent2d.ymin * extentScale;
        const pmin = this._project(map._pointToPrj(TEMP_POINT2._add(offset), zoom, TEMP_POINT2), TEMP_POINT2);
        const pmax = this._project(map._pointToPrj(TEMP_POINT3._add(offset), zoom, TEMP_POINT3), TEMP_POINT3);

        const centerTile = tileConfig.getTileIndex(c, res, repeatWorld);
        const ltTile = tileConfig.getTileIndex(pmin, res, repeatWorld);
        const rbTile = tileConfig.getTileIndex(pmax, res, repeatWorld);

        // Number of tiles around the center tile
        const top = Math.ceil(Math.abs(centerTile.idy - ltTile.idy)),
            left = Math.ceil(Math.abs(centerTile.idx - ltTile.idx)),
            bottom = Math.ceil(Math.abs(centerTile.idy - rbTile.idy)),
            right = Math.ceil(Math.abs(centerTile.idx - rbTile.idx));
        const allCount = (top + bottom + 1) * (left + right + 1);
        const tileSize = this.getTileSize();
        const renderer = this.getRenderer() || parentRenderer,
            scale = this._getTileConfig().tileSystem.scale;
        const tiles = [], extent = new PointExtent();
        const tilePoint = new Point(0, 0);
        for (let i = -top; i <= bottom; i++) {
            let j = -left;
            let leftVisitEnd = -Infinity;
            let rightVisitEnd = false;
            while (j >= leftVisitEnd && j <= right) {
                const idx = tileConfig.getNeighorTileIndex(centerTile.idx, centerTile.idy, j, i, res, repeatWorld);
                if (leftVisitEnd === -Infinity) {
                    //从左往右遍历中
                    j++;
                } else {
                    //从右往左遍历中
                    j--;
                }
                const tileId = this._getTileId(idx.idx, idx.idy, z);
                if (idx.out || this._visitedTiles && this._visitedTiles.has(tileId)) {
                    continue;
                }
                //unique id of the tile
                let tileInfo = renderer && renderer.isTileCachedOrLoading(tileId);
                if (tileInfo) {
                    tileInfo = tileInfo.info;
                }

                let p;
                if (tileInfo) {
                    const { extent2d } = tileInfo;
                    tilePoint.set(extent2d.xmin, extent2d.ymax);
                    p = tilePoint;
                } else if (!this._hasOwnSR) {
                    p = tileConfig.getTilePointNW(idx.x, idx.y, res);
                    // const pnw = tileConfig.getTilePrjNW(idx.x, idx.y, res);
                    // p = map._prjToPoint(this._unproject(pnw, TEMP_POINT3), z);
                } else {
                    const pnw = tileConfig.getTilePrjNW(idx.x, idx.y, res);
                    p = map._prjToPoint(this._unproject(pnw, TEMP_POINT3), z);
                }

                let width, height;
                if (sr === mapSR) {
                    width = tileSize.width;
                    height = tileSize.height;
                } else {
                    let pp;
                    if (!this._hasOwnSR) {
                        pp = tileConfig.getTilePointSE(idx.x, idx.y, res);
                    } else {
                        const pse = tileConfig.getTilePrjSE(idx.x, idx.y, res);
                        pp = map._prjToPoint(this._unproject(pse, TEMP_POINT3), z, TEMP_POINT3);
                    }
                    width = Math.ceil(Math.abs(pp.x - p.x));
                    height = Math.ceil(Math.abs(pp.y - p.y));
                }
                const dx = scale.x * (idx.idx - idx.x) * width,
                    dy = scale.y * (idx.idy - idx.y) * height;
                if (!tileInfo && (dx || dy)) {
                    p._add(dx, dy);
                }


                const tileExtent = tileInfo && tileInfo.extent2d || new PointExtent(p.x, p.y - height, p.x + width, p.y);
                // if (hasOffset) {
                //     tileExtent.set(p.x, p.y - height, p.x + width, p.y);
                // }
                if (allCount <= 4 || rightVisitEnd || this._isTileInExtent(frustumMatrix, tileExtent, offset, glScale)) {
                    if (this._visitedTiles && cascadeLevel === 0) {
                        this._visitedTiles.add(tileId);
                    }
                    if (cascadeLevel === 0) {
                        this._splitTiles(frustumMatrix, tiles, renderer, idx, z + 1, tileExtent, dx, dy, tileOffsets, parentRenderer);
                        extent._combine(tileExtent);
                    } else {
                        if (!tileInfo) {
                            tileInfo = {
                                //reserve point caculated by tileConfig
                                //so add offset because we have p._sub(offset) and p._add(dx, dy) if hasOffset
                                'z': z,
                                'x': idx.x,
                                'y': idx.y,
                                'extent2d': tileExtent,
                                'offset': offset,
                                'id': tileId,
                                'url': this.getTileUrl(idx.x, idx.y, z)
                            };
                            if (parentRenderer) {
                                tileInfo['layer'] = this.getId();
                            }
                        } else {
                            tileInfo.offset[0] = offset[0];
                            tileInfo.offset[1] = offset[1];
                        }
                        tiles.push(tileInfo);
                        extent._combine(tileExtent);
                    }
                    if (leftVisitEnd === -Infinity) {
                        //从左往右第一次遇到可视的瓦片，改为从右往左遍历
                        leftVisitEnd = j;
                        j = right;// - Math.max(j - -left - 4, 0);
                        // rightVisitEnd = true;
                    } else if (!rightVisitEnd) {
                        //从右往左第一次遇到可视瓦片，之后的瓦片全部可视
                        rightVisitEnd = true;
                    }
                }
            }
        }

        if (tiles.length) {
            //sort tiles according to tile's distance to center
            const center = map._containerPointToPoint(containerExtent.getCenter(), z, TEMP_POINT)._add(offset);
            const point0 = new Point(0, 0);
            const point1 = new Point(0, 0);
            tiles.sort(function (a, b) {
                point0.set((a.extent2d.xmin + a.extent2d.xmax) / 2, (a.extent2d.ymin + a.extent2d.ymax) / 2);
                point1.set((b.extent2d.xmin + b.extent2d.xmax) / 2, (b.extent2d.ymin + b.extent2d.ymax) / 2);
                return point0.distanceTo(center) - point1.distanceTo(center);
            });
        }
        return {
            'offset': offset,
            'zoom' : tileZoom,
            'extent': extent,
            'tiles': tiles
        };
    }

    _splitTiles(frustumMatrix, tiles, renderer, tileIdx, z, tileExtent, dx, dy, tileOffsets, parentRenderer) {
        // const hasOffset = offset[0] || offset[1];
        const yOrder = this._getTileConfig().tileSystem.scale.y;
        const glScale = this.getMap().getGLScale(z);
        //yOrder < 0，用左上角，大于0时，用左下角
        const corner = TEMP_POINT4.set(tileExtent.xmin * 2, yOrder < 0 ? tileExtent.ymax * 2 : tileExtent.ymin * 2);
        const w = tileExtent.getWidth();
        const h = tileExtent.getHeight();
        const idx = tileIdx.idx * 2;
        const idy = tileIdx.idy * 2;
        const x = tileIdx.x * 2;
        const y = tileIdx.y * 2;

        let tile = this._checkAndAddTile(frustumMatrix, renderer, idx, idy, x, y, z, 0, 0, w, h, corner, glScale, tileOffsets, parentRenderer);
        if (tile) tiles.push(tile);
        tile = this._checkAndAddTile(frustumMatrix, renderer, idx, idy, x, y, z, 0, 1, w, h, corner, glScale, tileOffsets, parentRenderer);
        if (tile) tiles.push(tile);
        tile = this._checkAndAddTile(frustumMatrix, renderer, idx, idy, x, y, z, 1, 0, w, h, corner, glScale, tileOffsets, parentRenderer);
        if (tile) tiles.push(tile);
        tile = this._checkAndAddTile(frustumMatrix, renderer, idx, idy, x, y, z, 1, 1, w, h, corner, glScale, tileOffsets, parentRenderer);
        if (tile) tiles.push(tile);
    }

    _checkAndAddTile(frustumMatrix, renderer, idx, idy, x, y, z, i, j, w, h, corner, glScale, tileOffsets, parentRenderer) {
        const tileId = this._getTileId(idx + i, idy + j, z);
        if (this._visitedTiles && this._visitedTiles.has(tileId)) {
            return null;
        }
        let offset = tileOffsets[z];
        if (!offset) {
            offset = tileOffsets[z] = this._getTileOffset(z);
        }
        const yOrder = this._getTileConfig().tileSystem.scale.y;
        const childExtent = new PointExtent(corner.x + i * w, corner.y + yOrder * j * h, corner.x + (i + 1) * w, corner.y + yOrder * (j + 1) * h);
        if (/*!rightVisitEnd && */
            !this._isSplittedTileInExtent(frustumMatrix, childExtent, offset, glScale)) {
            return null;
        }
        let tileInfo = renderer && renderer.isTileCachedOrLoading(tileId);
        if (!tileInfo) {
            //reserve point caculated by tileConfig
            //so add offset because we have p._sub(offset) and p._add(dx, dy) if hasOffset
            tileInfo = {
                'z': z,
                'x': x + i,
                'y': y + j,
                'extent2d' : childExtent,
                'id': tileId,
                'offset': offset,
                'url': this.getTileUrl(x + i, y + j, z + this.options['zoomOffset'])
            };
            if (parentRenderer) {
                tileInfo['layer'] = this.getId();
            }
        } else {
            tileInfo = tileInfo.info;
        }
        return tileInfo;
    }

    _getTileOffset(z) {
        let offset = this.options['offset'];
        if (isFunction(offset)) {
            offset = offset(z);
        }
        return offset;
    }

    _getTileId(x, y, zoom, id) {
        //id is to mark GroupTileLayer's child layers
        return `${id || this.getId()}_${y}_${x}_${zoom}`;
    }


    _project(pcoord, out) {
        if (this._hasOwnSR) {
            const map = this.getMap();
            const mapProjection = map.getProjection();
            const projection = this.getSpatialReference().getProjection();
            return projection.project(mapProjection.unproject(pcoord, out), out);
        } else {
            return pcoord;
        }
    }

    _unproject(pcoord, out) {
        if (this._hasOwnSR) {
            const map = this.getMap();
            const sr = this.getSpatialReference();
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
        this._defaultTileConfig = new TileConfig(map, TileSystem.getDefault(projection), fullExtent, tileSize);
        if (this.options['tileSystem']) {
            this._tileConfig = new TileConfig(map, this.options['tileSystem'], fullExtent, tileSize);
        }
        //inherit baselayer's tileconfig
        // if (map && !this._tileConfig &&
        //     mapSr === sr &&
        //     map.getBaseLayer() &&
        //     map.getBaseLayer() !== this &&
        //     map.getBaseLayer()._getTileConfig &&
        //     map.getBaseLayer().getSpatialReference() === mapSr) {
        //     const base = map.getBaseLayer()._getTileConfig();
        //     this._tileConfig = new TileConfig(map, base.tileSystem, base.fullExtent, tileSize);
        // }
        this._hasOwnSR = sr !== map.getSpatialReference();
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

    _isTileInExtent(frustumMatrix, tileExtent, offset, glScale) {
        const map = this.getMap();

        let matrix;
        if (frustumMatrix !== map.projViewMatrix) {
            const tileCenter = tileExtent.getCenter(TEMP_POINT6)._sub(offset[0], offset[1])._multi(glScale);
            vec3.set(ARR3, tileCenter.x, tileCenter.y, 0);
            const ndc = vec3.transformMat4(ARR3, ARR3, map.projViewMatrix);
            //地图中心下方的瓦片与 map.projViewMatrix 比较
            //地图中心上方的瓦片与 map.cascadeFrustumMatrix 比较
            matrix = ndc[1] < 0 ? map.projViewMatrix : frustumMatrix;
        } else {
            matrix = map.projViewMatrix;
        }

        TILE_BOX[0][0] = (tileExtent.xmin - offset[0]) * glScale;
        TILE_BOX[0][1] = (tileExtent.ymin - offset[1]) * glScale;
        TILE_BOX[1][0] = (tileExtent.xmax - offset[0]) * glScale;
        TILE_BOX[1][1] = (tileExtent.ymax - offset[1]) * glScale;
        return intersectsBox(matrix, TILE_BOX);
    }

    _isSplittedTileInExtent(frustumMatrix, tileExtent, offset, glScale) {
        const map = this.getMap();
        TILE_BOX[0][0] = (tileExtent.xmin - offset[0]) * glScale;
        TILE_BOX[0][1] = (tileExtent.ymin - offset[1]) * glScale;
        TILE_BOX[1][0] = (tileExtent.xmax - offset[0]) * glScale;
        TILE_BOX[1][1] = (tileExtent.ymax - offset[1]) * glScale;
        return intersectsBox(map.projViewMatrix, TILE_BOX);
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

//https://wrf.ecse.rpi.edu//Research/Short_Notes/pnpoly.html
// function pnpoly(nvert, vertx, verty, testx, testy) {
//     let i, j, c = 0;
//     for (i = 0, j = nvert - 1; i < nvert; j = i++) {
//         if (((verty[i] > testy) !== (verty[j] > testy)) &&
//            (testx < (vertx[j] - vertx[i]) * (testy - verty[i]) / (verty[j] - verty[i]) + vertx[i])) {
//             c = !c;
//         }
//     }
//     return c;
// }

