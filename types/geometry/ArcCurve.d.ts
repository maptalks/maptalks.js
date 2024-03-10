import Curve, { CurveOptionsType } from './Curve';
export type ArcCurveOptionsType = CurveOptionsType & {
    'arcDegree'?: number;
};
/**
 * @classdesc
 * Circle Arc Curve
 * @category geometry
 * @extends Curve
 * @param {Coordinate[]|Number[][]} coordinates - coordinates of the curve
 * @param {Object} [options=null]   - construct options defined in [ArcCurve]{@link ArcCurve#options}
 * @example
 * var curve = new ArcCurve(
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
declare class ArcCurve extends Curve {
    _toJSON(options: any): {
        feature: object;
        subType: string;
    };
    _paintOn(ctx: any, points: any, lineOpacity: any): void;
    static fromJSON(json: any): ArcCurve;
}
export default ArcCurve;
