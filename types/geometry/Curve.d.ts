import LineString, { LineStringOptionsType } from './LineString';
export type CurveOptionsType = LineStringOptionsType & {
    'enableSimplify'?: boolean;
    'enableClip'?: boolean;
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
declare class Curve extends LineString {
    _arc(ctx: any, points: any, lineOpacity: any): void;
    _quadraticCurve(ctx: any, points: any): void;
    _bezierCurve(ctx: any, points: any): void;
    _getCurveArrowPoints(arrows: any, segments: any, lineWidth: any, arrowStyle: any, tolerance: any, step: any): void;
}
export default Curve;
