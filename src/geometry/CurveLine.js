/**
 * @classdesc Curve style LineString
 * @class
 * @category geometry
 * @extends {maptalks.LineString}
 * @param {maptalks.Coordinate[]|Number[][]} coordinates - coordinates of the line string
 * @param {Object} [options=null]   - construct options defined in [maptalks.CurveLine]{@link maptalks.CurveLine#options}
 * @example
 * var curve = new maptalks.CurveLine(
 *     [
 *         [121.47083767181408,31.214448123476995],
 *         [121.4751292062378,31.215475523000404],
 *         [121.47869117980943,31.211916269810335]
 *     ],
 *     {
 *         curveType : 1,
 *         arcDegree : 120,
 *         symbol : {
 *             'lineWidth' : 5
 *         }
 *     }
 * ).addTo(layer);
 */
Z.CurveLine = Z.LineString.extend(/** @lends maptalks.CurveLine.prototype */{
    /**
     * @property {Object} options
     * @property {Number} [options.curveType=1]            - curve type of the curve line: 0 - straight line; 1: circle arc; 2: quadratic curve; 3: bezier curve
     * @property {Number} [options.arcDegree=90]           - arc's degree if curveType is 1 (circle arc).
     */
    options:{
        'curveType'   : 1,
        'arcDegree'     : 90
    },

    _toJSON:function (options) {
        return {
            'feature' : this.toGeoJSON(options),
            'subType' : 'CurveLine'
        };
    },

    _getPaintParams: function () {
        var prjVertexes = this._getPrjCoordinates();
        var points = this._getPath2DPoints(prjVertexes);
        return [points];
    },

    // paint method on canvas
    _paintOn: function (ctx, points, lineOpacity, fillOpacity, dasharray) {
        var curveType = this.options['curveType'];
        ctx.beginPath();
        if (curveType === 1) {
            this._arc(ctx, points, lineOpacity);
        } else if (curveType === 0) {
            Z.Canvas.path(ctx, points, lineOpacity, null, dasharray);
        } else if (curveType === 2) {
            ctx.moveTo(points[0].x, points[0].y);
            this._quadraticCurve(ctx, points, lineOpacity);
        } else if (curveType === 3) {
            ctx.moveTo(points[0].x, points[0].y);
            this._bezierCurve(ctx, points, lineOpacity);
        }
        Z.Canvas._stroke(ctx, lineOpacity);
        var placement = this.options['arrowPlacement'];
        // bezier curves doesn't support point arrows.
        if ((curveType === 2 || curveType === 3) && placement === 'point') {
            placement = 'vertex-last';
        }
        this._paintArrow(ctx, points, lineOpacity, placement);
    },

    _arc: function (ctx, points, lineOpacity) {
        var degree = this.options['arcDegree']  * Math.PI / 180;
        for (var i = 1, l = points.length; i < l; i++) {
            Z.Canvas._arcBetween(ctx, points[i - 1], points[i], degree);
            Z.Canvas._stroke(ctx, lineOpacity);
        }
    },

    // reference:
    // http://stackoverflow.com/questions/7054272/how-to-draw-smooth-curve-through-n-points-using-javascript-html5-canvas
    _quadraticCurve: function (ctx, points) {
        var i, len = points.length;
        if (len <= 2) {
            Z.Canvas._path(ctx, points);
            return;
        }
        var xc, yc;
        for (i = 1; i < len - 2; i++) {
            xc = (points[i].x + points[i + 1].x) / 2;
            yc = (points[i].y + points[i + 1].y) / 2;
            ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
        }
            // curve through the last two points
        ctx.quadraticCurveTo(points[i].x, points[i].y, points[i + 1].x, points[i + 1].y);
    },

    _bezierCurve: function (ctx, points) {
        var i, len = points.length;
        if (len <= 2) {
            Z.Canvas._path(ctx, points);
            return;
        }
        var f = 0.3;
        var t = 0.6;

        var m = 0;
        var dx1 = 0;
        var dy1 = 0;
        var dx2, dy2;
        var curP, nexP;
        var preP = points[0];
        for (i = 1; i < len; i++) {
            curP = points[i];
            nexP = points[i + 1];
            if (nexP) {
                m = (nexP.y - preP.y) / (nexP.x - preP.x);
                dx2 = (nexP.x - curP.x) * -f;
                dy2 = dx2 * m * t;
            } else {
                dx2 = 0;
                dy2 = 0;
            }
            ctx.bezierCurveTo(preP.x - dx1, preP.y - dy1, curP.x + dx2, curP.y + dy2, curP.x, curP.y);
            dx1 = dx2;
            dy1 = dy2;
            preP = curP;
        }
    }
});

Z.CurveLine.fromJSON = function (json) {
    var feature = json['feature'];
    var curveLine = new Z.CurveLine(feature['geometry']['coordinates'], json['options']);
    curveLine.setProperties(feature['properties']);
    return curveLine;
};
