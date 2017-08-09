import { extend } from 'core/util';
import { splitTextToRow, escapeSpecialChars } from 'core/util/strings';
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

    onAdd() {
        this._refresh();
    }

    _getTextSize(symbol) {
        return splitTextToRow(this._content, symbol)['size'];
    }

    _getInternalSymbol() {
        return this._symbol;
    }

    _getDefaultTextSymbol() {
        return extend({}, defaultSymbol);
    }

    _getDefaultBoxSymbol() {
        return extend({}, defaultBoxSymbol);
    }

    _getDefaultPadding() {
        return [12, 8];
    }
}

export default TextMarker;
