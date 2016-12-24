import { extend } from 'core/util';
import splitTextToRow from 'core/util/text';
import Coordinate from 'geo/Coordinate';
import Size from 'geo/Size';
import Geometry from './Geometry';
import Marker from './Marker';

/**
 * @classdesc
 * Base class for  the Text marker classes, a marker which has text and background box. <br>
 * It is abstract and not intended to be instantiated.
 *
 * @class
 * @category geometry
 * @abstract
 * @extends Marker
 */
export const TextMarker = Marker.extend(/** @lends TextMarker.prototype */ {

    options: {
        'box': true,
    },

    defaultSymbol: {
        'textFaceName': 'monospace',
        'textSize': 12,
        'textWrapBefore': false,
        'textWrapCharacter': '\n',
        'textLineSpacing': 8,
        'textHorizontalAlignment': 'middle', //left middle right
        'textVerticalAlignment': 'middle', //top middle bottom
        'textOpacity': 1,
        'textDx': 0,
        'textDy': 0
    },

    defaultBoxSymbol: {
        'markerType': 'square',
        'markerLineColor': '#000',
        'markerLineWidth': 2,
        'markerLineOpacity': 1,
        'markerFill': '#fff',
        'markerOpacity': 1
    },


    initialize: function (content, coordinates, options) {
        this._content = content;
        this._coordinates = new Coordinate(coordinates);
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
     * @return {Label} this
     * @fires Label#contentchange
     */
    setContent: function (content) {
        var old = this._content;
        this._content = content;
        this._refresh();
        /**
         * an event when changing label's text content
         * @event Label#contentchange
         * @type {Object}
         * @property {String} type - contentchange
         * @property {Label} target - label fires the event
         * @property {String} old - old content
         * @property {String} new - new content
         */
        this._fireEvent('contentchange', {
            'old': old,
            'new': content
        });
        return this;
    },

    getSymbol: function () {
        if (this._textSymbolChanged) {
            return Geometry.prototype.getSymbol.call(this);
        }
        return null;
    },

    setSymbol: function (symbol) {
        if (!symbol || symbol === this.options['symbol']) {
            this._textSymbolChanged = false;
            symbol = {};
        } else {
            this._textSymbolChanged = true;
        }
        var cooked = this._prepareSymbol(symbol);
        var s = this._getDefaultTextSymbol();
        extend(s, cooked);
        this._symbol = s;
        this._refresh();
        return this;
    },

    onConfig: function (conf) {
        var needRepaint = false;
        for (var p in conf) {
            if (conf.hasOwnProperty(p)) {
                if (p.slice(0, 3) === 'box') {
                    needRepaint = true;
                    break;
                }
            }
        }
        if (needRepaint) {
            this._refresh();
        }
        return Marker.prototype.onConfig.apply(this, arguments);
    },

    _getBoxSize: function (symbol) {
        if (!symbol['markerType']) {
            symbol['markerType'] = 'square';
        }
        var size = splitTextToRow(this._content, symbol)['size'],
            width, height;
        if (this.options['boxAutoSize']) {
            var padding = this.options['boxPadding'];
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
        return [width && height ? new Size(width, height) : null, size];
    },

    _getInternalSymbol: function () {
        return this._symbol;
    },

    _getDefaultTextSymbol: function () {
        var s = {};
        extend(s, this.defaultSymbol);
        if (this.options['box']) {
            extend(s, this.defaultBoxSymbol);
        }
        return s;
    },

    _registerEvents: function () {
        this.on('shapechange', this._refresh, this);
    },

    onRemove: function () {
        this.off('shapechange', this._refresh, this);
    }
});

export default TextMarker;
