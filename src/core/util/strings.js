import { isString, isNil } from './common';
import { getDomRuler, removeDomNode } from './dom';
import Point from '../../geo/Point';
import Size from '../../geo/Size';

/**
 * @classdesc
 * Utilities methods for Strings used internally. It is static and should not be initiated.
 * @class
 * @static
 * @category core
 * @name StringUtil
 */

/**
 * Trim the string
 * @param {String} str
 * @return {String}
 * @memberOf StringUtil
 */
export function trim(str) {
    return str.trim ? str.trim() : str.replace(/^\s+|\s+$/g, '');
}

const specialPattern = /[\b\t\r\v\f]/igm;

/**
 * Escape special characters from string.
 * Including: \b \t \r \v \f
 * @param  {String} str string to escape
 * @return {String}
 * @memberOf StringUtil
 */
export function escapeSpecialChars(str) {
    if (!isString(str)) {
        return str;
    }
    return str.replace(specialPattern, '');
}

/**
 * Split string by specified char
 * @param {String} chr - char to split
 * @return {String[]}
 * @memberOf StringUtil
 */
export function splitWords(chr) {
    return trim(chr).split(/\s+/);
}

const rulerCtx = typeof document !== 'undefined' ? document.createElement('canvas').getContext('2d') : null;

/**
 * Gets width of the text with a certain font.
 * More performant than stringLength.
 * @param {String} text - text to measure
 * @param {String} font - font of the text, same as the CSS font.
 * @return {Number}
 * @memberOf StringUtil
 */
export function stringWidth(text, font) {
    if (stringWidth.node) {
        return stringWidth.node(text, font);
    }
    rulerCtx.font = font;
    return rulerCtx.measureText(text).width;
}

const fontHeight = {};

/**
 * Gets size in pixel of the text with a certain font.
 * @param {String} text - text to measure
 * @param {String} font - font of the text, same as the CSS font.
 * @return {Size}
 * @memberOf StringUtil
 */
export function stringLength(text, font) {
    if (stringLength.node) {
        return stringLength.node(text, font);
    } else {
        const w = stringWidth(text, font);
        if (!font) {
            font = '_default_';
        }
        if (!fontHeight[font]) {
            fontHeight[font] = getFontHeight(font);
        }
        return new Size(w, fontHeight[font]);
    }
}

export function getFontHeight(font) {
    //dom
    const domRuler = getDomRuler();
    if (font !== '_default_') {
        domRuler.style.font = font;
    }
    domRuler.innerHTML = '秦';
    const h = domRuler.clientHeight;
    //if not removed, the canvas container on chrome will turn to unexpected blue background.
    // Reason is unknown.
    removeDomNode(domRuler);
    return h;
}

/**
 * Split text content by dom.
 * @param {String} content - content to split
 * @param {String} font - font of the text, same as the CSS font.
 * @return {Number} wrapWidth - width to wrap
 * @return {String[]}
 * @memberOf StringUtil
 */
export function splitContent(content, font, wrapWidth, textWidth) {
    if (!content || content.length === 0) {
        return [{ 'text' : '', 'width' : 0 }];
    }
    const width = isNil(textWidth) ? stringWidth(content, font) : textWidth;
    const chrWidth = width / content.length,
        minChrCount = Math.floor(wrapWidth / chrWidth / 2);
    if (chrWidth >= wrapWidth || minChrCount <= 0) {
        return [{ 'text' : '', 'width' : wrapWidth }];
    }
    if (width <= wrapWidth) return [{ 'text' : content, 'width' : width }];
    const result = [];
    let testStr = content.substring(0, minChrCount), prew = chrWidth * minChrCount;
    for (let i = minChrCount, l = content.length; i < l; i++) {
        const chr = content[i];
        const w = stringWidth(testStr + chr);
        if (w >= wrapWidth) {
            result.push({ 'text' : testStr, 'width' : prew });
            testStr = content.substring(i, minChrCount + i);
            i += (minChrCount - 1);
            prew = chrWidth * minChrCount;
        } else {
            testStr += chr;
            prew = w;
        }
        if (i >= l - 1) {
            prew = stringWidth(testStr);
            result.push({ 'text' : testStr, 'width' : prew });
        }
    }
    return result;
}

const contentExpRe = /\{([\w_]+)\}/g;

/**
 * Replace variables wrapped by square brackets ({foo}) with actual values in props.
 * @example
 *     // will returns 'John is awesome'
 *     const actual = replaceVariable('{foo} is awesome', {'foo' : 'John'});
 * @param {String} str      - string to replace
 * @param {Object} props    - variable value properties
 * @return {String}
 * @memberOf StringUtil
 */
export function replaceVariable(str, props) {
    if (!isString(str)) {
        return str;
    }
    return str.replace(contentExpRe, function (str, key) {
        if (!props) {
            return '';
        }
        const value = props[key];
        if (isNil(value)) {
            return '';
        } else if (Array.isArray(value)) {
            return value.join();
        }
        return value;
    });
}

/**
 * Gets text's align point according to the horizontalAlignment and verticalAlignment
 * @param  {Size} size                  - text size
 * @param  {String} horizontalAlignment - horizontalAlignment: left/middle/right
 * @param  {String} verticalAlignment   - verticalAlignment: top/middle/bottom
 * @return {Point}
 * @memberOf StringUtil
 */
export function getAlignPoint(size, horizontalAlignment, verticalAlignment) {
    const width = size['width'],
        height = size['height'];
    let alignW, alignH;
    if (horizontalAlignment === 'left') {
        alignW = -width;
    } else if (horizontalAlignment === 'right') {
        alignW = 0;
    } else {
        alignW = -width / 2;
    }
    if (verticalAlignment === 'top') {
        alignH = -height;
    } else if (verticalAlignment === 'bottom') {
        alignH = 0;
    } else {
        alignH = -height / 2;
    }
    return new Point(alignW, alignH);
}

const DEFAULT_FONT = 'monospace';

/**
 * Returns CSS Font from a symbol with text styles.
 * @param  {Object} style symbol with text styles
 * @return {String}       CSS Font String
 * @memberOf StringUtil
 */
export function getFont(style) {
    if (style['textFont']) {
        return style['textFont'];
    } else {
        return (style['textStyle'] && style['textStyle'] !== 'normal' ? style['textStyle'] + ' ' : '') +
            (style['textWeight'] && style['textWeight'] !== 'normal' ? style['textWeight'] + ' ' : '') +
            style['textSize'] + 'px ' +
            (!style['textFaceName'] ? DEFAULT_FONT : (style['textFaceName'][0] === '"' ? style['textFaceName'] : '"' + style['textFaceName'] + '"'));
    }
}

/**
 * Split a text to multiple rows according to the style.
 * @param {String} text     - text to split
 * @param {Object} style    - text style
 * @return {Object[]} the object's structure: { rowNum: rowNum, textSize: textSize, rows: textRows, rawSize : rawSize }
 * @memberOf StringUtil
 */
export function splitTextToRow(text, style) {
    const font = getFont(style),
        lineSpacing = style['textLineSpacing'] || 0,
        size = stringLength(text, font),
        textWidth = size['width'],
        textHeight = size['height'],
        wrapChar = style['textWrapCharacter'],
        textRows = [];
    let wrapWidth = style['textWrapWidth'];
    if (!wrapWidth || wrapWidth > textWidth) {
        wrapWidth = textWidth;
    }
    if (!isString(text)) {
        text += '';
    }
    let actualWidth = 0;
    if (wrapChar && text.indexOf(wrapChar) >= 0) {
        const texts = text.split(wrapChar);
        for (let i = 0, l = texts.length; i < l; i++) {
            const t = texts[i];
            const tWidth = stringWidth(t, font);
            if (tWidth > wrapWidth) {
                const contents = splitContent(t, font, wrapWidth, tWidth);
                for (let ii = 0, ll = contents.length; ii < ll; ii++) {
                    const w = contents[ii].width;
                    if (w > actualWidth) {
                        actualWidth = w;
                    }
                    textRows.push({
                        'text': contents[ii].text,
                        'size': new Size(w, textHeight)
                    });
                }
            } else {
                if (tWidth > actualWidth) {
                    actualWidth = tWidth;
                }
                textRows.push({
                    'text': t,
                    'size': new Size(tWidth, textHeight)
                });
            }
        }
    } else if (textWidth > wrapWidth) {
        const contents = splitContent(text, font, wrapWidth, textWidth);
        for (let i = 0; i < contents.length; i++) {
            const w = contents[i].width;
            if (w > actualWidth) {
                actualWidth = w;
            }
            textRows.push({
                'text': contents[i].text,
                'size': new Size(w, textHeight)
            });
        }
    } else {
        if (textWidth > actualWidth) {
            actualWidth = textWidth;
        }
        textRows.push({
            'text': text,
            'size': size
        });
    }

    const rowNum = textRows.length;
    const textSize = new Size(actualWidth, textHeight * rowNum + lineSpacing * (rowNum - 1));
    return {
        'total': rowNum,
        'size': textSize,
        'rows': textRows,
        'rawSize': size
    };
}
