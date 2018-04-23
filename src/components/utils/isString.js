/**
 * reference:
 *  http://www.css88.com/doc/underscore/docs/underscore.html
 */

const isString = (str) => {
    return (typeof str == 'string') && str.constructor == String;
}

module.exports = isString;