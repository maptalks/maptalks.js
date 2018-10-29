import { isString, isNil } from './Util';

const DEFAULT_FONT = 'monospace';
/**
 * Returns CSS Font from a symbol with text styles.
 * @param  {Object} style symbol with text styles
 * @return {String}       CSS Font String
 * @memberOf StringUtil
 */
export function getFont(style) {
    //textStyle textWeight textSize textFaceName
    return [style['textStyle'] || 'normal',
        style['textWeight'] || 'normal',
        style['textSize'] + 'px ',
        style['textFaceName'] || DEFAULT_FONT].join(' ');

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
