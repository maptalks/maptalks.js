import { extend } from 'core/util';
import { getAlignPoint } from 'core/util/strings';
import Size from 'geo/Size';
import TextMarker from './TextMarker';

/**
 * @property {Object} [options=null]                   - label's options, also including options of [Marker]{@link Marker#options}
 * @property {Boolean} [options.box=true]              - whether to display a background box wrapping the label text.
 * @property {Boolean} [options.boxAutoSize=true]      - whether to set the size of the background box automatically to fit for the label text.
 * @property {Boolean} [options.boxMinWidth=0]         - the minimum width of the background box.
 * @property {Boolean} [options.boxMinHeight=0]        - the minimum height of the background box.
 * @property {Boolean} [options.boxPadding={'width' : 12, 'height' : 8}] - padding of the label text to the border of the background box.
 * @property {Boolean} [options.boxTextAlign=middle]   - text align in the box, possible values:left, middle, right
 * @memberOf Label
 * @instance
 */
const options = {
    'boxStyle' : {
        'padding' : [12, 8],
        'verticalAlignment' : 'middle',
        'horizontalAlignment' : 'middle',
        'minWidth' : 0,
        'minHeight' : 0,
        'symbol' : null
    }
};

/**
 * @classdesc
 * Represents point type geometry for text labels.<br>
 * A label is used to draw text (with a box background if specified) on a particular coordinate.
 * @category geometry
 * @extends TextMarker
 * @mixes TextEditable
 * @param {String} content                          - Label's text content
 * @param {Coordinate} coordinates         - center
 * @param {Object} [options=null]                   - construct options defined in [Label]{@link Label#options}
 * @example
 * var label = new Label('This is a label',[100,0])
 *     .addTo(layer);
 */
class Label extends TextMarker {

    getBoxStyle() {
        return extend({}, this.options.boxStyle);
    }

    setBoxStyle(style) {
        this.options.boxStyle = style;
        this._refresh();
        return this;
    }

    getTextSymbol() {
        return extend({}, this.options.textSymbol);
    }

    setTextSymbol(symbol) {
        this.options.textSymbol = extend({}, symbol);
        this._refresh();
        return this;
    }

    static fromJSON(json) {
        const feature = json['feature'];
        const label = new Label(json['content'], feature['geometry']['coordinates'], json['options']);
        label.setProperties(feature['properties']);
        label.setId(feature['id']);
        return label;
    }

    _toJSON(options) {
        return {
            'feature': this.toGeoJSON(options),
            'subType': 'Label',
            'content': this._content,
            'textSymbol' : this.getTextSymbol()
        };
    }

    _refresh() {
        const symbol = extend({},
            this.getTextSymbol() || this._getDefaultTextSymbol(),
            {
                'textName' : this._content
            });

        const boxStyle = this.getBoxStyle();
        if (boxStyle) {
            extend(symbol, boxStyle.symbol);
            const sizes = this._getBoxSize(symbol),
                textSize = sizes[1],
                padding = boxStyle['padding'] || [12, 8];
            const boxSize = sizes[0];
            //if no boxSize then use text's size in default
            symbol['markerWidth'] = boxSize['width'];
            symbol['markerHeight'] = boxSize['height'];

            const dx = symbol['textDx'] || 0,
                dy = symbol['textDy'] || 0,
                textAlignPoint = getAlignPoint(textSize, symbol['textHorizontalAlignment'], symbol['textVerticalAlignment'])
                    ._add(dx, dy);

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
        this.setSymbol(symbol);
    }

    _getBoxSize(symbol) {
        if (!symbol['markerType']) {
            symbol['markerType'] = 'square';
        }
        const boxStyle = this.getBoxStyle();
        const size = this._getTextSize(symbol);
        let width, height;
        const padding = boxStyle['padding'];
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
