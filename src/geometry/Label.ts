import { extend } from '../core/util';
import { getAlignPoint, escapeSpecialChars } from '../core/util/strings';
import Coordinate from '../geo/Coordinate';
import Size from '../geo/Size';
import { TextSymbol, VectorMarkerSymbol } from '../symbol';
import TextMarker, { TextMarkerOptionsType } from './TextMarker';

/**
 * @property {Object} [options=null]                   - textbox's options, also including options of [Marker]{@link Marker#options}
 * @property {Boolean} [options.boxStyle=null]             - the default box style of text
 * @property {Boolean} [options.boxStyle.padding=[12, 8]]           - text padding in the box
 * @property {Boolean} [options.boxStyle.verticalAlignment=middle]  - text's vertical alignment
 * @property {Boolean} [options.boxStyle.horizontalAlignment=true]  - text's horizontal alignment
 * @property {Number} [options.boxStyle.minWidth=0]                 - label box's minWidth
 * @property {Number} [options.boxStyle.minHeight=0]                - label box's minHeight
 * @property {Boolean} [options.textSymbol=null]        - text symbol of label
 * @memberOf Label
 * @instance
 */
const options: LabelOptionsType = {
    'boxStyle': null, /*{
        'padding' : [12, 8],
        'verticalAlignment' : 'middle',
        'horizontalAlignment' : 'middle',
        'minWidth' : 0,
        'minHeight' : 0,
        'symbol' : null
    }*/
    textSymbol: null
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
class Label extends TextMarker {

    public options: any

    /**
     * @param {String} content                 - Label's text content
     * @param {Coordinate} coordinates         - coordinates
     * @param {Object} [options=null]          - construct options defined in [Label]{@link Label#options}
     */
    constructor(content: string, coordinates: Coordinate | Array<number>, options: LabelOptionsType = {}) {
        super(coordinates, options);
        if (options.textSymbol) {
            this.setTextSymbol(options.textSymbol);
        }
        if (options.boxStyle) {
            this.setBoxStyle(options.boxStyle);
        }
        this._content = escapeSpecialChars(content);
        this._refresh();
    }

    /**
     * 获取标注的边框样式
     * @english
     * Get label's box style
     * @return {Object}
     */
    getBoxStyle(): BoxStyle {
        if (!this.options.boxStyle) {
            return null;
        }
        return extend({}, this.options.boxStyle);
    }

    /**
     * 设置标注的边框样式
     * @english
     * Set a new box style to the label
     * @param {Object}
     * @returns {Label} this
     */
    setBoxStyle(style: BoxStyle) {
        this.options.boxStyle = style ? extend({}, style) : style;
        this._refresh();
        return this;
    }

    /**
     * 获取标注的文本样式
     * Get label's text symbol
     * @return {Object}
     */
    getTextSymbol(): TextSymbol {
        return extend({}, this._getDefaultTextSymbol(), this.options.textSymbol);
    }

    /**
     * 给标注设置新的文本样式
     * @english
     * Set a new text symbol to the label
     * @param {Object} symbol
     * @returns {Label} this
     */
    setTextSymbol(symbol: TextSymbol) {
        this.options.textSymbol = symbol ? extend({}, symbol) : symbol;
        this._refresh();
        return this;
    }

    static fromJSON(json: { [key: string]: any }): Label {
        const feature = json['feature'];
        const label = new Label(json['content'], feature['geometry']['coordinates'], json['options']);
        label.setProperties(feature['properties']);
        label.setId(feature['id']);
        if (json['symbol']) {
            label.setSymbol(json['symbol']);
        }
        return label;
    }

    _canEdit(): boolean {
        return false;
    }

    _toJSON(options: any) {
        return {
            'feature': this.toGeoJSON(options),
            'subType': 'Label',
            'content': this._content
        };
    }

    _refresh(): void {
        const symbol = extend({},
            this.getTextSymbol(),
            {
                'textName': this._content
            });

        const boxStyle = this.getBoxStyle();
        if (boxStyle) {
            extend(symbol, boxStyle.symbol);
            const sizes = this._getBoxSize(symbol),
                textSize = sizes[1],
                padding = boxStyle['padding'] || this._getDefaultPadding();
            const boxSize = sizes[0];
            //if no boxSize then use text's size in default
            symbol['markerWidth'] = boxSize['width'];
            symbol['markerHeight'] = boxSize['height'];

            const dx = symbol['textDx'] || 0,
                dy = symbol['textDy'] || 0,
                textAlignPoint = getAlignPoint(textSize, symbol['textHorizontalAlignment'], symbol['textVerticalAlignment'])
                    ._add(dx as number, dy as number);

            const hAlign = boxStyle['horizontalAlignment'] || 'middle';
            symbol['markerDx'] = textAlignPoint.x;
            if (hAlign === 'left') {
                symbol['markerDx'] += symbol['markerWidth'] / 2 - padding[0];
            } else if (hAlign === 'right') {
                symbol['markerDx'] -= symbol['markerWidth'] / 2 - textSize['width'] - padding[0];
            } else {
                symbol['markerDx'] += textSize['width'] / 2;
            }

            const vAlign = boxStyle['verticalAlignment'] || 'middle';
            symbol['markerDy'] = textAlignPoint.y;
            if (vAlign === 'top') {
                symbol['markerDy'] += symbol['markerHeight'] / 2 - padding[1];
            } else if (vAlign === 'bottom') {
                symbol['markerDy'] -= symbol['markerHeight'] / 2 - textSize['height'] - padding[1];
            } else {
                symbol['markerDy'] += textSize['height'] / 2;
            }
        }
        this._refreshing = true;
        this.updateSymbol(symbol);
        delete this._refreshing;
    }

    _getBoxSize(symbol: any): any {
        if (!symbol['markerType']) {
            symbol['markerType'] = 'square';
        }
        const boxStyle = this.getBoxStyle();
        const size = this._getTextSize(symbol);
        let width, height;
        const padding = boxStyle['padding'] || this._getDefaultPadding();
        width = size['width'] + padding[0] * 2;
        height = size['height'] + padding[1] * 2;
        if (boxStyle['minWidth']) {
            if (!width || width < boxStyle['minWidth']) {
                width = boxStyle['minWidth'];
            }
        }
        if (boxStyle['minHeight']) {
            if (!height || height < boxStyle['minHeight']) {
                height = boxStyle['minHeight'];
            }
        }
        return [new Size(width, height), size];
    }

}
Label.mergeOptions(options);
Label.registerJSONType('Label');

export default Label;

type BoxStyle = {
    padding?: [number, number];
    verticalAlignment?: 'top' | 'middle' | 'bottom';
    horizontalAlignment?: 'left' | 'middle' | 'right';
    minWidth?: number;
    minHeight?: number;
    symbol?: VectorMarkerSymbol;
}
export type LabelOptionsType = TextMarkerOptionsType & {
    textSymbol?: TextSymbol;
    boxStyle?: BoxStyle;
};
