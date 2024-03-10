import PointSymbolizer from './PointSymbolizer';
export default class ImageMarkerSymbolizer extends PointSymbolizer {
    _url: any;
    static test(symbol: any): boolean;
    constructor(symbol: any, geometry: any, painter: any);
    symbolize(ctx: any, resources: any): void;
    _getImage(resources: any): any;
    getFixedExtent(resources: any): any;
    translate(): {
        markerFile: any;
        markerOpacity: any;
        markerWidth: any;
        markerHeight: any;
        markerRotation: any;
        markerDx: any;
        markerDy: any;
        markerHorizontalAlignment: any;
        markerVerticalAlignment: any;
    };
}
