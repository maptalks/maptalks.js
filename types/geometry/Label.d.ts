import Size from '../geo/Size';
import TextMarker, { TextMarkerOptionsType } from './TextMarker';
export type LabelOptionsType = TextMarkerOptionsType & {
    boxStyle?: any;
    textSymbol?: any;
};
/**
 * @classdesc
 * Represents point type geometry for text labels.<br>
 * A label is used to draw text (with a box background if specified) on a particular coordinate.
 * @category geometry
 * @extends TextMarker
 * @mixes TextEditable
 * @example
 * var label = new maptalks.Label('label with a box',
    [0, 0],
    {
      'draggable' : true,
      'boxStyle' : {
        'padding' : [12, 8],
        'verticalAlignment' : 'top',
        'horizontalAlignment' : 'right',
        'minWidth' : 300,
        'minHeight' : 200,
        'symbol' : {
          'markerType' : 'square',
          'markerFill' : 'rgb(135,196,240)',
          'markerFillOpacity' : 0.9,
          'markerLineColor' : '#34495e',
          'markerLineWidth' : 1
        }
      },
      'textSymbol': {
        'textFaceName' : 'monospace',
        'textFill' : '#34495e',
        'textHaloFill' : '#fff',
        'textHaloRadius' : 4,
        'textSize' : 18,
        'textWeight' : 'bold',
        'textVerticalAlignment' : 'top'
      }
    });
 */
declare class Label extends TextMarker {
    /**
     * @param {String} content                 - Label's text content
     * @param {Coordinate} coordinates         - coordinates
     * @param {Object} [options=null]          - construct options defined in [Label]{@link Label#options}
     */
    constructor(content: any, coordinates: any, options?: LabelOptionsType);
    /**
     * Get label's box style
     * @return {Object}
     */
    getBoxStyle(): object;
    /**
     * Set a new box style to the label
     * @param {Object}
     * @returns {Label} this
     */
    setBoxStyle(style: any): this;
    /**
     * Get label's text symbol
     * @return {Object}
     */
    getTextSymbol(): object;
    /**
     * Set a new text symbol to the label
     * @param {Object} symbol
     * @returns {Label} this
     */
    setTextSymbol(symbol: any): this;
    static fromJSON(json: any): Label;
    _canEdit(): boolean;
    _toJSON(options: any): {
        feature: object;
        subType: string;
        content: string;
    };
    _refresh(): void;
    _getBoxSize(symbol: any): Size[];
}
export default Label;
