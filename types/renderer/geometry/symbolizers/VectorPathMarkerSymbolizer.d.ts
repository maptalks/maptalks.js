import ImageMarkerSymbolizer from './ImageMarkerSymbolizer';
export default class VectorPathMarkerSymbolizer extends ImageMarkerSymbolizer {
    static test(symbol: any): boolean;
    constructor(symbol: any, geometry: any, painter: any);
    _prepareContext(): void;
    _getImage(resources: any): any;
}
