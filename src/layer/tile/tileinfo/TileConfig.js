import { isString } from '../../../core/util';
import Coordinate from '../../../geo/Coordinate';
import Point from '../../../geo/Point';
import Extent from '../../../geo/Extent';
import Transformation from '../../../geo/transformation/Transformation';
import TileSystem from './TileSystem';

/**
 * Tile config for tile layers, an utilities class for tile layers to render tiles
 * @class
 * @category layer
 * @private
 */
class TileConfig {

    /**
     * @param {TileSystem} tileSystem  - tileSystem
     * @param {Extent} fullExtent      - fullExtent of the tile layer
     * @param {Size} tileSize          - tile size
     */
    constructor(map, tileSystem, fullExtent, tileSize) {
        this.map = map;
        this.tileSize = tileSize;
        this.fullExtent = fullExtent;
        this.prepareTileInfo(tileSystem, fullExtent);
        this._xScale = fullExtent['right'] >= fullExtent['left'] ? 1 : -1;
        this._yScale = fullExtent['top'] >= fullExtent['bottom'] ? 1 : -1;
        this._pointOrigin = map._prjToPoint(new Point(this.tileSystem['origin']), map.getGLZoom());
        this._glRes = map.getResolution(map.getGLZoom());
    }

    prepareTileInfo(tileSystem, fullExtent) {
        if (isString(tileSystem)) {
            tileSystem = TileSystem[tileSystem.toLowerCase()];
        } else if (Array.isArray(tileSystem)) {
            tileSystem = new TileSystem(tileSystem);
        }

        if (!tileSystem) {
            throw new Error('Invalid TileSystem');
        }
        this.tileSystem = tileSystem;

        //自动计算transformation
        const a = fullExtent['right'] > fullExtent['left'] ? 1 : -1,
            b = fullExtent['top'] > fullExtent['bottom'] ? -1 : 1,
            c = tileSystem['origin']['x'],
            d = tileSystem['origin']['y'];
        this.transformation = new Transformation([a, b, c, d]);
    }

    /**
     * Get index of point's tile
     * @param  {Point} point - transformed point, this.transformation.transform(pCoord)
     * @param  {Number} res  - current resolution
     * @return {Object}       tile index
     */
    _getTileNum(point, res) {
        const tileSystem = this.tileSystem,
            tileSize = this['tileSize'],
            delta = 1E-7;
        const tileX = Math.floor(delta * tileSystem['scale']['x'] + point.x / (tileSize['width'] * res));
        const tileY = Math.ceil(delta * tileSystem['scale']['y'] + point.y / (tileSize['height'] * res));

        return {
            'x': tileSystem['scale']['x'] * tileX,
            'y': tileSystem['scale']['y'] * tileY
        };
    }

    /**
     * Get tile index and offset from tile's northwest
     * @param  {Coordinate} pCoord   - projected coordinate
     * @param  {Number} res - current resolution
     * @return {Object}   tile index and offset
     */
    getTileIndex(pCoord, res, repeatWorld) {
        const tileSystem = this.tileSystem;
        // tileSize = this['tileSize'];
        const point = this.transformation.transform(pCoord, 1);
        const tileIndex = this._getTileNum(point, res);

        // const tileLeft = tileIndex['x'] * tileSize['width'];
        // const tileTop = tileIndex['y'] * tileSize['height'];

        // const offsetLeft = point.x / res - tileSystem['scale']['x'] * tileLeft;
        // const offsetTop = point.y / res + tileSystem['scale']['y'] * tileTop;

        //如果x方向为左大右小
        if (tileSystem['scale']['x'] < 0) {
            tileIndex['x'] -= 1;
        }
        //如果y方向上大下小
        if (tileSystem['scale']['y'] > 0) {
            tileIndex['y'] -= 1;
        }

        //有可能tileIndex超出世界范围
        return this.getNeighorTileIndex(tileIndex['x'], tileIndex['y'], 0, 0, res, repeatWorld);
    }

    /**
     * Get neibor's tile index
     * @param  {Number} tileX
     * @param  {Number} tileY
     * @param  {Number} offsetX
     * @param  {Number} offsetY
     * @param  {Number} zoomLevel
     * @return {Object}  tile's neighbor index
     */
    getNeighorTileIndex(tileX, tileY, offsetX, offsetY, res, repeatWorld) {
        const tileSystem = this.tileSystem;
        let x = (tileX + tileSystem['scale']['x'] * offsetX);
        let y = (tileY - tileSystem['scale']['y'] * offsetY);
        let out = false;
        const idx = x;
        const idy = y;

        const ext = this._getTileFullIndex(res);
        if (repeatWorld) {
            if (repeatWorld === true || repeatWorld === 'x') {
                //caculate tile index to request in url in repeated world.
                if (ext['xmax'] === ext['xmin']) {
                    x = ext['xmin'];
                } else if (x < ext['xmin']) {
                    x = ext['xmax'] - (ext['xmin'] - x) % (ext['xmax'] - ext['xmin']);
                    if (x === ext['xmax']) {
                        x = ext['xmin'];
                    }
                } else if (x >= ext['xmax']) {
                    x = ext['xmin'] + (x - ext['xmin']) % (ext['xmax'] - ext['xmin']);
                }
            }

            if (repeatWorld === true || repeatWorld === 'y') {
                if (ext['ymax'] === ext['ymin']) {
                    y = ext['ymin'];
                } else if (y >= ext['ymax']) {
                    y = ext['ymin'] + (y - ext['ymin']) % (ext['ymax'] - ext['ymin']);
                } else if (y < ext['ymin']) {
                    y = ext['ymax'] - (ext['ymin'] - y) % (ext['ymax'] - ext['ymin']);
                    if (y === ext['ymax']) {
                        y = ext['ymin'];
                    }
                }
            }
        }
        if (x < ext['xmin'] || x > ext['xmax'] || y > ext['ymax'] || y < ext['ymin']) {
            out = true;
        }
        return {
            // tile index to request in url
            'x': x,
            'y': y,
            // real tile index
            'idx' : idx,
            'idy' : idy,
            out
        };
    }

    _getTileFullIndex(res) {
        if (!this._tileFullIndex) {
            this._tileFullIndex = {};
        }
        if (this._tileFullIndex[res]) {
            return this._tileFullIndex[res];
        }
        const ext = this.fullExtent;
        const transformation = this.transformation;
        const nwIndex = this._getTileNum(transformation.transform(new Coordinate(ext['left'], ext['top']), 1), res);
        const seIndex = this._getTileNum(transformation.transform(new Coordinate(ext['right'], ext['bottom']), 1), res);

        const tileSystem = this.tileSystem;
        //如果x方向为左大右小
        if (tileSystem['scale']['x'] < 0) {
            nwIndex.x -= 1;
            seIndex.x -= 1;
        }
        //如果y方向上大下小
        if (tileSystem['scale']['y'] > 0) {
            nwIndex.y -= 1;
            seIndex.y -= 1;
        }
        this._tileFullIndex[res] = new Extent(nwIndex, seIndex);
        return this._tileFullIndex[res];
    }

    /**
     * Get tile's north west's projected coordinate
     * @param  {Number} tileX
     * @param  {Number} tileY
     * @param  {Number} res
     * @return {Number[]}
     */
    getTilePrjNW(tileX, tileY, res) {
        const tileSystem = this.tileSystem;
        const tileSize = this['tileSize'];
        const y = tileSystem['origin']['y'] + this._yScale * tileSystem['scale']['y'] * (tileY + (tileSystem['scale']['y'] === 1 ? 1 : 0)) * res * tileSize['height'];
        const x = tileSystem['origin']['x'] + this._xScale * tileSystem['scale']['x'] * (tileX + (tileSystem['scale']['x'] === 1 ? 0 : 1)) * res * tileSize['width'];
        return new Coordinate(x, y);
    }

    getTilePointNW(tileX, tileY, res) {
        // res = res / this._glRes;
        const scale = this._glRes / res;
        const tileSystem = this.tileSystem;
        const tileSize = this['tileSize'];
        const y = this._pointOrigin.y * scale + this._yScale * tileSystem['scale']['y'] * (tileY + (tileSystem['scale']['y'] === 1 ? 1 : 0)) * tileSize['height'];
        const x = this._pointOrigin.x * scale + this._xScale * tileSystem['scale']['x'] * (tileX + (tileSystem['scale']['x'] === 1 ? 0 : 1)) * tileSize['width'];
        return new Point(x, y);
    }

    /**
     * Get tile's south east's projected coordinate
     * @param  {Number} tileX
     * @param  {Number} tileY
     * @param  {Number} res
     * @return {Number[]}
     */
    getTilePrjSE(tileX, tileY, res) {
        const tileSystem = this.tileSystem;
        const tileSize = this['tileSize'];
        const y = tileSystem['origin']['y'] + this._yScale * tileSystem['scale']['y'] * (tileY + (tileSystem['scale']['y'] === 1 ? 0 : 1)) * res * tileSize['height'];
        const x = tileSystem['origin']['x'] + this._xScale * tileSystem['scale']['x'] * (tileX + (tileSystem['scale']['x'] === 1 ? 1 : 0)) * res * tileSize['width'];
        return new Coordinate(x, y);
    }

    getTilePointSE(tileX, tileY, res) {
        const scale = this._glRes / res;
        const tileSystem = this.tileSystem;
        const tileSize = this['tileSize'];
        const y = this._pointOrigin.y * scale + this._yScale * tileSystem['scale']['y'] * (tileY + (tileSystem['scale']['y'] === 1 ? 0 : 1)) * tileSize['height'];
        const x = this._pointOrigin.x * scale + this._xScale * tileSystem['scale']['x'] * (tileX + (tileSystem['scale']['x'] === 1 ? 1 : 0)) * tileSize['width'];
        return new Point(x, y);
    }

    /**
     * Get tile's projected extent
     * @param  {Number} tileX
     * @param  {Number} tileY
     * @param  {Number} res
     * @return {Extent}
     */
    getTilePrjExtent(tileX, tileY, res) {
        const nw = this.getTilePrjNW(tileX, tileY, res),
            se = this.getTilePrjSE(tileX, tileY, res);
        return new Extent(nw, se);
    }
}

export default TileConfig;
