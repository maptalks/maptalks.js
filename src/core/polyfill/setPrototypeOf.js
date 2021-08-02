// fixme: 直接使用是为了让polyfill提到文件最开始
export function _defaults(obj, defaults) {
    const keys = Object.getOwnPropertyNames(defaults);
    for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        const value = Object.getOwnPropertyDescriptor(defaults, key);
        if (value && value.configurable && obj[key] === undefined) {
            Object.defineProperty(obj, key, value);
        }
    }
    return obj;
}

function setProtoOf(obj, proto) {
    obj.__proto__ = proto;
    return obj;
}

if (!Object.setPrototypeOf) {
    // eslint-disable-next-line
    Object.prototype.setPrototypeOf = ({ __proto__: [] } instanceof Array ? setProtoOf : _defaults);
}
