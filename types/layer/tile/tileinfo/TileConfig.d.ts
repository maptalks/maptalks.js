import Point from '../../../geo/Point';
import Extent from '../../../geo/Extent';
import Transformation from '../../../geo/transformation/Transformation';
/**
 * Tile config for tile layers, an utilities class for tile layers to render tiles
 * @class
 * @category layer
 * @private
 */
declare class TileConfig {
    map: any;
    tileSize: number;
    fullExtent: any;
    _xScale: number;
    _yScale: number;
    _pointOrigin: Point;
    _glRes: number;
    tileSystem: any;
    transformation: Transformation;
    _tileFullIndex: object;
    /**
     * @param {TileSystem} tileSystem  - tileSystem
     * @param {Extent} fullExtent      - fullExtent of the tile layer
     * @param {Size} tileSize          - tile size
     */
    constructor(map: any, tileSystem: any, fullExtent: any, tileSize: any);
    prepareTileInfo(tileSystem: any, fullExtent: any): void;
    /**
     * Get index of point's tile
     * @param  {Point} point - transformed point, this.transformation.transform(pCoord)
     * @param  {Number} res  - current resolution
     * @return {Object}       tile index
     */
    _getTileNum(point: any, res: any): {
        x: number;
        y: number;
    };
    /**
     * Get tile index and offset from tile's northwest
     * @param  {Coordinate} pCoord   - projected coordinate
     * @param  {Number} res - current resolution
     * @return {Object}   tile index and offset
     */
    getTileIndex(pCoord: any, res: any, repeatWorld: any): {
        x: any;
        y: number;
        idx: any;
        idy: number;
        out: boolean;
    };
    /**
     * Get neibor's tile index
     * @param  {Number} tileX
     * @param  {Number} tileY
     * @param  {Number} offsetX
     * @param  {Number} offsetY
     * @param  {Number} zoomLevel
     * @return {Object}  tile's neighbor index
     */
    getNeighorTileIndex(tileX: any, tileY: any, offsetX: any, offsetY: any, res: any, repeatWorld: any): {
        x: any;
        y: number;
        idx: any;
        idy: number;
        out: boolean;
    };
    _getTileFullIndex(res: any): any;
    /**
     * Get tile's north west's projected coordinate
     * @param  {Number} tileX
     * @param  {Number} tileY
     * @param  {Number} res
     * @return {Number[]}
     */
    getTilePrjNW(tileX: any, tileY: any, res: any, out?: any): any;
    getTilePointNW(tileX: any, tileY: any, res: any, out: any): any;
    /**
     * Get tile's south east's projected coordinate
     * @param  {Number} tileX
     * @param  {Number} tileY
     * @param  {Number} res
     * @return {Number[]}
     */
    getTilePrjSE(tileX: any, tileY: any, res: any, out?: any): any;
    getTilePointSE(tileX: any, tileY: any, res: any, out: any): any;
    /**
     * Get tile's projected extent
     * @param  {Number} tileX
     * @param  {Number} tileY
     * @param  {Number} res
     * @return {Extent}
     */
    getTilePrjExtent(tileX: any, tileY: any, res: any): Extent;
}
export default TileConfig;
