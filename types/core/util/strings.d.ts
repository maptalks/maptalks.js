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
export declare function trim(str: string): string;
/**
 * Escape special characters from string.
 * Including: \b \t \r \v \f
 * @param  {String} str string to escape
 * @return {String}
 * @memberOf StringUtil
 */
export declare function escapeSpecialChars(str: string): string;
/**
 * Split string by specified char
 * @param {String} chr - char to split
 * @return {String[]}
 * @memberOf StringUtil
 */
export declare function splitWords(chr: string): string[];
/**
 * Gets width of the text with a certain font.
 * More performant than stringLength.
 * @param {String} text - text to measure
 * @param {String} font - font of the text, same as the CSS font.
 * @return {Number}
 * @memberOf StringUtil
 */
export declare function stringWidth(text: string, font?: any): any;
/**
 * Gets size in pixel of the text with a certain font.
 * @param {String} text - text to measure
 * @param {String} font - font of the text, same as the CSS font.
 * @return {Size}
 * @memberOf StringUtil
 */
export declare function stringLength(text: string, font: any, size?: any): Size;
/**
 * Split text content by dom.
 * @param {String} content - content to split
 * @param {String} font - font of the text, same as the CSS font.
 * @return {Number} wrapWidth - width to wrap
 * @return {String[]}
 * @memberOf StringUtil
 */
export declare function splitContent(content: string, font: any, wrapWidth: any, textWidth: any): any[];
export declare const CONTENT_EXPRE: RegExp;
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
export declare function replaceVariable(str: string, props: any): string;
/**
 * Generate text descriptors according to symbols
 * @return {Object} text descriptor
 * @memberOf StringUtil
 */
export declare function describeText(textContent: any, symbol: any): {
    total: number;
    size: Size;
    rows: any[];
    rawSize: Size;
};
/**
 * Gets text's align point according to the horizontalAlignment and verticalAlignment
 * @param  {Size} size                  - text size
 * @param  {String} horizontalAlignment - horizontalAlignment: left/middle/right
 * @param  {String} verticalAlignment   - verticalAlignment: top/middle/bottom
 * @return {Point}
 * @memberOf StringUtil
 */
export declare function getAlignPoint(size: any, horizontalAlignment: any, verticalAlignment: any): Point;
/**
 * Returns CSS Font from a symbol with text styles.
 * @param  {Object} style symbol with text styles
 * @return {String}       CSS Font String
 * @memberOf StringUtil
 */
export declare function getFont(style: any): any;
/**
 * Split a text to multiple rows according to the style.
 * @param {String} text     - text to split
 * @param {Object} style    - text style
 * @return {Object[]} the object's structure: { rowNum: rowNum, textSize: textSize, rows: textRows, rawSize : rawSize }
 * @memberOf StringUtil
 */
export declare function splitTextToRow(text: string, style: any): {
    total: number;
    size: Size;
    rows: any[];
    rawSize: Size;
};
export declare function hashCode(s: any): number;
