/**
 * 
 * assign kiwi.gl object to be an unique id in the global
 * @author yellow 2017/5/26
 * 
 */

import isObject from './../utils/isObject';
import isString from './../utils/isString';

const prefix = '_kiwi_',
    prefixId = prefix + 'id_';

let i = 1;

let getId = () => {
    return prefixId + (i++);
};

/**
 * get the unique id
 * @method stamp
 * @param {Object} obj 
 * @return {String} error if returned 'null'
 */
let stamp = (obj) => {
    if (isObject(obj)) {
        obj._kiwi_id_ = obj._kiwi_id_ || getId();
        return obj._kiwi_id_
    }
    else if (isString(obj)) {
        return prefix + obj;
    }else
        return null;
};

export { stamp, prefix, getId }