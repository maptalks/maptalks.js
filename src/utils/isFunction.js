/**
 * reference:
 *  http://www.css88.com/doc/underscore/docs/underscore.html
 */

const isFunction = (func) => {
    return typeof func == 'function';
    // return toString.call(obj) === '[object Function]';
}

module.exports = isFunction;