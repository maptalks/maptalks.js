import Curve from './Curve';
/**
 * Cubic Bezier Curve
 * @category geometry
 * @extends Curve
 * @param {Coordinate[]|Number[][]} coordinates - coordinates of the curve
 * @param {Object} [options=null]   - construct options defined in [CubicBezierCurve]{@link CubicBezierCurve#options}
 * @example
 * var curve = new CubicBezierCurve(
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
declare class CubicBezierCurve extends Curve {
    static fromJSON(json: any): CubicBezierCurve;
    _toJSON(options: any): {
        feature: object;
        subType: string;
    };
    _paintOn(ctx: any, points: any, lineOpacity: any): void;
    _getArrowPoints(arrows: any, segments: any, lineWidth: any, arrowStyle: any, tolerance: any): void;
}
export default CubicBezierCurve;
