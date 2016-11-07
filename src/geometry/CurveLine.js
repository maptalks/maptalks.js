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
    _paintOn: function (ctx, points, lineOpacity) {
        var arcDegree = this.options['arcDegree'],
            curveType = this.options['curveType'];
        var curveFn, degree;
        switch (curveType) {
        case 0 : curveFn = Z.Canvas._lineTo; degree = 1; break;
        case 1 : curveFn = Z.Canvas._arcBetween; degree = 1; break;
        case 2 : curveFn = Z.Canvas._quadraticCurveTo; degree = 2; break;
        case 3 : curveFn = Z.Canvas._bezierCurveTo; degree = 3; break;
        }
        var i, len = points.length;
        ctx.beginPath();
        for (i = 0; i < len; i += degree) {
            // var p = points[i].round();
            var p = points[i];
            if (i === 0) {
                ctx.moveTo(p.x, p.y);
            }
            var left = len - i;
            if (left <= degree) {
                if (left === 2) {
                    p = points[len - 1];
                    ctx.lineTo(p.x, p.y);
                } else if (left === 3) {
                    Z.Canvas._quadraticCurveTo(ctx, points[len - 2], points[len - 1]);
                }
            } else {
                var pts = [];
                for (var ii = 0; ii < degree; ii++) {
                    pts.push(points[i + ii + 1]);
                }
                var args = [ctx].concat(pts);
                if (curveFn === Z.Canvas._arcBetween) {
                    //arc start point
                    args.splice(1, 0, p);
                    args = args.concat([arcDegree]);
                }
                curveFn.apply(Z.Canvas, args);
                Z.Canvas._stroke(ctx, lineOpacity);
            }
        }
        Z.Canvas._stroke(ctx, lineOpacity);
        if (ctx.setLineDash) {
            //remove line dash effect if any
            ctx.setLineDash([]);
        }
        if (this.options['arrowStyle'] && points.length >= 2) {
            var placement = this.options['arrowPlacement'];
            if (placement === 'vertex-first' || placement === 'vertex-firstlast') {
                this._arrow(ctx, points[1], points[0], lineOpacity, this.options['arrowStyle']);
            }
            if (placement === 'vertex-last' || placement === 'vertex-firstlast') {
                this._arrow(ctx, points[points.length - 2], points[points.length - 1], lineOpacity, this.options['arrowStyle']);
            }
            //besizerCurves doesn't have point arrows
            if ((curveType === 0 || curveType === 1) && placement === 'point') {
                for (i = 0, len = points.length - 1; i < len; i++) {
                    this._arrow(ctx, points[i], points[i + 1], lineOpacity, this.options['arrowStyle']);
                }
            }
        }
    }
});

Z.CurveLine.fromJSON = function (json) {
    var feature = json['feature'];
    var curveLine = new Z.CurveLine(feature['geometry']['coordinates'], json['options']);
    curveLine.setProperties(feature['properties']);
    return curveLine;
};
