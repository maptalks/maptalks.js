import TextMarker, { TextMarkerOptionsType } from './TextMarker';
export type TextBoxOptionsType = TextMarkerOptionsType & {
    'textStyle'?: any;
    'boxSymbol'?: any;
};
/**
 * @classdesc
 * Represents point type geometry for text boxes.<br>
 * A TextBox is used to draw a box with text inside on a particular coordinate.
 * @category geometry
 * @extends TextMarker
 * @mixes TextEditable
 * @example
 * var textbox = new maptalks.TextBox('This is a textbox',
    [0, 0], 200, 90,
    {
      'draggable' : true,
      'textStyle' : {
        'wrap' : true,
        'padding' : [12, 8],
        'verticalAlignment' : 'top',
        'horizontalAlignment' : 'right',
        'symbol' : {
          'textFaceName' : 'monospace',
          'textFill' : '#34495e',
          'textHaloFill' : '#fff',
          'textHaloRadius' : 4,
          'textSize' : 18,
          'textWeight' : 'bold'
        }
      },
      'boxSymbol': {
        // box's symbol
        'markerType' : 'square',
        'markerFill' : 'rgb(135,196,240)',
        'markerFillOpacity' : 0.9,
        'markerLineColor' : '#34495e',
        'markerLineWidth' : 1
      }
    });
 */
declare class TextBox extends TextMarker {
    _width: number;
    _height: number;
    _oldWidth: number;
    _oldHeight: number;
    /**
     * @param {String} content                 - TextBox's text content
     * @param {Coordinate} coordinates         - coordinates
     * @param {Number} width                   - width in pixel
     * @param {Number} height                  - height in pixel
     * @param {Object} [options=null]          - construct options defined in [TextBox]{@link TextBox#options}
     */
    constructor(content: any, coordinates: any, width: any, height: any, options?: TextBoxOptionsType);
    /**
     * Get textbox's width
     * @return {Number}
     */
    getWidth(): number;
    /**
     * Set new width to textbox
     * @param {Number} width
     * returns {TextBox} this
     */
    setWidth(width: number): this;
    /**
     * Get textbox's height
     * @return {Number}
     */
    getHeight(): number;
    /**
     * Set new height to textbox
     * @param {Number} height
     * returns {TextBox} this
     */
    setHeight(height: number): this;
    /**
     * Get textbox's boxSymbol
     * @return {Object} boxsymbol
     */
    getBoxSymbol(): object;
    /**
     * Set a new box symbol to textbox
     * @param {Object} symbol
     * returns {TextBox} this
     */
    setBoxSymbol(symbol: any): this;
    /**
     * Get textbox's text style
     * @return {Object}
     */
    getTextStyle(): object;
    /**
     * Set a new text style to the textbox
     * @param {Object} style new text style
     * returns {TextBox} this
     */
    setTextStyle(style: any): this;
    static fromJSON(json: any): TextBox;
    _toJSON(options: any): {
        feature: object;
        width: number;
        height: number;
        subType: string;
        content: string;
    };
    _refresh(): void;
    startEdit(opts: any): void;
    endEdit(): void;
}
export default TextBox;
