/**
 * reference http://www.css88.com/doc/underscore/docs/underscore.html
 * underScore 1.8
 */

let isString = (str) => {
    //return toString.call(obj) === '[object String]';
    return (typeof str == 'string') && str.constructor == String;
}

export default isString;