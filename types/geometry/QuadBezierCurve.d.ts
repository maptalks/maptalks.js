import Curve from './Curve';
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
declare class QuadBezierCurve extends Curve {
    static fromJSON(json: any): QuadBezierCurve;
    _toJSON(options: any): {
        feature: object;
        subType: string;
    };
    _paintOn(ctx: any, points: any, lineOpacity: any): void;
    _getArrowPoints(arrows: any, segments: any, lineWidth: any, arrowStyle: any, tolerance: any): void;
}
export default QuadBezierCurve;
