/**
 * String utilities  used internally
 * @class
 * @category core
 * @protected
 */

import { isObject, isString, isNil } from './common';
import { _getDomRuler, removeDomNode } from './dom';
import Point from 'geo/Point';
import Size from 'geo/Size';

/**
 * Trim the string
 * @param {String} str
 * @return {String}
 */
export function trim(str) {
    return str.trim ? str.trim() : str.replace(/^\s+|\s+$/g, '');
}

/**
 * Split string by specified char
 * @param {String} chr - char to split
 * @return {String[]}
 */
export function splitWords(chr) {
    return trim(chr).split(/\s+/);
}

/**
 * Gets size in pixel of the text with a certain font.
 * @param {String} text - text to measure
 * @param {String} font - font of the text, same as the CSS font.
 * @return {Size}
 */
export function stringLength(text, font) {
    var ruler = _getDomRuler('span');
    ruler.style.font = font;
    ruler.innerHTML = text;
    var result = new Size(ruler.clientWidth, ruler.clientHeight);
    //if not removed, the canvas container on chrome will turn to unexpected blue background.
    //Reason is unknown.
    removeDomNode(ruler);
    return result;
}

/**
 * Split content by wrapLength 根据长度分割文本
 * @param {String} content      - text to split
 * @param {Number} textLength   - width of the text, provided to prevent expensive repeated text measuring
 * @param {Number} wrapWidth    - width to wrap
 * @return {String[]}
 */
export function splitContent(content, textLength, wrapWidth) {
    var rowNum = Math.ceil(textLength / wrapWidth);
    var avgLen = textLength / content.length;
    var approxLen = Math.floor(wrapWidth / avgLen);
    var result = [];
    for (var i = 0; i < rowNum; i++) {
        if (i < rowNum - 1) {
            result.push(content.substring(i * approxLen, (i + 1) * approxLen));
        } else {
            result.push(content.substring(i * approxLen));
        }
    }
    return result;
}

const contentExpRe = /\{([\w_]+)\}/g;

/**
 * Replace variables wrapped by square brackets ({foo}) with actual values in props.
 * @example
 *     // will returns 'John is awesome'
 *     var actual = replaceVariable('{foo} is awesome', {'foo' : 'John'});
 * @param {String} str      - string to replace
 * @param {Object} props    - variable value properties
 * @return {String}
 */
export function replaceVariable(str, props) {
    if (!isObject(props) || !isString(str)) {
        return str;
    }
    return str.replace(contentExpRe, function (str, key) {
        var value = props[key];
        if (isNil(value)) {
            return str;
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
 */
export function getAlignPoint(size, horizontalAlignment, verticalAlignment) {
    var width = size['width'],
        height = size['height'];
    var alignW, alignH;
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
