import { Geometry } from './../geometry';
import Coordinate from '../geo/Coordinate';
type Constructor = new (...args: any[]) => {};
/**
 * Methods of topo computations
 * @mixin MapTopo
 */
export default function MapTopo<TBase extends Constructor>(Base: TBase): {
    new (...args: any[]): {
        /** @lends Map.prototype */
        /**
         * Caculate distance of two coordinates.
         * @param {Number[]|Coordinate} coord1 - coordinate 1
         * @param {Number[]|Coordinate} coord2 - coordinate 2
         * @return {Number} distance, unit is meter
         * @function MapTopo.computeGeometryLength
         * @example
         * var distance = map.computeLength([0, 0], [0, 20]);
         */
        computeLength(coord1: Coordinate, coord2: Coordinate): any;
        /**
         * Caculate a geometry's length.
         * @param {Geometry} geometry - geometry to caculate
         * @return {Number} length, unit is meter
         * @function MapTopo.computeGeometryLength
         */
        computeGeometryLength(geometry: Geometry): any;
        /**
         * Caculate a geometry's area.
         * @param  {Geometry} geometry - geometry to caculate
         * @return {Number} area, unit is sq.meter
         * @function MapTopo.computeGeometryArea
         */
        computeGeometryArea(geometry: Geometry): any;
        /**
         * Identify the geometries on the given coordinate.
         * @param {Object} opts - the identify options
         * @param {Coordinate} opts.coordinate - coordinate to identify
         * @param {Object}   opts.layers        - the layers to perform identify on.
         * @param {Function} [opts.filter=null] - filter function of the result geometries, return false to exclude.
         * @param {Number}   [opts.count=null]  - limit of the result count.
         * @param {Number}   [opts.tolerance=0] - identify tolerance in pixel.
         * @param {Boolean}  [opts.includeInternals=false] - whether to identify internal layers.
         * @param {Boolean}  [opts.includeInvisible=false] - whether to identify invisible layers.
         * @param {Function} callback           - the callback function using the result geometries as the parameter.
         * @return {Map} this
         * @function MapTopo.identify
         * @example
         * map.identify({
         *      coordinate: [0, 0],
         *      layers: [layer]
         *  },
         *  geos => {
         *      console.log(geos);
         *  });
         */
        identify(opts: any, callback: any): any;
        /**
         * Identify the geometries on the given container point.
         * @param {Object} opts - the identify options
         * @param {Point} opts.containerPoint - container point to identify
         * @param {Object}   opts.layers        - the layers to perform identify on.
         * @param {Function} [opts.filter=null] - filter function of the result geometries, return false to exclude.
         * @param {Number}   [opts.count=null]  - limit of the result count.
         * @param {Number}   [opts.tolerance=0] - identify tolerance in pixel.
         * @param {Boolean}  [opts.includeInternals=false] - whether to identify internal layers.
         * @param {Boolean}  [opts.includeInvisible=false] - whether to identify invisible layers.
         * @param {Function} callback           - the callback function using the result geometries as the parameter.
         * @return {Map} this
         * @function MapTopo.identifyAtPoint
         * @example
         * map.identifyAtPoint({
         *      containerPoint: [200, 300],
         *      layers: [layer]
         *  },
         *  geos => {
         *      console.log(geos);
         *  });
         */
        identifyAtPoint(opts: any, callback: any): any;
        _identify(opts: any, callback: any, fn: any): any;
    };
} & TBase;
export {};
