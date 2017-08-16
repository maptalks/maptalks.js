/**
 * 提供数据转换方法
 * @author yellow date 2017/7/19
 */

const isNode = require('./isNode'),
    isString = require('./isString');

const _aTob = (function () {
    return isNode ? function () {
        return new Buffer(str, 'base64').toString('binary');
    } : function (str) {
        return atob(str);
    }
})();

/**
 * arraybuffer转换成字符串
 * @param {ArrayBuffer} arrayBuffer 
 */
const arrayBufferToString = (arrayBuffer) => {
    if (typeof TextDecoder !== 'undefined') {
        let textDecoder = new TextDecoder();
        return textDecoder.decode(arrayBuffer);
    } else {
        let bytes = new Uint8Array(arrayBuffer);
        let result = "";
        let length = bytes.length;
        for (let i = 0; i < length; i++) {
            result += String.fromCharCode(bytes[i]);
        }
        return result;
    }
}
/**
 * 
 */
const base64ToArrayBuffer = (base64Str) => {
    const splittedDataUri = base64Str.split(','),
        type = splittedDataUri[0].split(':')[1].split(';')[0],
        byteString = _aTob(splittedDataUri[1]),
        byteStringLength = byteString.length;
    let arrayBuffer = new ArrayBuffer(byteStringLength),
        uint8Array = new Uint8Array(arrayBuffer);
    for (let i = 0; i < byteStringLength; i++)
        uint8Array[i] = byteString.charCodeAt(i);
    return arrayBuffer;
}
/**
 * hump string convert to continuous sting 
 * depthFunc => DEPTH_FUNC
 * @param {String} continuousStr 
 */
const humpToContinuous = (humpString) => {
    if (isString(humpString))
        return humpString.replace(/([A-Z])/g, "-$1").toUpperCase();
    else
        return null;
}
/**
 * DEPTH_FUNC => depthFunc 
 * @param {String} continuousStr 
 */
const continuousToHump = (continuousStr) => {
    if (isString(continuousStr))
        return continuousStr.replace(/([A-Z])/g, (all, letter) => { return letter.toUpperCase(); });
    else
        return null;
}

module.exports = {
    arrayBufferToString,
    base64ToArrayBuffer,
    humpToContinuous,
    continuousToHump
};