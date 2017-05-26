/**
 * reference http://www.css88.com/doc/underscore/docs/underscore.html
 * underScore 1.8
 */

let isString=(obj)=>{
    return toString.call(obj) === '[object String]';
}

export default isString;