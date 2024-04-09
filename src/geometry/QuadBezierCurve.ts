import Curve, { CurveOptionsType } from './Curve';
import Canvas from '../core/Canvas';

/**
 * @classdesc
 * Quadratic Bezier Curve
 * @category geometry
 * @extends Curve
 * @param {Coordinate[]|Number[][]} coordinates - coordinates of the curve
 * @example
 * var curve = new QuadBezierCurve(
 *     [
 *         [121.47083767181408,31.214448123476995],
 *         [121.4751292062378,31.215475523000404],
 *         [121.47869117980943,31.211916269810335]
 *     ],
 *     {
 *         symbol : {
 *             'lineWidth' : 5
 *         }
 *     }
 * ).addTo(layer);
 */
class QuadBezierCurve extends Curve {
    static fromJSON(json: any): QuadBezierCurve {
        const feature = json['feature'];
        const curve = new QuadBezierCurve(feature['geometry']['coordinates'], json['options']);
        curve.setProperties(feature['properties']);
        return curve;
    }

    _toJSON(options: any): any {
        return {
            'feature': this.toGeoJSON(options),
            'subType': 'QuadBezierCurve'
        };
    }

    // paint method on canvas
    _paintOn(ctx: CanvasRenderingContext2D, points: any, lineOpacity: number) {
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        // @ts-expect-error todo
        this._quadraticCurve(ctx, points, lineOpacity);
        Canvas._stroke(ctx, lineOpacity);
        this._paintArrow(ctx, points, lineOpacity);
    }

    _getArrowPoints(arrows: any[], segments: [], lineWidth: number, arrowStyle: any, tolerance: any) {
        return this._getCurveArrowPoints(arrows, segments, lineWidth, arrowStyle, tolerance, 2);
    }
}

QuadBezierCurve.registerJSONType('QuadBezierCurve');

export default QuadBezierCurve;
export type QuadBezierCurveOptionsType = CurveOptionsType;
