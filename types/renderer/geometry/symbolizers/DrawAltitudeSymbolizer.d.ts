import Point from '../../../geo/Point';
import PointSymbolizer from './PointSymbolizer';
export default class DrawAltitudeSymbolizer extends PointSymbolizer {
    dxdy: any;
    static test(symbol: any, geometry: any): boolean;
    constructor(symbol: any, geometry: any, painter: any);
    symbolize(ctx: any): void;
    getDxDy(): Point;
    get2DExtent(): any;
    getPlacement(): string;
    _getPaintParams(dx: any, dy: any): any;
    _drawMarkerAltitude(ctx: any, point: any, groundPoint: any): void;
    _drawLineAltitude(ctx: any, points: any, groundPoints: any): void;
    _drawLine(ctx: any, points: any, groundPoints: any): void;
    _getStyle(): any;
}
