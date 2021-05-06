import { INTERNAL_LAYER_PREFIX } from '../core/Constants';
import { isString, isArrayHasData, pushIn } from '../core/util';
import Coordinate from '../geo/Coordinate';
import Point from '../geo/Point';
import Map from './Map';

/**
 * Methods of topo computations
 */
Map.include(/** @lends Map.prototype */ {
    /**
     * Caculate distance of two coordinates.
     * @param {Number[]|Coordinate} coord1 - coordinate 1
     * @param {Number[]|Coordinate} coord2 - coordinate 2
     * @return {Number} distance, unit is meter
     * @example
     * var distance = map.computeLength([0, 0], [0, 20]);
     */
    computeLength: function (coord1, coord2) {
        if (!this.getProjection()) {
            return null;
        }
        const p1 = new Coordinate(coord1),
            p2 = new Coordinate(coord2);
        if (p1.equals(p2)) {
            return 0;
        }
        return this.getProjection().measureLength(p1, p2);
    },

    /**
     * Caculate a geometry's length.
     * @param {Geometry} geometry - geometry to caculate
     * @return {Number} length, unit is meter
     */
    computeGeometryLength: function (geometry) {
        return geometry._computeGeodesicLength(this.getProjection());
    },

    /**
     * Caculate a geometry's area.
     * @param  {Geometry} geometry - geometry to caculate
     * @return {Number} area, unit is sq.meter
     */
    computeGeometryArea: function (geometry) {
        return geometry._computeGeodesicArea(this.getProjection());
    },

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
     * @example
     * map.identify({
     *      coordinate: [0, 0],
     *      layers: [layer]
     *  },
     *  geos => {
     *      console.log(geos);
     *  });
     */
    identify: function (opts, callback) {
        opts = opts || {};
        const coordinate = new Coordinate(opts['coordinate']);
        return this._identify(opts, callback, layer => layer.identify(coordinate, opts));
    },

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
     * @example
     * map.identifyAtPoint({
     *      containerPoint: [200, 300],
     *      layers: [layer]
     *  },
     *  geos => {
     *      console.log(geos);
     *  });
     */
    identifyAtPoint: function (opts, callback) {
        opts = opts || {};
        const containerPoint = new Point(opts['containerPoint']);
        const coordinate = this.containerPointToCoord(containerPoint);
        return this._identify(opts, callback, layer => {
            if (layer.identifyAtPoint) {
                return layer.identifyAtPoint(containerPoint, opts);
            } else if (coordinate) {
                return layer.identify(coordinate, opts);
            } else {
                return [];
            }
        });
    },

    _identify: function (opts, callback, fn) {
        const reqLayers = opts['layers'];
        if (!isArrayHasData(reqLayers)) {
            return this;
        }
        const layers = [];
        for (let i = 0, len = reqLayers.length; i < len; i++) {
            if (isString(reqLayers[i])) {
                layers.push(this.getLayer(reqLayers[i]));
            } else {
                layers.push(reqLayers[i]);
            }
        }

        const hits = [];
        for (let i = layers.length - 1; i >= 0; i--) {
            if (opts['count'] && hits.length >= opts['count']) {
                break;
            }
            const layer = layers[i];
            if (!layer || !layer.getMap() || (!opts['includeInvisible'] && !layer.isVisible()) || (!opts['includeInternals'] && layer.getId().indexOf(INTERNAL_LAYER_PREFIX) >= 0)) {
                continue;
            }
            const layerHits = fn(layer);
            if (layerHits) {
                if (Array.isArray(layerHits)) {
                    pushIn(hits, layerHits);
                } else {
                    hits.push(layerHits);
                }
            }
        }
        callback.call(this, hits);
        return this;
    }

});
