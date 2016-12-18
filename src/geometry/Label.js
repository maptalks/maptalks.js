import { getAlignPoint } from 'core/util';
import Size from 'geo/Size';
import TextMarker from './TextMarker';

/**
 * @classdesc
 * Represents point type geometry for text labels.<br>
 * A label is used to draw text (with a box background if specified) on a particular coordinate.
 * @class
 * @category geometry
 * @extends TextMarker
 * @mixes TextMarker.Editor
 * @param {String} content                          - Label's text content
 * @param {Coordinate} coordinates         - center
 * @param {Object} [options=null]                   - construct options defined in [Label]{@link Label#options}
 * @example
 * var label = new Label('This is a label',[100,0])
 *     .addTo(layer);
 */
const Label = TextMarker.extend(/** @lends Label.prototype */ {

    /**
     * @property {Object} [options=null]                   - label's options, also including options of [Marker]{@link Marker#options}
     * @property {Boolean} [options.box=true]              - whether to display a background box wrapping the label text.
     * @property {Boolean} [options.boxAutoSize=true]      - whether to set the size of the background box automatically to fit for the label text.
     * @property {Boolean} [options.boxMinWidth=0]         - the minimum width of the background box.
     * @property {Boolean} [options.boxMinHeight=0]        - the minimum height of the background box.
     * @property {Boolean} [options.boxPadding={'width' : 12, 'height' : 8}] - padding of the label text to the border of the background box.
     * @property {Boolean} [options.boxTextAlign=middle]   - text align in the box, possible values:left, middle, right
     */
    options: {
        'boxAutoSize': true,
        'boxMinWidth': 0,
        'boxMinHeight': 0,
        'boxPadding': {
            'width': 12,
            'height': 8
        },
        'boxTextAlign': 'middle'
    },

    _toJSON: function (options) {
        return {
            'feature': this.toGeoJSON(options),
            'subType': 'Label',
            'content': this._content
        };
    },

    _refresh: function () {
        var symbol = this.getSymbol() || this._getDefaultTextSymbol();
        symbol['textName'] = this._content;
        if (this.options['box']) {
            var sizes = this._getBoxSize(symbol),
                boxSize = sizes[0],
                textSize = sizes[1],
                padding = this.options['boxPadding'];

            //if no boxSize then use text's size in default
            if (!boxSize && !symbol['markerWidth'] && !symbol['markerHeight']) {
                var width = textSize['width'] + padding['width'] * 2,
                    height = textSize['height'] + padding['height'] * 2;
                boxSize = new Size(width, height);
                symbol['markerWidth'] = boxSize['width'];
                symbol['markerHeight'] = boxSize['height'];
            } else if (boxSize) {
                symbol['markerWidth'] = boxSize['width'];
                symbol['markerHeight'] = boxSize['height'];
            }

            var align = this.options['boxTextAlign'];
            if (align) {
                var textAlignPoint = getAlignPoint(textSize, symbol['textHorizontalAlignment'], symbol['textVerticalAlignment']),
                    dx = symbol['textDx'] || 0,
                    dy = symbol['textDy'] || 0;
                textAlignPoint = textAlignPoint._add(dx, dy);
                symbol['markerDx'] = textAlignPoint.x;
                symbol['markerDy'] = textAlignPoint.y + textSize['height'] / 2;
                if (align === 'left') {
                    symbol['markerDx'] += symbol['markerWidth'] / 2 - padding['width'];
                } else if (align === 'right') {
                    symbol['markerDx'] -= symbol['markerWidth'] / 2 - textSize['width'] - padding['width'];
                } else {
                    symbol['markerDx'] += textSize['width'] / 2;
                }
            }
        }
        this._symbol = symbol;
        this.onSymbolChanged();
    }
});

Label.fromJSON = function (json) {
    var feature = json['feature'];
    var label = new Label(json['content'], feature['geometry']['coordinates'], json['options']);
    label.setProperties(feature['properties']);
    label.setId(feature['id']);
    return label;
};

export default Label;
