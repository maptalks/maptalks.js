/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/ban-types */
import { DEFAULT_TEXT_SIZE } from '../Constants';
import { isString, isNil, isNumber } from './common';
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

export const EMPTY_STRING = '';

/**
 * Trim the string
 * @param str
 * @return 
 * @memberOf StringUtil
 */
export function trim(str: string) {
    return str.trim ? str.trim() : str.replace(/^\s+|\s+$/g, '');
}

export function replaceAll(str: string, key: string, value: string) {
    if (!str) {
        return str;
    }
    while (str.indexOf(key) > -1) {
        str = str.replace(key, value);
    }
    return str;
}

const specialPattern = /[\b\t\r\v\f]/igm;

/**
 * Escape special characters from string.
 * Including: \b \t \r \v \f
 * @param str string to escape
 * @return
 * @memberOf StringUtil
 */
export function escapeSpecialChars(str: string) {
    if (!isString(str)) {
        return str;
    }
    return str.replace(specialPattern, EMPTY_STRING);
}

/**
 * Split string by specified char
 * @param chr - char to split
 * @return
 * @memberOf StringUtil
 */
export function splitWords(chr: string) {
    return trim(chr).split(/\s+/);
}

const rulerCtx = typeof document !== 'undefined' ? document.createElement('canvas').getContext('2d') : null;

/**
 * Gets width of the text with a certain font.
 * More performant than stringLength.
 * @param text - text to measure
 * @param font - font of the text, same as the CSS font.
 * @return
 * @memberOf StringUtil
 */
export function stringWidth(text: string, font?: string): number {
    // @ts-expect-error
    if (stringWidth.node) {
        // @ts-expect-error
        return stringWidth.node(text, font);
    }
    rulerCtx.font = font;
    return rulerCtx.measureText(text).width;
}

// const fontHeight = {};

/**
 * Gets size in pixel of the text with a certain font.
 * @param text - text to measure
 * @param font - font of the text, same as the CSS font.
 * @return
 * @memberOf StringUtil
 */
export function stringLength(text: string, font: string, size?: number): Size {
    const w = stringWidth(text, font);
    // if (!font) {
    //     font = '_default_';
    // }
    // if (!fontHeight[font]) {
    //     fontHeight[font] = getFontHeight(font);
    // }
    // return new Size(w, fontHeight[font]);
    return new Size(w, size || DEFAULT_TEXT_SIZE);
}

// export function getFontHeight(font) {
//     //dom
//     const domRuler = getDomRuler('span');
//     if (font !== '_default_') {
//         domRuler.style.font = font;
//     }
//     domRuler.innerHTML = '秦';
//     const h = domRuler.clientHeight;
//     //if not removed, the canvas container on chrome will turn to unexpected blue background.
//     // Reason is unknown.
//     removeDomNode(domRuler);
//     return h;
// }

/**
 * Split text content by dom.
 * @param content - content to split
 * @param font - font of the text, same as the CSS font.
 * @return wrapWidth - width to wrap
 * @return {String[]}
 * @memberOf StringUtil
 */
export function splitContent(content: string, font: string, wrapWidth: number, textWidth: number) {
    if (!content || content.length === 0) {
        return [{ 'text': '', 'width': 0 }];
    }
    const width = isNil(textWidth) ? stringWidth(content, font) : textWidth;
    const chrWidth = width / content.length,
        minChrCount = Math.floor(wrapWidth / chrWidth / 2);
    if (chrWidth >= wrapWidth || minChrCount <= 0) {
        return [{ 'text': '', 'width': wrapWidth }];
    }
    if (width <= wrapWidth) return [{ 'text': content, 'width': width }];
    const result = [];
    let testStr = content.substring(0, minChrCount), prew = chrWidth * minChrCount;
    for (let i = minChrCount, l = content.length; i < l; i++) {
        const chr = content[i];
        const w = stringWidth(testStr + chr);
        if (w >= wrapWidth) {
            result.push({ 'text': testStr, 'width': prew });
            testStr = content.substring(i, minChrCount + i);
            i += (minChrCount - 1);
            prew = chrWidth * minChrCount;
        } else {
            testStr += chr;
            prew = w;
        }
        if (i >= l - 1) {
            prew = stringWidth(testStr);
            result.push({ 'text': testStr, 'width': prew });
        }
    }
    return result;
}

// const contentExpRe = /\{([\w_]+)\}/g;
// export const CONTENT_EXPRE = /{([^}.]+)}/;
// export const CONTENT_EXPRE = /{([\u0000-\u0019\u0021-\uFFFF]+)}/g;
// export const CONTENT_EXPRE = /\{([\w_]+)\}/g;
const TEMPLATE_CHARS = ['{', '}'];
/**
 * Replace variables wrapped by square brackets ({foo}) with actual values in props.
 * @example
 *     // will returns 'John is awesome'
 *     const actual = replaceVariable('{foo} is awesome', {'foo' : 'John'});
 * @param str      - string to replace
 * @param props    - variable value properties
 * @return
 * @memberOf StringUtil
 */
export function replaceVariable(str: string, props: Object) {
    if (!isString(str)) {
        return str;
    }

    function getValue(key) {
        if (!props) {
            return EMPTY_STRING;
        }
        const value = props[key];
        if (isNil(value)) {
            return EMPTY_STRING;
        } else if (Array.isArray(value)) {
            return value.join();
        }
        return value;
    }
    const [left, right] = TEMPLATE_CHARS;
    const keys = templateKeys(str);
    for (let i = 0, len = keys.length; i < len; i++) {
        const key = keys[i];
        const value = getValue(key);
        str = replaceAll(str, `${left}${key}${right}`, value);
    }
    return str;
}

function templateKeys(str) {
    str += EMPTY_STRING;
    const [left, right] = TEMPLATE_CHARS;
    const keys = [];
    let start = false;
    let key = EMPTY_STRING;
    for (let i = 0, len = str.length; i < len; i++) {
        const char = str[i];
        if (!start && char === left) {
            start = true;
        }
        if (char === left && start) {
            key = EMPTY_STRING;
        }
        if (start && (char !== left && char !== right)) {
            key += char;
        }
        if (char === right && key) {
            start = false;
            keys.push(key);
            key = EMPTY_STRING;
        }
    }
    return keys;
}

/**
 * Generate text descriptors according to symbols
 * @return {Object} text descriptor
 * @memberOf StringUtil
 */
export function describeText(textContent: any, symbol: any) {
    if (isNumber(textContent)) {
        textContent += '' as any;
    }
    textContent = textContent || '';
    const maxHeight = symbol['textMaxHeight'] || 0;
    const textDesc = splitTextToRow(textContent, symbol);
    if (maxHeight && maxHeight < textDesc.size.height) {
        textDesc.size.height = maxHeight;
    }
    return textDesc;
}

/**
 * Gets text's align point according to the horizontalAlignment and verticalAlignment
 * @param  {Size} size                  - text size
 * @param  {String} horizontalAlignment - horizontalAlignment: left/middle/right
 * @param  {String} verticalAlignment   - verticalAlignment: top/middle/bottom
 * @return {Point}
 * @memberOf StringUtil
 */
export function getAlignPoint(size: Size, horizontalAlignment: string, verticalAlignment: string): Point {
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

//export it for plugin develop
export const DEFAULT_FONT = 'sans-serif';
export const DEFAULT_TEXTSIZE = 14;

/**
 * Returns CSS Font from a symbol with text styles.
 * @param  {Object} style symbol with text styles
 * @return {String}       CSS Font String
 * @memberOf StringUtil
 */
export function getFont(style: any) {
    if (style['textFont']) {
        return style['textFont'];
    } else {
        let textSize = style.textSize;
        if (isNil(textSize)) {
            textSize = DEFAULT_TEXTSIZE;
        }
        return (style['textStyle'] && style['textStyle'] !== 'normal' ? style['textStyle'] + ' ' : '') +
            (style['textWeight'] && style['textWeight'] !== 'normal' ? style['textWeight'] + ' ' : '') +
            textSize + 'px ' +
            (style['textFaceName'] && formatFontFamily(style['textFaceName']) || DEFAULT_FONT);
    }
}

function formatFontFamily(font: string) {
    const fonts = font.split(',');
    for (let i = 0; i < fonts.length; i++) {
        if (fonts[i].trim) {
            fonts[i] = fonts[i].trim();
        }
        // quote font name with space
        // e.g. "Gill Sans Extrabold", sans-serif
        if (fonts[i].indexOf(' ') > 0 && fonts[i][0] !== '"' && fonts[i][0] !== '\'') {
            fonts[i] = '"' + fonts[i] + '"';
        }
    }
    return fonts.join(',');
}

/**
 * Split a text to multiple rows according to the style.
 * @param {String} text     - text to split
 * @param {Object} style    - text style
 * @return {Object[]} the object's structure: { rowNum: rowNum, textSize: textSize, rows: textRows, rawSize : rawSize }
 * @memberOf StringUtil
 */
export function splitTextToRow(text: string, style: Object) {
    const font = getFont(style),
        lineSpacing = style['textLineSpacing'] || 0,
        size = stringLength(text, font, style['textSize']),
        textWidth = size['width'],
        textHeight = size['height'],
        wrapChar = style['textWrapCharacter'] || '\n',
        textRows = [];
    let wrapWidth = style['textWrapWidth'];
    if (!wrapWidth || wrapWidth > textWidth) {
        wrapWidth = textWidth;
    }
    if (!isString(text)) {
        // @ts-expect-error
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

export function hashCode(s: string) {
    let hash = 0;
    const strlen = s && s.length || 0;
    if (!strlen) {
        return hash;
    }
    let c;
    for (let i = 0; i < strlen; i++) {
        c = s.charCodeAt(i);
        hash = ((hash << 5) - hash) + c;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
}
