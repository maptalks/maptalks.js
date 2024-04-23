import { extend, hasOwn } from '../core/util';
import { splitTextToRow, escapeSpecialChars } from '../core/util/strings';
import { TextSymbol, VectorMarkerSymbol } from '../symbol';
import Marker, { MarkerOptionsType } from './Marker';

const defaultSymbol: TextSymbol = {
    'textFaceName': 'monospace',
    'textSize': 12,
    'textLineSpacing': 8,
    'textWrapCharacter': '\n',
    'textHorizontalAlignment': 'middle', //left middle right
    'textVerticalAlignment': 'middle' //top middle bottom
};

const defaultBoxSymbol: VectorMarkerSymbol = {
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
    public _content: string
    public _refreshing: boolean
    _refresh?(): void
    getTextStyle?(): any
    setTextStyle?(tyle?: any): any
    setTextSymbol?(style?: any): any
    setBoxStyle?(style?: any): any
    getBoxStyle?(): any
    setBoxSymbol?(style?: any): any
    /**
     * 获取标签的文本内容
     * @english
     * Get text content of the label
     * @returns {String}
     */
    getContent(): string {
        return this._content;
    }

    /**
     * 给标签设置文本内容
     * @english
     * Set a new text content to the label
     * @return {Label} this
     * @fires Label#contentchange
     */
    setContent(content: string) {
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

    onAdd(): void {
        this._refresh();
    }

    toJSON(): { [key: string]: any } {
        const json = super.toJSON();
        delete json['symbol'];
        return json;
    }

    setSymbol(symbol: any) {
        if (this._refreshing || !symbol) {
            return super.setSymbol(symbol);
        }
        const s = this._parseSymbol(symbol);
        if (this.setTextStyle) {
            const style = this.getTextStyle() || {};
            style.symbol = s[0];
            this.setTextStyle(style);
        } else if (this.setTextSymbol) {
            this.setTextSymbol(s[0]);
        }
        if (this.setBoxStyle) {
            const style = this.getBoxStyle() || {};
            style.symbol = s[1];
            this.setBoxStyle(style);
        } else if (this.setBoxSymbol) {
            this.setBoxSymbol(s[1]);
        }
        return this;
    }

    _parseSymbol(symbol: any): any {
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

    _getTextSize(symbol: any): any {
        return splitTextToRow(this._content, symbol)['size'];
    }

    _getInternalSymbol(): any {
        return this._symbol;
    }

    _getDefaultTextSymbol(): TextSymbol {
        return extend({}, defaultSymbol);
    }

    _getDefaultBoxSymbol(): VectorMarkerSymbol {
        return extend({}, defaultBoxSymbol);
    }

    _getDefaultPadding(): [number, number] {
        return [12, 8];
    }
}

export default TextMarker;

export type TextMarkerOptionsType = MarkerOptionsType;
