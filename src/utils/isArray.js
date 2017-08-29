/**
 * reference:
 * http://www.css88.com/doc/underscore1.4.2/docs/underscore.html
 * 
 */

/**
 * @func
 */
const isArray = [].isArray|| function(arr) {
    return toString.call(arr) == '[object Array]';
};

module.exports = isArray;