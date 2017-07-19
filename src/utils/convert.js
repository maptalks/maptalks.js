/**
 * 提供数据转换方法
 * @author yellow date 2017/7/19
 */

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

export {
    arrayBufferToString
};