/**
 * @classdesc
 * Represents point type geometry for text labels.<br>
 * A label is used to draw text (with a box background if specified) on a particular coordinate.
 * @class
 * @extends maptalks.Marker
 * @param {String} content                          - Label's text content
 * @param {maptalks.Coordinate} coordinates         - center
 * @param {Object} [options=null]                   - construct options, includes options defined in [Marker]{@link maptalks.Marker#options}
 * @param {Boolean} [options.box=true]              - whether to display a background box wrapping the label text.
 * @param {Boolean} [options.boxAutoSize=true]      - whether to set the size of the background box automatically to fit for the label text.
 * @param {Boolean} [options.boxMinWidth=0]         - the minimum width of the background box.
 * @param {Boolean} [options.boxMinHeight=0]        - the minimum height of the background box.
 * @param {Boolean} [options.boxPadding=maptalks.Size(12,8)] - padding of the label text to the border of the background box.
 * @param {Boolean} [options.boxTextAlign=center]   - text align in the box, possible values:left, middle, right
 * @example
 * var label = new maptalks.Label('This is a label',[100,0]);
 * label.addTo(vectorLayer);
 */
Z.Label = Z.Marker.extend(/** @lends maptalks.Label.prototype */{
    /**
     * @property {Object} defaultSymbol Default symbol of the label text
     * @static
     */
    defaultSymbol : {
        "textFaceName"  : "monospace",
        "textSize": 12,
        "textWrapBefore": false,
        "textWrapCharacter": "\n",
        "textLineSpacing": 8,
        "textHorizontalAlignment": "middle",//left middle right
        "textVerticalAlignment": "middle" //top middle bottom
    },

    /**
     * @property {Object} defaultSymbol Default symbol of the background box
     * @static
     */
    defaultBoxSymbol:{
        "markerType":"square",
        "markerLineColor": "#ff0000",
        "markerLineWidth": 2,
        "markerLineOpacity": 1,
        "markerFill": "#ffffff"
    },

    /**
     * @property {Object} [options=null]                   - label's options, also including options of [Marker]{@link maptalks.Marker#options}
     * @property {Boolean} [options.box=true]              - whether to display a background box wrapping the label text.
     * @property {Boolean} [options.boxAutoSize=true]      - whether to set the size of the background box automatically to fit for the label text.
     * @property {Boolean} [options.boxMinWidth=0]         - the minimum width of the background box.
     * @property {Boolean} [options.boxMinHeight=0]        - the minimum height of the background box.
     * @property {Boolean} [options.boxPadding=maptalks.Size(12,8)] - padding of the label text to the border of the background box.
     * @property {Boolean} [options.boxTextAlign=center]   - text align in the box, possible values:left, middle, right
     */
    options: {
        'box'          :   true,
        'boxAutoSize'  :   true,
        'boxMinWidth'  :   0,
        'boxMinHeight' :   0,
        'boxPadding'   :   new Z.Size(12,8),
        'boxTextAlign' :   'middle'
    },

    initialize: function (content, coordinates, options) {
        this._content = content;
        this._coordinates = new Z.Coordinate(coordinates);
        this._initOptions(options);
        this._registerEvents();
        this._refresh();
    },

    /**
     * Get text content of the label
     * @returns {String}
     */
    getContent: function() {
        return this._content;
    },

    /**
     * Set a new text content to the label
     * @return {maptalks.Label} this
     * @fires maptalks.Label#contentchange
     */
    setContent: function(content) {
        var old = this._content;
        this._content = content;
        this._refresh();
        /**
         * an event when changing label's text content
         * @event contentchange
         * @type {Object}
         * @property {String} type - contentchange
         * @property {maptalks.Label} target - label fires the event
         * @property {String} old - old content
         * @property {String} new - new content
         */
        this._fireEvent('contentchange',{'old':old, 'new':content});
        return this;
    },

    setSymbol:function(symbol) {
        if (!symbol || symbol === this.options['symbol']) {
           symbol = {};
        }
       var camelSymbol = this._prepareSymbol(symbol);
       var s = {};
       Z.Util.extend(s, this.defaultSymbol);
       if (this.options['box']) {
            Z.Util.extend(s, this.defaultBoxSymbol);
       }
       Z.Util.extend(s,camelSymbol);
       this._symbol = s;
       this._refresh();
       return this;
    },

    /**
     * Export a profile json out of the label. <br>
     * A specific property named "subType" with the value of "Label" will be exported in label's profile json. <br>
     * This is because label is a subtype of marker, subType property is used to tell the program to reproduce a label instead of a marker.
     * @param {Object}  [options=null]          - export options
     * @param {Boolean} [opts.geometry=true]    - whether export feature's geometry
     * @param {Boolean} [opts.properties=true]  - whether export feature's properties
     * @param {Boolean} [opts.options=true]     - whether export construct options
     * @param {Boolean} [opts.symbol=true]      - whether export symbol
     * @param {Boolean} [opts.infoWindow=true]  - whether export infowindow
     * @return {Object} profile json object
     */
    toJSON:function(options) {
        if (!options) {
            options = {};
        }
        var json = {
            "feature" : this.toGeoJSON(options),
            "subType" : "Label",
            "content" : this._content
        };
        var other = this._exportGraphicOptions(options);
        Z.Util.extend(json,other);
        return json;
    },

    onConfig:function(conf) {
        var isRefresh = false;
        for (var p in conf) {
            if (conf.hasOwnProperty(p)) {
                if (p.indexOf('box') >= 0) {
                    isRefresh = true;
                    break;
                }
            }
        }
        if (isRefresh) {
            this._refresh();
        }
    },

    _refresh:function() {
        var symbol = this.getSymbol();
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
                symbol['markerWidth'] = size['width']+padding['width']*2;
                symbol['markerHeight'] = size['height']+padding['height']*2;
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
            var align = this.options['boxTextAlign'];
            if (align) {
                var textAlignPoint = Z.StringUtil.getAlignPoint(size, symbol['textHorizontalAlignment'], symbol['textVerticalAlignment']);
                textAlignPoint = textAlignPoint._add(new Z.Point(Z.Util.getValueOrDefault(symbol['textDx'],0),Z.Util.getValueOrDefault(symbol['textDy'],0)));
                symbol['markerDx'] = textAlignPoint.x;
                symbol['markerDy'] = textAlignPoint.y + size['height']/2;
                if (align === 'left') {
                   symbol['markerDx'] += symbol['markerWidth']/2 - padding['width'];
                } else if (align === 'right') {
                   symbol['markerDx'] -= symbol['markerWidth']/2 - size['width'] - padding['width'];
                } else {
                    symbol['markerDx'] += size['width']/2;
                }
            }
        }
        this._symbol = symbol;
        this._onSymbolChanged();
    },

    _registerEvents: function() {
        this.on('shapechange', this._refresh, this);
        this.on('remove', this._onLabelRemove, this);
        return this;
    },

    _onLabelRemove:function() {
        this.off('shapechange', this._refresh, this);
        this.off('remove', this._onLabelRemove,this);
    }
});

Z.Label._fromJSON=function(json) {
    var feature = json['feature'];
    var label = new Z.Label(json['content'], feature['geometry']['coordinates'], json['options']);
    label.setProperties(feature['properties']);
    return label;
}
