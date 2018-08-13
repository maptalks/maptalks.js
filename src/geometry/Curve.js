import LineString from './LineString';
import Canvas2d from '../core/Canvas';

const options = {
    'enableSimplify' : false,
    'enableClip' : false
};

/**
 * Curve style LineString, an abstract parent class for all the curves.
 * @category geometry
 * @abstract
 * @extends LineString
 * @param {Coordinate[]|Number[][]} coordinates - coordinates of the line string
 * @param {Object} [options=null] - construct options defined in [LineString]{@link LineString#options}
 * @property {Boolean} [options.enableSimplify=false] - whether to simplify path before rendering
 * @property {Boolean} [options.enableClip=false] - whether to clip curve with map's current extent
 */
class Curve extends LineString {

    _arc(ctx, points, lineOpacity) {
        const degree = this.options['arcDegree'] * Math.PI / 180;
        for (let i = 1, l = points.length; i < l; i++) {
            const c = Canvas2d._arcBetween(ctx, points[i - 1], points[i], degree);
            //add control points to caculate normal of arrow
            const ctrlPoint = [(points[i - 1].x + points[i].x) - c[0], (points[i - 1].y + points[i].y) - c[1]];
            points[i - 1].nextCtrlPoint = ctrlPoint;
            points[i].prevCtrlPoint = ctrlPoint;
            Canvas2d._stroke(ctx, lineOpacity);
        }
    }

    _quadraticCurve(ctx, points) {
        if (points.length <= 2) {
            Canvas2d._path(ctx, points);
            return;
        }
        let i, l;
        for (i = 2, l = points.length; i < l; i += 2) {
            ctx.quadraticCurveTo(points[i - 1].x, points[i - 1].y, points[i].x, points[i].y);
        }
        i -= 1;
        if (i < l) {
            for (;i < l; i++) {
                ctx.lineTo(points[i].x, points[i].y);
            }
        }
    }

    _bezierCurve(ctx, points) {
        if (points.length <= 3) {
            Canvas2d._path(ctx, points);
            return;
        }
        let i, l;
        for (i = 1, l = points.length; i + 2 < l; i += 3) {
            ctx.bezierCurveTo(points[i].x, points[i].y, points[i + 1].x, points[i + 1].y, points[i + 2].x, points[i + 2].y);
        }
        if (i < l) {
            for (; i < l; i++) {
                ctx.lineTo(points[i].x, points[i].y);
            }
        }
    }

    _getCurveArrowPoints(arrows, segments, lineWidth, arrowStyle, tolerance, step) {
        const l = segments.length;
        let i;
        for (i = step; i < l; i += step) {
            arrows.push(this._getArrowShape(segments[i - 1], segments[i], lineWidth, arrowStyle, tolerance));
        }
        i -= step;
        if (i < l - 1) {
            for (i += 1; i < l; i++) {
                arrows.push(this._getArrowShape(segments[i - 1], segments[i], lineWidth, arrowStyle, tolerance));
            }
        }
    }
}

Curve.mergeOptions(options);

export default Curve;
