/**
*   @author }{yellow
*   @date 2017/4/18
*   @returns {Object} 合并后对象
*/

let merge = function () {
    var target = arguments[0] || {}, //第一个参数为target
        i = 1,
        len = arguments.length,
        options,
        name,//属性名
        deep = false;
    //deep copy
    if (typeof target === 'boolean') {
        deep = target;
        target = arguments[1] || {};
        i = 2;
    }
    //target 为string 或 能被deep copy类型
    if (typeof target !== 'object' && !_hobject.isFunction(target)) {
        target = {};
    }
    //只传一个arguments
    if (len === i) {
        target = this;
        --i;
    }
    //
    for (; i < len; i++) {
        if ((options = arguments[i]) != null) {
            //扩展base对象
            for (name in options) {
                src = target[name];
                copy = options[name];
                if (target === copy)
                    continue;
                if (deep && copy) {
                    var clone = src && _hobject.isArray(src) ? src : [];
                    target[name] = _hobject.merge(deep, clone, copy);
                } else if (copy !== undefined) {
                    target[name] = copy;
                }
            }
        }
    }
    return target;
}

export default merge;
