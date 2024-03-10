import Coordinate from '../../../geo/Coordinate';
import PointExtent from '../../../geo/PointExtent';
import CanvasSymbolizer from './CanvasSymbolizer';
export default class StrokeAndFillSymbolizer extends CanvasSymbolizer {
    style: any;
    _extMin: Coordinate;
    _extMax: Coordinate;
    _pxExtent: PointExtent;
    static test(symbol: any, geometry: any): boolean;
    constructor(symbol: any, geometry: any, painter: any);
    symbolize(ctx: any, resources: any): void;
    get2DExtent(): PointExtent;
    getFixedExtent(): PointExtent;
    _getPaintParams(): any;
    translate(): {
        lineColor: any;
        lineWidth: any;
        lineOpacity: any;
        lineDasharray: any;
        lineCap: any;
        lineJoin: any;
        linePatternFile: any;
        lineDx: any;
        lineDy: any;
        polygonFill: any;
        polygonOpacity: any;
        polygonPatternFile: any;
        polygonPatternDx: any;
        polygonPatternDy: any;
        linePatternDx: any;
        linePatternDy: any;
    };
    _createGradient(ctx: any, points: any, lineColor: any): void;
}
