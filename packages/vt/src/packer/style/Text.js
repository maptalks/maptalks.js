import { isString, isNil } from './Util';

const DEFAULT_FONT = 'Open Sans Regular';
/**
 * Returns CSS Font from a symbol with text styles.
 * @param  {Object} style symbol with text styles
 * @return {String}       CSS Font String
 * @memberOf StringUtil
 */
export function getSDFFont(textFaceName) {
    //textStyle textWeight textSize textFaceName
    return textFaceName || DEFAULT_FONT;

}

// 匹配{foo} 或 {foo|bar}
// 思路： 一个变量名foo后接着0个或多个形式为 |foo 的|与变量名的组合体
const contentExpRe = /\{[\w-]+(?:\|[\w-]+)*\}/g;
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
    return str.replace(contentExpRe, function (key) {
        if (!props) {
            return '';
        }
        key = key.substring(1, key.length - 1);
        if (key.indexOf('|') > 0) {
            const keys = key.split('|');
            for (let i = 0; i < keys.length; i++) {
                const value = props[keys[i]];
                if (!isNil(value)) {
                    return value;
                }
            }
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

export function resolveVarNames(str) {
    return str.match(contentExpRe);
}

// 从expression中获取属性名
export function resolveExpVarNames(out, arr) {
    if (arr.length === 2 && arr[0] === 'get') {
        out.push(arr[1]);
        return;
    }
    for (let i = 0; i < arr.length; i++) {
        // https://docs.mapbox.com/mapbox-gl-js/style-spec/expressions/#get
        if (arr[i].length === 2 && arr[i][0] === 'get') {
            out.push(arr[i][1]);
        } else if (Array.isArray(arr[i])) {
            resolveExpVarNames(out, arr[i]);
        }
    }
}
