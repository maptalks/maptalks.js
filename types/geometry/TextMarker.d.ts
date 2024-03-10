import { GeometyOptionsType } from './Geometry';
import Marker from './Marker';
export type TextMarkerOptionsType = GeometyOptionsType;
declare const TextMarker_base: {
    new (...args: any[]): {
        _textEditor: any;
        _editUIMarker: import("src/ui").UIMarker;
        startEditText(): any;
        endEditText(): any;
        isEditingText(): boolean;
        getTextEditor(): import("src/ui").UIMarker;
        _prepareEditor(): void;
        _getEditorOffset(): {
            dx: number;
            dy: number;
        };
        _createEditor(): HTMLElement;
        _setCursorToLast(obj: any): void;
    };
} & typeof Marker;
/**
 * @classdesc
 * Base class for  the Text marker classes, a marker which has text and background box. <br>
 * It is abstract and not intended to be instantiated.
 * @category geometry
 * @abstract
 * @extends Marker
 */
declare class TextMarker extends TextMarker_base {
    _content: string;
    _refreshing: boolean;
    /**
     * Get text content of the label
     * @returns {String}
     */
    getContent(): string;
    /**
     * Set a new text content to the label
     * @return {Label} this
     * @fires Label#contentchange
     */
    setContent(content: string): this;
    onAdd(): void;
    toJSON(): object;
    setSymbol(symbol: any): any;
    _parseSymbol(symbol: any): {}[];
    _getTextSize(symbol: any): import("src").Size;
    _getInternalSymbol(): any;
    _getDefaultTextSymbol(): object;
    _getDefaultBoxSymbol(): object;
    _getDefaultPadding(): number[];
}
export default TextMarker;
