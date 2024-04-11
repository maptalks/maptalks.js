/* eslint-disable @typescript-eslint/ban-ts-comment */
import { isString } from '../../../core/util';
import Coordinate from '../../../geo/Coordinate';
import Point from '../../../geo/Point';
import Extent from '../../../geo/Extent';
import Transformation from '../../../geo/transformation/Transformation';
import TileSystem from './TileSystem';
import { type Map } from '../../../map';
import { type Size } from '../../../geo';

/**
 * Tile config for tile layers, an utilities class for tile layers to render tiles
 * @class
 * @category layer
 * @private
 */
class TileConfig {
    map: Map;
    tileSize: Size;
    fullExtent: Extent;
    private _xScale: number;
    private _yScale: number;
    private _pointOrigin: Point;
    private _glRes: number;
    tileSystem: TileSystem;
    transformation: Transformation;
    private _tileFullIndex: Record<string, Extent>;

    /**
     * @param tileSystem  - tileSystem
     * @param fullExtent      - fullExtent of the tile layer
     * @param tileSize          - tile size
     */
    constructor(map: Map, tileSystem: TileSystem, fullExtent: Extent, tileSize: Size) {
        this.map = map;
        this.tileSize = tileSize;
        this.fullExtent = fullExtent;
        this.prepareTileInfo(tileSystem, fullExtent);
        this._xScale = fullExtent['right'] >= fullExtent['left'] ? 1 : -1;
        this._yScale = fullExtent['top'] >= fullExtent['bottom'] ? 1 : -1;
        const glRes = map.getGLRes();
        this._pointOrigin = map._prjToPointAtRes(new Point(this.tileSystem['origin']), glRes);
        this._glRes = glRes;
    }

    prepareTileInfo(tileSystem: TileSystem, fullExtent: Extent) {
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
     * @param point - transformed point, this.transformation.transform(pCoord)
     * @param res  - current resolution
     * @return       tile index
     */
    _getTileNum(point: Point, res: number): { x: number, y: number } {
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
     * @param pCoord   - projected coordinate
     * @param res - current resolution
     * @return   tile index and offset
     */
    getTileIndex(pCoord: Coordinate, res: number, repeatWorld: any): TileIndex {
        const tileSystem = this.tileSystem;
        // tileSize = this['tileSize'];
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
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
     * @param tileX
     * @param tileY
     * @param offsetX
     * @param offsetY
     * @param zoomLevel
     * @return  tile's neighbor index
     */
    getNeighorTileIndex(
        tileX: number,
        tileY: number,
        offsetX: number,
        offsetY: number,
        res: number,
        repeatWorld: any
    ): TileIndex {
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
            'idx': idx,
            'idy': idy,
            out
        };
    }

    _getTileFullIndex(res: number) {
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
        this._tileFullIndex[res] = new Extent(nwIndex as Coordinate, seIndex as Coordinate, null);
        return this._tileFullIndex[res];
    }

    /**
     * Get tile's north west's projected coordinate
     * @param tileX
     * @param tileY
     * @param res
     * @return
     */
    getTilePrjNW(tileX: number, tileY: number, res: number, out?: any): Coordinate {
        const tileSystem = this.tileSystem;
        const tileSize = this['tileSize'];
        const y = tileSystem['origin']['y'] + this._yScale * tileSystem['scale']['y'] * (tileY + (tileSystem['scale']['y'] === 1 ? 1 : 0)) * res * tileSize['height'];
        const x = tileSystem['origin']['x'] + this._xScale * tileSystem['scale']['x'] * (tileX + (tileSystem['scale']['x'] === 1 ? 0 : 1)) * res * tileSize['width'];
        if (out) {
            out.set(x, y);
            return out;
        }
        return new Coordinate(x, y);
    }

    getTilePointNW(tileX: number, tileY: number, res: number, out?: any): Point {
        // res = res / this._glRes;
        const scale = this._glRes / res;
        const tileSystem = this.tileSystem;
        const tileSize = this['tileSize'];
        const y = this._pointOrigin.y * scale + this._yScale * tileSystem['scale']['y'] * (tileY + (tileSystem['scale']['y'] === 1 ? 1 : 0)) * tileSize['height'];
        const x = this._pointOrigin.x * scale + this._xScale * tileSystem['scale']['x'] * (tileX + (tileSystem['scale']['x'] === 1 ? 0 : 1)) * tileSize['width'];
        if (out) {
            out.set(x, y);
            return out;
        }
        return new Point(x, y);
    }

    /**
     * Get tile's south east's projected coordinate
     * @param tileX
     * @param tileY
     * @param res
     * @return
     */
    getTilePrjSE(tileX: number, tileY: number, res: number, out?: any): Coordinate {
        const tileSystem = this.tileSystem;
        const tileSize = this['tileSize'];
        const y = tileSystem['origin']['y'] + this._yScale * tileSystem['scale']['y'] * (tileY + (tileSystem['scale']['y'] === 1 ? 0 : 1)) * res * tileSize['height'];
        const x = tileSystem['origin']['x'] + this._xScale * tileSystem['scale']['x'] * (tileX + (tileSystem['scale']['x'] === 1 ? 1 : 0)) * res * tileSize['width'];
        if (out) {
            out.set(x, y);
            return out;
        }
        return new Coordinate(x, y);
    }

    getTilePointSE(tileX: number, tileY: number, res: number, out?: any): Point {
        const scale = this._glRes / res;
        const tileSystem = this.tileSystem;
        const tileSize = this['tileSize'];
        const y = this._pointOrigin.y * scale + this._yScale * tileSystem['scale']['y'] * (tileY + (tileSystem['scale']['y'] === 1 ? 0 : 1)) * tileSize['height'];
        const x = this._pointOrigin.x * scale + this._xScale * tileSystem['scale']['x'] * (tileX + (tileSystem['scale']['x'] === 1 ? 1 : 0)) * tileSize['width'];
        if (out) {
            out.set(x, y);
            return out;
        }
        return new Point(x, y);
    }

    /**
     * Get tile's projected extent
     * @param tileX
     * @param tileY
     * @param res
     * @return
     */
    getTilePrjExtent(tileX: number, tileY: number, res: number): Extent {
        const nw = this.getTilePrjNW(tileX, tileY, res),
            se = this.getTilePrjSE(tileX, tileY, res);
        return new Extent(nw, se);
    }
}

export default TileConfig;

type TileIndex = {
    x: number;
    y: number;
    idx: number;
    idy: number;
    out: any;
}