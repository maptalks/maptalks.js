import Point from '../../../geo/Point';
import PointExtent from '../../../geo/PointExtent';
import PointSymbolizer from './PointSymbolizer';
export default class VectorMarkerSymbolizer extends PointSymbolizer {
    _dynamic: any;
    strokeAndFill: any;
    padding: number;
    _stamp: any;
    static test(symbol: any): boolean;
    constructor(symbol: any, geometry: any, painter: any);
    symbolize(ctx: any, resources: any): void;
    _drawMarkers(ctx: any, cookedPoints: any, resources: any): void;
    _drawMarkersWithCache(ctx: any, cookedPoints: any, resources: any): void;
    _createMarkerImage(ctx: any, resources: any): HTMLCanvasElement;
    _stampSymbol(): any;
    _getCacheImageAnchor(w: any, h: any): Point;
    _getGraidentExtent(points: any): PointExtent;
    _drawVectorMarker(ctx: any, point: any, resources: any): void;
    getFixedExtent(): any;
    translate(): {
        markerType: any;
        markerFill: any;
        markerFillOpacity: any;
        markerFillPatternFile: any;
        markerLineColor: any;
        markerLineWidth: any;
        markerLineOpacity: any;
        markerLineDasharray: any;
        markerLinePatternFile: any;
        markerDx: any;
        markerDy: any;
        markerWidth: any;
        markerHeight: any;
        markerRotation: any;
        shadowBlur: any;
        shadowOffsetX: any;
        shadowOffsetY: any;
    };
}
