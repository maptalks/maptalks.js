import { isString, isNil } from './Util';

const DEFAULT_FONT = 'monospace';
/**
 * Returns CSS Font from a symbol with text styles.
 * @param  {Object} style symbol with text styles
 * @return {String}       CSS Font String
 * @memberOf StringUtil
 */
export function getSDFFont(textFaceName, textStyle, textWeight) {
    //textStyle textWeight textSize textFaceName
    return [textStyle || 'normal', textWeight || 'normal',
        '24px', //in GlyphRequestor.js, font size is fixed to 24
        textFaceName || DEFAULT_FONT].join(' ');

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
export function resolveText(str, props) {
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
