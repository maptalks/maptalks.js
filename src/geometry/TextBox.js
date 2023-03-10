import { extend, isNil } from '../core/util';
import { escapeSpecialChars } from '../core/util/strings';
import TextMarker from './TextMarker';
import { isFunctionDefinition, interpolated } from '@maptalks/function-type';

/**
 * @property {Object} [options=null]                   - textbox's options, also including options of [Marker]{@link Marker#options}
 * @property {Boolean} [options.textStyle]             - the default text style of text
 * @property {Boolean} [options.textStyle.wrap=true]             - whether to autowrap text in the textbox
 * @property {Boolean} [options.textStyle.padding=[12, 8]]       - text padding in the box
 * @property {Boolean} [options.textStyle.verticalAlignment=middle]  - text's vertical alignment
 * @property {Boolean} [options.textStyle.horizontalAlignment=true]  - text's horizontal alignment
 * @property {Boolean} [options.boxSymbol=null]        - box symbol of textbox
 * @memberOf TextBox
 * @instance
 */
const options = {
    'textStyle' :  {
        'wrap' : true,
        'padding' : [12, 8],
        'verticalAlignment' : 'middle',
        'horizontalAlignment' : 'middle'
    },
    'boxSymbol' : null
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
class TextBox extends TextMarker {
    /**
     * @param {String} content                 - TextBox's text content
     * @param {Coordinate} coordinates         - coordinates
     * @param {Number} width                   - width in pixel
     * @param {Number} height                  - height in pixel
     * @param {Object} [options=null]          - construct options defined in [TextBox]{@link TextBox#options}
     */
    constructor(content, coordinates, width, height, options = {}) {
        super(coordinates, options);
        this._content = escapeSpecialChars(content);
        this._width = isNil(width) ? 100 : width;
        this._height = isNil(height) ? 40 : height;
        if (options.boxSymbol) {
            this.setBoxSymbol(options.boxSymbol);
        }
        if (options.textStyle) {
            this.setTextStyle(options.textStyle);
        }
        this._refresh();
    }

    /**
     * Get textbox's width
     * @return {Number}
     */
    getWidth() {
        return this._width;
    }

    /**
     * Set new width to textbox
     * @param {Number} width
     * returns {TextBox} this
     */
    setWidth(width) {
        this._width = width;
        this._refresh();
        return this;
    }

    /**
     * Get textbox's height
     * @return {Number}
     */
    getHeight() {
        return this._height;
    }

    /**
     * Set new height to textbox
     * @param {Number} height
     * returns {TextBox} this
     */
    setHeight(height) {
        this._height = height;
        this._refresh();
        return this;
    }

    /**
     * Get textbox's boxSymbol
     * @return {Object} boxsymbol
     */
    getBoxSymbol() {
        return extend({}, this.options.boxSymbol);
    }

    /**
     * Set a new box symbol to textbox
     * @param {Object} symbol
     * returns {TextBox} this
     */
    setBoxSymbol(symbol) {
        this.options.boxSymbol = symbol ? extend({}, symbol) : symbol;
        if (this.getSymbol()) {
            this._refresh();
        }
        return this;
    }

    /**
     * Get textbox's text style
     * @return {Object}
     */
    getTextStyle() {
        if (!this.options.textStyle) {
            return null;
        }
        return extend({}, this.options.textStyle);
    }

    /**
     * Set a new text style to the textbox
     * @param {Object} style new text style
     * returns {TextBox} this
     */
    setTextStyle(style) {
        this.options.textStyle = style ? extend({}, style) : style;
        if (this.getSymbol()) {
            this._refresh();
        }
        return this;
    }

    static fromJSON(json) {
        const feature = json['feature'];
        const textBox = new TextBox(json['content'], feature['geometry']['coordinates'], json['width'], json['height'], json['options']);
        textBox.setProperties(feature['properties']);
        textBox.setId(feature['id']);
        if (json['symbol']) {
            textBox.setSymbol(json['symbol']);
        }
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
        const textStyle = this.getTextStyle() || {},
            padding = textStyle['padding'] || [12, 8];
        let maxWidth, maxHeight;
        if (isFunctionDefinition(this._width)) {
            maxWidth = JSON.parse(JSON.stringify(this._width));
            const stops = maxWidth.stops;
            if (stops) {
                for (let i = 0; i < stops.length; i++) {
                    stops[i][1] = stops[i][1] - 2 * padding[0];
                }
            }
        } else {
            maxWidth = this._width - 2 * padding[0];
        }
        if (isFunctionDefinition(this._height)) {
            maxHeight = JSON.parse(JSON.stringify(this._height));
            const stops = maxHeight.stops;
            if (stops) {
                for (let i = 0; i < stops.length; i++) {
                    stops[i][1] = stops[i][1] - 2 * padding[1];
                }
            }
        } else {
            maxHeight = this._height - 2 * padding[1];
        }
        const symbol = extend({},
            textStyle.symbol || this._getDefaultTextSymbol(),
            this.options.boxSymbol || this._getDefaultBoxSymbol(),
            {
                'textName' : this._content,
                'markerWidth' : this._width,
                'markerHeight' : this._height,
                'textHorizontalAlignment' : 'middle',
                'textVerticalAlignment' : 'middle',
                'textMaxWidth' : maxWidth,
                'textMaxHeight' : maxHeight
            });

        if (textStyle['wrap'] && !symbol['textWrapWidth']) {
            symbol['textWrapWidth'] = maxWidth;
        }

        // function-type markerWidth and markerHeight doesn't support left/right horizontalAlignment and top/bottom verticalAlignment now
        const hAlign = textStyle['horizontalAlignment'];
        symbol['textDx'] = symbol['markerDx'] || 0;
        let offsetX;
        if (isFunctionDefinition(this._width)) {
            offsetX = JSON.parse(JSON.stringify(this._width));
            const stops = offsetX.stops;
            if (stops) {
                for (let i = 0; i < stops.length; i++) {
                    stops[i][1] = stops[i][1] / 2 - padding[0];
                    if (hAlign === 'left') {
                        stops[i][1] *= -1;
                    }
                }
            }
        } else {
            offsetX = symbol['markerWidth'] / 2 - padding[0];
            if (hAlign === 'left') {
                offsetX *= -1;
            }
        }
        if (hAlign === 'left') {
            symbol['textHorizontalAlignment'] = 'right';
            symbol['textDx'] = offsetX;
        } else if (hAlign === 'right') {
            symbol['textHorizontalAlignment'] = 'left';
            symbol['textDx'] = offsetX;
        }

        const vAlign = textStyle['verticalAlignment'];
        symbol['textDy'] = symbol['markerDy'] || 0;
        let offsetY;
        if (isFunctionDefinition(this._height)) {
            offsetY = JSON.parse(JSON.stringify(this._height));
            const stops = offsetY.stops;
            if (stops) {
                for (let i = 0; i < stops.length; i++) {
                    stops[i][1] = stops[i][1] / 2 - padding[1];
                    if (vAlign === 'top') {
                        stops[i][1] *= -1;
                    }
                }
            }
        } else {
            offsetY = symbol['markerHeight'] / 2 - padding[1];
            if (vAlign === 'top') {
                offsetY *= -1;
            }
        }
        if (vAlign === 'top') {
            symbol['textVerticalAlignment'] = 'bottom';
            symbol['textDy'] = offsetY;
        } else if (vAlign === 'bottom') {
            symbol['textVerticalAlignment'] = 'top';
            symbol['textDy'] = offsetY;
        }
        this._refreshing = true;
        this.updateSymbol(symbol);
        delete this._refreshing;
    }

    startEdit(opts) {
        const symbol = this._getCompiledSymbol();
        if (isFunctionDefinition(this._width)) {
            const markerWidth = symbol['markerWidth'];
            this._oldWidth = this._width;
            this.setWidth(markerWidth);
        }
        if (isFunctionDefinition(this._height)) {
            const markerHeight = symbol['markerHeight'];
            this._oldHeight = this._height;
            this.setHeight(markerHeight);
        }
        super.startEdit(opts);
    }

    endEdit() {
        const map = this.getMap();
        const zoom = map && map.getZoom();
        if (this._oldWidth) {
            const markerWidth = this._width;
            const widthFn = interpolated(this._oldWidth);
            const oldExpectedWidth = widthFn(zoom);
            const scale = markerWidth / oldExpectedWidth;
            const stops = this._oldWidth.stops;
            for (let i = 0; i < stops.length; i++) {
                stops[i][1] *= scale;
            }
            this.setWidth(this._oldWidth);
            delete this._oldWidth;
        }
        if (this._oldHeight) {
            const markerHeight = this._height;
            const heightFn = interpolated(this._oldHeight);
            const oldExpectedHeight = heightFn(zoom);
            const scale = markerHeight / oldExpectedHeight;
            const stops = this._oldHeight.stops;
            for (let i = 0; i < stops.length; i++) {
                stops[i][1] *= scale;
            }
            this.setHeight(this._oldHeight);
            delete this._oldHeight;
        }
        super.endEdit();
    }
}

TextBox.mergeOptions(options);

TextBox.registerJSONType('TextBox');

export default TextBox;
