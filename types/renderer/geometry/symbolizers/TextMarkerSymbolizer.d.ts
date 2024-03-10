import Point from '../../../geo/Point';
import PointSymbolizer from './PointSymbolizer';
export default class TextMarkerSymbolizer extends PointSymbolizer {
    _dynamic: any;
    strokeAndFill: any;
    _textDesc: any;
    _index: number;
    static test(symbol: any): boolean;
    constructor(symbol: any, geometry: any, painter: any);
    symbolize(ctx: any, resources: any): void;
    getPlacement(): any;
    getRotation(): number;
    getDxDy(): Point;
    getFixedExtent(): any;
    translate(): {
        textName: any;
        textFaceName: any;
        textWeight: any;
        textStyle: any;
        textSize: any;
        textFont: any;
        textFill: any;
        textOpacity: any;
        textHaloFill: any;
        textHaloRadius: any;
        textHaloOpacity: any;
        textWrapWidth: any;
        textWrapCharacter: any;
        textLineSpacing: any;
        textDx: any;
        textDy: any;
        textHorizontalAlignment: any;
        textVerticalAlignment: any;
        textAlign: any;
        textRotation: any;
        textMaxWidth: any;
        textMaxHeight: any;
    };
    translateLineAndFill(s: any): {
        lineColor: any;
        lineWidth: any;
        lineOpacity: any;
        lineDasharray: any;
        lineCap: string;
        lineJoin: string;
        polygonFill: any;
        polygonOpacity: any;
    };
}
