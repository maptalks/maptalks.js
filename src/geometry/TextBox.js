import { extend } from 'core/util';
import TextMarker from './TextMarker';

/**
 * @property {Object} [options=null]                   - textbox's options, also including options of [Marker]{@link Marker#options}
 * @property {Boolean} [options.boxAutoSize=false]     - whether to set the size of the box automatically to fit for the textbox's text.
 * @property {Boolean} [options.boxMinWidth=0]         - the minimum width of the box.
 * @property {Boolean} [options.boxMinHeight=0]        - the minimum height of the box.
 * @property {Boolean} [options.boxPadding={'width' : 12, 'height' : 8}] - padding of the text to the border of the box.
 * @memberOf TextBox
 * @instance
 */
const options = {
    'textStyle' :  {
        'padding' : [12, 8],
        'verticalAlignment' : 'middle',
        'horizontalAlignment' : 'middle'
    }
};

/**
 * @classdesc
 * Represents point type geometry for text boxes.<br>
 * A TextBox is used to draw a box with text inside on a particular coordinate.
 * @category geometry
 * @extends TextMarker
 * @mixes TextEditable
 * @param {String} content                          - TextBox's text content
 * @param {Coordinate} coordinates         - center
 * @param {Object} [options=null]                   - construct options defined in [TextBox]{@link TextBox#options}
 * @example
 * var textBox = new TextBox('This is a textBox',[100,0])
 *     .addTo(layer);
 */
class TextBox extends TextMarker {

    constructor(text, coordinates, width, height, options) {
        super(text, coordinates, options);
        this._width = width;
        this._height = height;
        this._refresh();
    }

    getWidth() {
        return this.width;
    }

    setWidth(width) {
        this._width = width;
        this._refresh();
        return this;
    }

    getHeight() {
        return this._height;
    }

    setHeight(height) {
        this._height = height;
        this._refresh();
        return this;
    }

    getBoxSymbol() {
        return extend({}, this.options.boxSymbol);
    }

    setBoxSymbol(symbol) {
        this.options.boxSymbol = extend({}, symbol);
        this._refresh();
        return this;
    }

    getTextStyle() {
        return extend({}, this.options.textStyle);
    }

    setTextStyle(style) {
        this.options.textStyle = style;
        this._refresh();
        return this;
    }

    static fromJSON(json) {
        const feature = json['feature'];
        const textBox = new TextBox(json['content'], feature['geometry']['coordinates'], json['width'], json['height'], json['options']);
        textBox.setProperties(feature['properties']);
        textBox.setId(feature['id']);
        return textBox;
    }

    _toJSON(options) {
        return {
            'feature': this.toGeoJSON(options),
            'width' : this.getWidth(),
            'height' : this.getHeight(),
            'subType': 'TextBox',
            'content': this._content
        };
    }

    _refresh() {
        const textStyle = this.getTextStyle();
        const symbol = extend({},
            textStyle.symbol || this._getDefaultTextSymbol(),
            this.options.boxSymbol || this._getDefaultBoxSymbol(),
            {
                'textName' : this._content,
                'markerWidth' : this._width,
                'markerHeight' : this._height,
                'textHorizontalAlignment' : 'middle',
                'textVerticalAlignment' : 'middle'
            });

        const padding = textStyle['padding'] || [12, 8];

        const hAlign = textStyle['horizontalAlignment'];
        symbol['textDx'] = symbol['markerDx'] || 0;
        const offsetX = symbol['markerWidth'] / 2 - padding[0];
        if (hAlign === 'left') {
            symbol['textHorizontalAlignment'] = 'right';
            symbol['textDx'] = symbol['textDx'] - offsetX;
        } else if (hAlign === 'right') {
            symbol['textHorizontalAlignment'] = 'left';
            symbol['textDx'] = symbol['textDx'] + offsetX;
        }

        const vAlign = textStyle['verticalAlignment'];
        symbol['textDy'] = symbol['markerDy'] || 0;
        const offsetY = symbol['markerHeight'] / 2 - padding[1];
        if (vAlign === 'top') {
            symbol['textVerticalAlignment'] = 'bottom';
            symbol['textDy'] -= offsetY;
        } else if (vAlign === 'bottom') {
            symbol['textVerticalAlignment'] = 'top';
            symbol['textDy'] += offsetY;
        }

        this.setSymbol(symbol);
    }
}

TextBox.mergeOptions(options);

TextBox.registerJSONType('TextBox');

export default TextBox;
