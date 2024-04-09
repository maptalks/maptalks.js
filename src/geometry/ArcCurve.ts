import Curve, { CurveOptionsType } from './Curve';
import Canvas from '../core/Canvas';

/**
 * @property {Object} options
 * @property {Number} [options.arcDegree=90]           - circle arc's degree.
 * @memberOf ArcCurve
 * @instance
 */
const options: ArcCurveOptionsType = {
    'arcDegree': 90
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
class ArcCurve extends Curve {
    _toJSON(options: any): any {
        return {
            'feature': this.toGeoJSON(options),
            'subType': 'ArcCurve'
        };
    }

    // paint method on canvas
    _paintOn(ctx: CanvasRenderingContext2D, points: any, lineOpacity: number): void {
        ctx.beginPath();
        this._arc(ctx, points, lineOpacity);
        Canvas._stroke(ctx, lineOpacity);
        this._paintArrow(ctx, points, lineOpacity);
    }

    static fromJSON(json: any) {
        const feature = json['feature'];
        const arc = new ArcCurve(feature['geometry']['coordinates'], json['options']);
        arc.setProperties(feature['properties']);
        return arc;
    }
}

ArcCurve.registerJSONType('ArcCurve');

ArcCurve.mergeOptions(options);

export default ArcCurve;

export type ArcCurveOptionsType = CurveOptionsType & {
    arcDegree?: number;
};
