import { extend, hasOwn } from '../core/util';
import { splitTextToRow, escapeSpecialChars } from '../core/util/strings';
import TextEditable from './editor/TextEditable';
import { GeometyOptionsType } from './Geometry';
import Marker from './Marker';

const defaultSymbol = {
    'textFaceName': 'monospace',
    'textSize': 12,
    'textLineSpacing': 8,
    'textWrapCharacter': '\n',
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
export type TextMarkerOptionsType = GeometyOptionsType;

/**
 * @classdesc
 * Base class for  the Text marker classes, a marker which has text and background box. <br>
 * It is abstract and not intended to be instantiated.
 * @category geometry
 * @abstract
 * @extends Marker
 */
class TextMarker extends TextEditable(Marker) {
    _content: string;
    _refreshing: boolean;
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
    setContent(content: string) {
        const old = this._content;
        this._content = escapeSpecialChars(content);
        //@ts-ignore
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
        //@ts-ignore
        this._refresh();
    }

    toJSON() {
        const json = super.toJSON();
        delete json['symbol'];
        return json;
    }

    setSymbol(symbol) {
        if (this._refreshing || !symbol) {
            return super.setSymbol(symbol);
        }
        const s = this._parseSymbol(symbol);
        //@ts-ignore
        if (this.setTextStyle) {
            //@ts-ignore
            const style = this.getTextStyle() || {};
            style.symbol = s[0];
            //@ts-ignore
            this.setTextStyle(style);
            //@ts-ignore
        } else if (this.setTextSymbol) {
            //@ts-ignore
            this.setTextSymbol(s[0]);
        }
        //@ts-ignore
        if (this.setBoxStyle) {
            //@ts-ignore
            const style = this.getBoxStyle() || {};
            style.symbol = s[1];
            //@ts-ignore
            this.setBoxStyle(style);
            //@ts-ignore
        } else if (this.setBoxSymbol) {
            //@ts-ignore
            this.setBoxSymbol(s[1]);
        }
        return this;
    }

    _parseSymbol(symbol) {
        const t = {};
        const b = {};
        for (const p in symbol) {
            if (hasOwn(symbol, p)) {
                if (p.indexOf('text') === 0) {
                    t[p] = symbol[p];
                } else {
                    b[p] = symbol[p];
                }
            }
        }
        return [t, b];
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
