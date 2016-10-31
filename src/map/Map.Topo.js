/**
 * Methods of topo computations
 */
Z.Map.include(/** @lends maptalks.Map.prototype */{
    /**
     * Caculate distance of two coordinates.
     * @param {Number[]|maptalks.Coordinate} coord1 - coordinate 1
     * @param {Number[]|maptalks.Coordinate} coord2 - coordinate 2
     * @return {Number} distance, unit is meter
     * @example
     * var distance = map.computeLength([0, 0], [0, 20]);
     */
    computeLength: function (coord1, coord2) {
        if (!this.getProjection()) { return null; }
        var p1 = new Z.Coordinate(coord1),
            p2 = new Z.Coordinate(coord2);
        if (p1.equals(p2)) { return 0; }
        return this.getProjection().measureLength(p1, p2);
    },

    /**
     * Caculate a geometry's length.
     * @param {maptalks.Geometry} geometry - geometry to caculate
     * @return {Number} length, unit is meter
     */
    computeGeometryLength:function (geometry) {
        return geometry._computeGeodesicLength(this.getProjection());
    },

    /**
     * Caculate a geometry's area.
     * @param  {maptalks.Geometry} geometry - geometry to caculate
     * @return {Number} area, unit is sq.meter
     */
    computeGeometryArea:function (geometry) {
        return geometry._computeGeodesicArea(this.getProjection());
    },

    /**
     * Identify the geometries on the given coordinate.
     * @param {Object} opts - the identify options
     * @param {maptalks.Coordinate} opts.coordinate - coordinate to identify
     * @param {Object}   opts.layers        - the layers to perform identify on.
     * @param {Function} [opts.filter=null] - filter function of the result geometries, return false to exclude.
     * @param {Number}   [opts.count=null]  - limit of the result count.
     * @param {Boolean}  [opts.includeInternals=false] - whether to identify the internal layers.
     * @param {Function} callback           - the callback function using the result geometries as the parameter.
     * @return {maptalks.Map} this
     * @example
     * map.identify({
     *      coordinate: [0, 0],
     *      layers: [layer],
     *      success: function(geos){
     *          console.log(geos);
     *      }
     *  });
     */
    identify: function (opts, callback) {
        if (!opts) {
            return this;
        }
        var reqLayers = opts['layers'];
        if (!Z.Util.isArrayHasData(reqLayers)) {
            return this;
        }
        var layers = [];
        var i, len;
        for (i = 0, len = reqLayers.length; i < len; i++) {
            if (Z.Util.isString(reqLayers[i])) {
                layers.push(this.getLayer(reqLayers[i]));
            } else {
                layers.push(reqLayers[i]);
            }
        }
        var point = this.coordinateToPoint(new Z.Coordinate(opts['coordinate']));
        var options = Z.Util.extend({}, opts);
        var hits = [];
        for (i = layers.length - 1; i >= 0; i--) {
            if (opts['count'] && hits.length >= opts['count']) {
                break;
            }
            var layer = layers[i];
            if (!layer || !layer.getMap() || !layer.isVisible() || (!opts['includeInternals'] && layer.getId().indexOf(Z.internalLayerPrefix) >= 0)) {
                continue;
            }
            var layerHits = layer.identify(point, options);
            if (layerHits) {
                if (Z.Util.isArray(layerHits)) {
                    hits = hits.concat(layerHits);
                } else {
                    hits.push(layerHits);
                }
            }
        }
        callback.call(this, hits);
        return this;
    }

});
