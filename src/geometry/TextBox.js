/**
 * @classdesc
 * Represents point type geometry for text labels.<br>
 * A label is used to draw text (with a box background if specified) on a particular coordinate.
 * @class
 * @category geometry
 * @extends maptalks.TextMarker
 * @param {String} content                          - TextBox's text content
 * @param {maptalks.Coordinate} coordinates         - center
 * @param {Object} [options=null]                   - construct options, includes options defined in [Marker]{@link maptalks.Marker#options}
 * @param {Boolean} [options.box=true]              - whether to display a background box wrapping the label text.
 * @param {Boolean} [options.boxAutoSize=true]      - whether to set the size of the background box automatically to fit for the label text.
 * @param {Boolean} [options.boxMinWidth=0]         - the minimum width of the background box.
 * @param {Boolean} [options.boxMinHeight=0]        - the minimum height of the background box.
 * @param {Boolean} [options.boxPadding=maptalks.Size(12,8)] - padding of the textBox text to the border of the background box.
 * @param {*} options.* - any other option defined in [maptalks.Marker]{@link maptalks.Marker#options}
 * @example
 * var textBox = new maptalks.TextBox('This is a textBox',[100,0])
 *     .addTo(layer);
 */
Z.TextBox = Z.TextMarker.extend(/** @lends maptalks.TextBox.prototype */{

    /**
     * @property {Object} [options=null]                   - label's options, also including options of [Marker]{@link maptalks.Marker#options}
     * @property {Boolean} [options.box=true]              - whether to display a background box wrapping the label text.
     * @property {Boolean} [options.boxAutoSize=true]      - whether to set the size of the background box automatically to fit for the label text.
     * @property {Boolean} [options.boxMinWidth=0]         - the minimum width of the background box.
     * @property {Boolean} [options.boxMinHeight=0]        - the minimum height of the background box.
     * @property {Boolean} [options.boxPadding={'width' : 12, 'height' : 8}] - padding of the label text to the border of the background box.
     * @property {Boolean} [options.boxTextAlign=middle]   - text align in the box, possible values:left, middle, right
     * @property {*} options.* - any other option defined in [maptalks.Marker]{@link maptalks.Marker#options}
     */
    options: {
        'box'          :   true,
        'boxAutoSize'  :   true,
        'boxMinWidth'  :   0,
        'boxMinHeight' :   0,
        'boxPadding'   :   {'width' : 12, 'height' : 8}
    },

    _toJSON:function (options) {
        return {
            'feature' : this.toGeoJSON(options),
            'subType' : 'TextBox',
            'content' : this._content
        };
    },

    _refresh:function () {
        var symbol = this.getSymbol() || this._getDefaultLabelSymbol();
        symbol['textName'] = this._content;
        if (this.options['box']) {
            if (!symbol['markerType']) {
                symbol['markerType'] = 'square';
            }
            var size;
            var padding = this.options['boxPadding'];
            if (this.options['boxAutoSize'] || this.options['boxTextAlign']) {
                size = Z.StringUtil.splitTextToRow(this._content, symbol)['size'];
            }
            if (this.options['boxAutoSize']) {
                symbol['markerWidth'] = size['width'] + padding['width'] * 2;
                symbol['markerHeight'] = size['height'] + padding['height'] * 2;
            }
            if (this.options['boxMinWidth']) {
                if (!symbol['markerWidth'] || symbol['markerWidth'] < this.options['boxMinWidth']) {
                    symbol['markerWidth'] = this.options['boxMinWidth'];
                }
            }
            if (this.options['boxMinHeight']) {
                if (!symbol['markerHeight'] || symbol['markerHeight'] < this.options['boxMinHeight']) {
                    symbol['markerHeight'] = this.options['boxMinHeight'];
                }
            }
            var textAlign = symbol['textHorizontalAlignment'];
            if (textAlign) {
                symbol['textDx'] = symbol['markerDx'] || 0;
                symbol['textDy'] = symbol['markerDy'] || 0;
                if (textAlign === 'left') {
                    symbol['textDx'] -= symbol['markerWidth'] / 2;
                } else if (textAlign === 'right') {
                    symbol['textDx'] += symbol['markerWidth'] / 2;
                }
            }
        }
        this._symbol = symbol;
        this.onSymbolChanged();
    }
});

Z.TextBox._fromJSON = function (json) {
    var feature = json['feature'];
    var textBox = new Z.TextBox(json['content'], feature['geometry']['coordinates'], json['options']);
    textBox.setProperties(feature['properties']);
    return textBox;
};
