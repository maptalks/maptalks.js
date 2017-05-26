/**
 * reference http://www.css88.com/doc/underscore/docs/underscore.html
 * underScore 1.8
 */

let isObject=(obj)=>{
    var type = typeof obj;
    return type === 'function' || type === 'object' && !!obj
}

export default isObject;