/**
 * Methods of topo computations
 */
Z.Map.include(/** @lends maptalks.Map.prototype */{
    /**
     * Caculate distance of two coordinates.
     * @param {Number[]|maptalks.Coordinate} coord1 - coordinate 1
     * @param {Number[]|maptalks.Coordinate} coord2 - coordinate 2
     * @return {Number} distance
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
     * @return {Number} length
     */
    computeGeometryLength:function (geometry) {
        return geometry._computeGeodesicLength(this.getProjection());
    },

    /**
     * Caculate a geometry's area.
     * @param  {maptalks.Geometry} geometry - geometry to caculate
     * @return {Number} area
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
        for (i = 0; i < reqLayers.length; i++) {
            if (Z.Util.isString(reqLayers[i])) {
                layers.push(this.getLayer(reqLayers[i]));
            } else {
                layers.push(reqLayers[i]);
            }
        }
        var point = this.coordinateToViewPoint(opts['coordinate'])._round();
        var fn = callback,
            filter = opts['filter'];
        var hits = [],
            isEnd = false;
        for (i = layers.length - 1; i >= 0; i--) {
            if (isEnd) {
                break;
            }
            var layer = layers[i];
            if (!layer || !layer.getMap() || (!opts['includeInternals'] && layer.getId().indexOf(Z.internalLayerPrefix) >= 0)) {
                continue;
            }
            var allGeos = layers[i].getGeometries();
            for (var j = allGeos.length - 1; j >= 0; j--) {
                var geo = allGeos[j];
                if (!geo || !geo.isVisible()) {
                    continue;
                }
                var pxExtent = !geo._getPainter() ? null : geo._getPainter().getPixelExtent();
                if (!pxExtent || !pxExtent.contains(point)) {
                    continue;
                }
                if (geo._containsPoint(point) && (!filter || (filter && filter(geo)))) {
                    hits.push(geo);
                    if (opts['count']) {
                        if (hits.length >= opts['count']) {
                            isEnd = true;
                            break;
                        }
                    }
                }
            }
        }
        fn.call(this, hits);
        return this;
    }

});
