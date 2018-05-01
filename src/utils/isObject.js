/**
 * reference:
 * http://www.css88.com/doc/underscore/docs/underscore.html
 * 
 */

const isObject = (obj) => {
    const type = typeof obj;
    return type === 'function' || type === 'object' && !!obj
}

module.exports = isObject;