import { isString, isNil } from './common';
import { getDomRuler, removeDomNode } from './dom';
import Point from 'geo/Point';
import Size from 'geo/Size';

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

/**
 * Gets size in pixel of the text with a certain font.
 * @param {String} text - text to measure
 * @param {String} font - font of the text, same as the CSS font.
 * @return {Size}
 * @memberOf StringUtil
 */
export function stringLength(text, font) {
    if (stringLength.env) {
        return stringLength.env(text, font);
    } else {
        const ruler = getDomRuler('span');
        ruler.style.font = font;
        ruler.innerHTML = text;
        const result = new Size(ruler.clientWidth, ruler.clientHeight);
        //if not removed, the canvas container on chrome will turn to unexpected blue background.
        //Reason is unknown.
        removeDomNode(ruler);
        return result;
    }
}

/**
 * Split text content by dom.
 * @param {String} content - content to split
 * @param {String} font - font of the text, same as the CSS font.
 * @return {Number} wrapWidth - width to wrap
 * @return {String[]}
 * @memberOf StringUtil
 */
export function splitContent(content, font, wrapWidth) {
    const textSize = stringLength(content, font);
    if(textSize['width'] <= wrapWidth) return [content];
    const result = [];
    let ruler, ctx;
    if (!stringLength.env) {
        ruler = getDomRuler('canvas');
        ctx = ruler.getContext('2d');
        if(ctx) {
            ctx.font = font;
        } else {
            ruler = getDomRuler('span');
            ruler.style.font = font;
        }
    }
    let start = 0, step = 0, textWidth = 0, text = '', lastText = '';
    while(step < content.length) {
        if(textWidth < wrapWidth) {
            text += content[step];
            if (stringLength.env) {
                textWidth = stringLength.env(text, font);
            } else {
                if (ctx) {
                    textWidth = ctx.measureText(text).width;
                } else {
                    ruler.innerHTML = text;
                    textWidth = ruler.clientWidth;
                }
            }
            step ++;
        } else {
            step --;
            result.push(content.substring(start, step - 1));
            start = step - 1;
            textWidth = 0;
            text = '';
            lastText = content.substring(start);
            if(stringLength(lastText, font).width <= wrapWidth) {
                result.push(lastText);
                break;
            }
        }
    }
    if(ruler) removeDomNode(ruler);
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
    } else if (horizontalAlignment === 'middle') {
        alignW = -width / 2;
    } else if (horizontalAlignment === 'right') {
        alignW = 0;
    }
    if (verticalAlignment === 'top') {
        alignH = -height;
    } else if (verticalAlignment === 'middle') {
        alignH = -height / 2;
    } else if (verticalAlignment === 'bottom') {
        alignH = 0;
    }
    return new Point(alignW, alignH);
}

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
            (style['textFaceName'][0] === '"' ? style['textFaceName'] : '"' + style['textFaceName'] + '"');
    }
}

/**
 * Split a text to multiple rows according to the style.
 * @param {String} text     - text to split
 * @param {Object} style    - text style
 * @return {Object[]} the object's structure: {rowNum: rowNum, textSize: textSize, rows: textRows}
 * @memberOf StringUtil
 */
export function splitTextToRow(text, style) {
    const font = getFont(style),
        lineSpacing = style['textLineSpacing'] || 0,
        rawTextSize = stringLength(text, font),
        textWidth = rawTextSize['width'],
        textHeight = rawTextSize['height'],
        wrapChar = style['textWrapCharacter'],
        textRows = [];
    let wrapWidth = style['textWrapWidth'];
    if (!wrapWidth || wrapWidth > textWidth) {
        wrapWidth = textWidth;
    }
    if (!isString(text)) {
        text += '';
    }
    let actualWidth = 0,
        size;
    if (wrapChar && text.indexOf(wrapChar) >= 0) {
        const texts = text.split(wrapChar);
        let t, tSize, tWidth, contents;
        for (let i = 0, l = texts.length; i < l; i++) {
            t = texts[i];
            //TODO stringLength is expensive, should be reduced here.
            tSize = stringLength(t, font);
            tWidth = tSize['width'];
            if (tWidth > wrapWidth) {
                contents = splitContent(t, font, wrapWidth);
                for (let ii = 0, ll = contents.length; ii < ll; ii++) {
                    size = stringLength(contents[ii], font);
                    if (size['width'] > actualWidth) {
                        actualWidth = size['width'];
                    }
                    textRows.push({
                        'text': contents[ii],
                        'size': size
                    });
                }
            } else {
                if (tSize['width'] > actualWidth) {
                    actualWidth = tSize['width'];
                }
                textRows.push({
                    'text': t,
                    'size': tSize
                });
            }
        }
    } else if (textWidth > wrapWidth) {
        const splitted = splitContent(text, font, wrapWidth);
        for (let i = 0; i < splitted.length; i++) {
            size = stringLength(splitted[i], font);
            if (size['width'] > actualWidth) {
                actualWidth = size['width'];
            }
            textRows.push({
                'text': splitted[i],
                'size': size
            });
        }
    } else {
        if (rawTextSize['width'] > actualWidth) {
            actualWidth = rawTextSize['width'];
        }
        textRows.push({
            'text': text,
            'size': rawTextSize
        });
    }

    const rowNum = textRows.length;
    const textSize = new Size(actualWidth, textHeight * rowNum + lineSpacing * (rowNum - 1));
    return {
        'total': rowNum,
        'size': textSize,
        'rows': textRows,
        'rawSize': rawTextSize
    };
}
