import { extend } from '../../../core/util';

/**
 * @classdesc
 * A class internally used by tile layer helps to descibe tile system used by different tile services.<br>
 *
 * @class
 * @category layer
 * @example
 * var ts = new TileSystem([1, -1, -20037508.34, 20037508.34]);
 */
class TileSystem {

    scale: {
        x: number;
        y: number;
    }
    origin: {
        x: number;
        y: number;
    }

    /**
     * Similar with [transformation]{@link Transformation}, it contains 4 numbers: sx, sy, ox, oy.<br>
     * @see {@link http://wiki.osgeo.org/wiki/Tile_Map_Service_Specification}
     * @param sx the order of X-axis tile index, 1 means right is larger and -1 means the reverse, left is larger;
     * @param sy the order of Y-axis tile index, 1 means bottom is larger and -1 means the reverse, top is larger;
     * @param ox x of the origin point of the world's projected coordinate system
     * @param oy y of the origin point of the world's projected coordinate system
     */
    constructor(sx: number | number[], sy?: number, ox?: number, oy?: number) {
        if (Array.isArray(sx)) {
            this.scale = {
                x: sx[0],
                y: sx[1]
            };
            this.origin = {
                x: sx[2],
                y: sx[3]
            };
        } else {
            this.scale = {
                x: sx,
                y: sy
            };
            this.origin = {
                x: ox,
                y: oy
            };
        }
    }

    /**
     * Get the default tile system's code for the projection.
     * @param projection      - a projection object
     * @return tile system code
     */
    static getDefault(projection: any): string | number[] {
        const code = projection['code'].toLowerCase();
        if (code === 'baidu') {
            return 'baidu';
        } else if (code === 'EPSG:4326'.toLowerCase() || code === 'EPSG:4490'.toLowerCase()) {
            return 'tms-global-geodetic';
        } else if (code === 'identity') {
            return [1, -1, 0, 0];
        } else {
            return 'web-mercator';
        }
    }
}

const semiCircum = 6378137 * Math.PI;

extend(TileSystem, /** @lends TileSystem */ {
    /**
     * The most common used tile system, used by google maps, bing maps and amap, soso maps in China.
     * @see {@link https://en.wikipedia.org/wiki/Web_Mercator}
     * @constant
     * @static
     */
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    'web-mercator': new TileSystem([1, -1, -semiCircum, semiCircum]),

    /**
     * Predefined tile system for TMS tile system, A tile system published by [OSGEO]{@link http://www.osgeo.org/}. <br>
     * Also used by mapbox's [mbtiles]{@link https://github.com/mapbox/mbtiles-spec} specification.
     * @see {@link http://wiki.osgeo.org/wiki/Tile_Map_Service_Specification}
     * @constant
     * @static
     */
    'tms-global-mercator': new TileSystem([1, 1, -semiCircum, -semiCircum]),

    /**
     * Another tile system published by [OSGEO]{@link http://www.osgeo.org/}, based on EPSG:4326 SRS.
     * @see {@link http://wiki.osgeo.org/wiki/Tile_Map_Service_Specification#global-geodetic}
     * @constant
     * @static
     */
    'tms-global-geodetic': new TileSystem([1, 1, -180, -90]),

    /**
     * Tile system used by [baidu]{@link http://map.baidu.com}
     * @constant
     * @static
     */
    'baidu': new TileSystem([1, 1, 0, 0])
});

export default TileSystem;
