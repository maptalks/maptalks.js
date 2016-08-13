/**
 * @classdesc
 * Base class for  the Text marker classes, a marker which has text and background box. <br>
 * It is abstract and not intended to be instantiated.
 *
 * @class
 * @category geometry
 * @abstract
 * @extends maptalks.Marker
 * @name TextMarker
 */
Z.TextMarker = Z.Marker.extend(/** @lends maptalks.TextMarker.prototype */{

    defaultSymbol : {
        'textFaceName'  : 'monospace',
        'textSize': 12,
        'textWrapBefore': false,
        'textWrapCharacter': '\n',
        'textLineSpacing': 8,
        'textHorizontalAlignment': 'middle', //left middle right
        'textVerticalAlignment': 'middle' //top middle bottom
    },

    defaultBoxSymbol:{
        'markerType':'square',
        'markerLineColor': '#ff0000',
        'markerLineWidth': 2,
        'markerLineOpacity': 1,
        'markerFill': '#ffffff'
    },

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
        'boxAutoSize'  :   true,
        'boxMinWidth'  :   0,
        'boxMinHeight' :   0,
        'boxPadding'   :   {'width' : 12, 'height' : 8}
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
    getContent: function () {
        return this._content;
    },

    /**
     * Set a new text content to the label
     * @return {maptalks.Label} this
     * @fires maptalks.Label#contentchange
     */
    setContent: function (content) {
        var old = this._content;
        this._content = content;
        this._refresh();
        /**
         * an event when changing label's text content
         * @event maptalks.Label#contentchange
         * @type {Object}
         * @property {String} type - contentchange
         * @property {maptalks.Label} target - label fires the event
         * @property {String} old - old content
         * @property {String} new - new content
         */
        this._fireEvent('contentchange', {'old':old, 'new':content});
        return this;
    },

    getSymbol: function () {
        if (this._SymbolChanged) {
            return Z.Geometry.prototype.getSymbol.call(this);
        }
        return null;
    },

    setSymbol:function (symbol) {
        if (!symbol || symbol === this.options['symbol']) {
            this._SymbolChanged = false;
            symbol = {};
        } else {
            this._SymbolChanged = true;
        }
        var cooked = this._prepareSymbol(symbol);
        var s = this._getDefaultLabelSymbol();
        Z.Util.extend(s, cooked);
        this._symbol = s;
        this._refresh();
        return this;
    },

    onConfig:function (conf) {
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

    _getInternalSymbol:function () {
        return this._symbol;
    },

    _getDefaultLabelSymbol: function () {
        var s = {};
        Z.Util.extend(s, this.defaultSymbol);
        if (this.options['box']) {
            Z.Util.extend(s, this.defaultBoxSymbol);
        }
        return s;
    },

    _registerEvents: function () {
        this.on('shapechange', this._refresh, this);
        this.on('remove', this._onTextMarkerRemove, this);
        return this;
    },

    _onTextMarkerRemove:function () {
        this.off('shapechange', this._refresh, this);
        this.off('remove', this._onTextMarkerRemove, this);
    }
});
