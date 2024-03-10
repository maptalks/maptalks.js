import Symbolizer from './Symbolizer';
/**
 * @classdesc
 * Base symbolizer class for all the symbolizers base on HTML5 Canvas2D
 * @abstract
 * @class
 * @private
 * @memberOf symbolizer
 * @name CanvasSymbolizer
 * @extends {Symbolizer}
 */
declare class CanvasSymbolizer extends Symbolizer {
    _opacityFn: any;
    symbol: any;
    _prepareContext(ctx: any): void;
    prepareCanvas(ctx: any, style: any, resources?: any): void;
    remove(): void;
    setZIndex(): void;
    show(): void;
    hide(): void;
    _defineStyle(style: any): any;
}
export default CanvasSymbolizer;
