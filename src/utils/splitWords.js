/**
* @description 字符串去除空格
* @param {String} input 输入字符串
* @returns {String} 返回处理后的字符串
*/
const trim = (function (isNative) {
    return function (input) {
        return isNative ? isNative.apply(input) : ((input || '') + '').replace(/^\s+|\s+$/g, '');
    }
})(String.prototype.trim);

/**
 * @description  字符串内空格拆分为字符数组
 * @param {any} str
 * @returns {Array} 拆分后的数组
 */
const splitWords = function (str) {
    return trim(str).split(/\s+/);
}

module.exports = { splitWords, trim };