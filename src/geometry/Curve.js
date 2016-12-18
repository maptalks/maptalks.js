import LineString from './LineString';
import Canvas from 'utils/Canvas';

/**
 * @classdesc Curve style LineString, an abstract parent class for all the curves.
 * @class
 * @category geometry
 * @extends {LineString}
 */
const Curve = LineString.extend(/** @lends Curve.prototype */ {

    _arc: function (ctx, points, lineOpacity) {
        var degree = this.options['arcDegree'] * Math.PI / 180;
        for (var i = 1, l = points.length; i < l; i++) {
            Canvas._arcBetween(ctx, points[i - 1], points[i], degree);
            Canvas._stroke(ctx, lineOpacity);
        }
    },

    _quadraticCurve: function (ctx, points) {
        if (points.length <= 2) {
            Canvas._path(ctx, points);
            return;
        }
        Canvas.quadraticCurve(ctx, points);
    },

    _getCubicCurvePoints: function (points) {
        var ctrlPts = [];
        var f = 0.3;
        var t = 0.6;

        var m = 0;
        var dx1 = 0;
        var dy1 = 0;
        var dx2, dy2;
        var curP, nexP;
        var preP = points[0];
        for (var i = 1, len = points.length; i < len; i++) {
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
            // ctx.bezierCurveTo(preP.x - dx1, preP.y - dy1, curP.x + dx2, curP.y + dy2, curP.x, curP.y);
            ctrlPts.push(preP.x - dx1, preP.y - dy1, curP.x + dx2, curP.y + dy2, curP.x, curP.y);
            dx1 = dx2;
            dy1 = dy2;
            preP = curP;
        }
        return ctrlPts;
    },

    _bezierCurve: function (ctx, points) {

        if (points.length <= 2) {
            Canvas._path(ctx, points);
            return;
        }
        var ctrlPts = this._getCubicCurvePoints(points);
        var i, len = ctrlPts.length;
        for (i = 0; i < len; i += 6) {
            ctx.bezierCurveTo(ctrlPts[i], ctrlPts[i + 1], ctrlPts[i + 2], ctrlPts[i + 3], ctrlPts[i + 4], ctrlPts[i + 5]);
        }
    }
});

export default Curve;
