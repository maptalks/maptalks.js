/**
 * @classdesc Circle Arc Curve
 * @class
 * @category geometry
 * @extends {maptalks.Curve}
 * @param {maptalks.Coordinate[]|Number[][]} coordinates - coordinates of the curve
 * @param {Object} [options=null]   - construct options defined in [maptalks.ArcCurve]{@link maptalks.ArcCurve#options}
 * @example
 * var curve = new maptalks.ArcCurve(
 *     [
 *         [121.47083767181408,31.214448123476995],
 *         [121.4751292062378,31.215475523000404],
 *         [121.47869117980943,31.211916269810335]
 *     ],
 *     {
 *         arcDegree : 120,
 *         symbol : {
 *             'lineWidth' : 5
 *         }
 *     }
 * ).addTo(layer);
 */
maptalks.ArcCurve = maptalks.Curve.extend(/** @lends maptalks.ArcCurve.prototype */{
    /**
     * @property {Object} options
     * @property {Number} [options.arcDegree=90]           - circle arc's degree.
     */
    options:{
        'arcDegree'     : 90
    },

    _toJSON: function (options) {
        return {
            'feature' : this.toGeoJSON(options),
            'subType' : 'ArcCurve'
        };
    },

    // paint method on canvas
    _paintOn: function (ctx, points, lineOpacity) {
        ctx.beginPath();
        this._arc(ctx, points, lineOpacity);
        maptalks.Canvas._stroke(ctx, lineOpacity);
        this._paintArrow(ctx, points, lineOpacity);
    }
});

maptalks.ArcCurve.fromJSON = function (json) {
    var feature = json['feature'];
    var arc = new maptalks.ArcCurve(feature['geometry']['coordinates'], json['options']);
    arc.setProperties(feature['properties']);
    return arc;
};
