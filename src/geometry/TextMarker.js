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
        if (this._textSymbolChanged) {
            return Z.Geometry.prototype.getSymbol.call(this);
        }
        return null;
    },

    setSymbol:function (symbol) {
        if (!symbol || symbol === this.options['symbol']) {
            this._textSymbolChanged = false;
            symbol = {};
        } else {
            this._textSymbolChanged = true;
        }
        var cooked = this._prepareSymbol(symbol);
        var s = this._getDefaultTextSymbol();
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

    _getBoxSize: function (symbol) {
        if (!symbol['markerType']) {
            symbol['markerType'] = 'square';
        }
        var size, width ,height;
        var padding = this.options['boxPadding'];
        if (this.options['boxAutoSize'] || this.options['boxTextAlign']) {
            size = Z.StringUtil.splitTextToRow(this._content, symbol)['size'];
        }
        if (this.options['boxAutoSize']) {
            width = size['width'] + padding['width'] * 2;
            height = size['height'] + padding['height'] * 2;
        }
        if (this.options['boxMinWidth']) {
            if (!width || width < this.options['boxMinWidth']) {
                width = this.options['boxMinWidth'];
            }
        }
        if (this.options['boxMinHeight']) {
            if (!height || height < this.options['boxMinHeight']) {
                height = this.options['boxMinHeight'];
            }
        }
        return [new Z.Size(width, height), size];
    },

    _getInternalSymbol:function () {
        return this._symbol;
    },

    _getDefaultTextSymbol: function () {
        var s = {};
        Z.Util.extend(s, this.defaultSymbol);
        if (this.options['box']) {
            Z.Util.extend(s, this.defaultBoxSymbol);
        }
        return s;
    },

    _registerEvents: function () {
        this.on('shapechange', this._refresh, this);
    },

    onRemove:function () {
        this.off('shapechange', this._refresh, this);
    }
});
