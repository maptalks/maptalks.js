/**
 * @classdesc
 * A class internally used by tile layer helps to descibe tile system used by different tile services.<br>
 *
 * @class
 * @category layer
 * @example
 * var ts = new TileSystem([1, -1, -20037508.34, 20037508.34]);
 */
declare class TileSystem {
    scale: object;
    origin: object;
    static 'web-mercator': TileSystem;
    static 'tms-global-mercator': TileSystem;
    static 'tms-global-geodetic': TileSystem;
    static 'baidu': TileSystem;
    /**
     * Similar with [transformation]{@link Transformation}, it contains 4 numbers: sx, sy, ox, oy.<br>
     * @see {@link http://wiki.osgeo.org/wiki/Tile_Map_Service_Specification}
     * @param  {Number} sx the order of X-axis tile index, 1 means right is larger and -1 means the reverse, left is larger;
     * @param  {Number} sy the order of Y-axis tile index, 1 means bottom is larger and -1 means the reverse, top is larger;
     * @param  {Number} ox x of the origin point of the world's projected coordinate system
     * @param  {Number} oy y of the origin point of the world's projected coordinate system
     */
    constructor(sx: any, sy?: any, ox?: any, oy?: any);
    /**
     * Get the default tile system's code for the projection.
     * @param  {Object} projection      - a projection object
     * @return {String} tile system code
     */
    static getDefault(projection: any): number[] | "baidu" | "tms-global-geodetic" | "web-mercator";
}
export default TileSystem;
