import { extend } from 'core/util';
import { splitTextToRow, escapeSpecialChars } from 'core/util/strings';
// import Size from 'geo/Size';
// import Geometry from './Geometry';
import Marker from './Marker';

const defaultSymbol = {
    'textFaceName': 'monospace',
    'textSize': 12,
    'textLineSpacing': 8,
    'textHorizontalAlignment': 'middle', //left middle right
    'textVerticalAlignment': 'middle' //top middle bottom
};

const defaultBoxSymbol = {
    'markerType': 'square',
    'markerLineColor': '#000',
    'markerLineWidth': 2,
    'markerLineOpacity': 1,
    'markerFill': '#fff',
    'markerOpacity': 1
};

/**
 * @classdesc
 * Base class for  the Text marker classes, a marker which has text and background box. <br>
 * It is abstract and not intended to be instantiated.
 * @category geometry
 * @abstract
 * @extends Marker
 */
class TextMarker extends Marker {

    constructor(content, coordinates, options) {
        super(coordinates, options);
        this._content = escapeSpecialChars(content);
        this._refresh();
    }

    /**
     * Get text content of the label
     * @returns {String}
     */
    getContent() {
        return this._content;
    }

    /**
     * Set a new text content to the label
     * @return {Label} this
     * @fires Label#contentchange
     */
    setContent(content) {
        const old = this._content;
        this._content = escapeSpecialChars(content);
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
    }

    // getSymbol() {
    //     if (this._textSymbolChanged) {
    //         return Geometry.prototype.getSymbol.call(this);
    //     }
    //     return null;
    // }

    // setSymbol(symbol) {
    //     if (!symbol || symbol === this.options['symbol']) {
    //         this._textSymbolChanged = false;
    //         symbol = {};
    //     } else {
    //         this._textSymbolChanged = true;
    //     }
    //     const cooked = this._prepareSymbol(symbol);
    //     const s = this._getDefaultTextSymbol();
    //     extend(s, cooked);
    //     this._symbol = s;
    //     this._refresh();
    //     return this;
    // }

    onConfig(conf) {
        let needRepaint = false;
        for (const p in conf) {
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
        return super.onConfig(conf);
    }

    toJSON() {
        // symbol is overrided by boxSymbol/textSymbol
        const json = super.JSON.apply(this, arguments);
        delete json.symbol;
        return json;
    }

    _getTextSize(symbol) {
        return splitTextToRow(this._content, symbol)['size'];
    }

    _getInternalSymbol() {
        return this._symbol;
    }

    _getDefaultTextSymbol() {
        const s = {};
        extend(s, defaultSymbol);
        if (this.options['box']) {
            extend(s, defaultBoxSymbol);
        }
        return s;
    }

    onShapeChanged() {
        this._refresh();
        super.onShapeChanged();
    }
}

export default TextMarker;
