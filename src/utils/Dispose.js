/**
 * 设计思路为.net framework 的 IDispose接口
 * 除此之外提供额外的属性：
 * -id
 * -handle
 * -create handle
 * -dispose
 */

const stamp = require('./stamp').stamp;

/**
 * @class
 */
class Dispose {
    /**
     * 构建一个可被销毁的资源对象
     */
    constructor() {
        this._id = stamp(this);
    }
    /**
     * 资源销毁方法，执行完一段后，统一调用
     * must be implement be child class
     * @abstract
     */
    dispose() {
        throw new Error(`no implementation of function dispose`);
    }
    /**
     * 获取资源核心对象
     * @readonly
     * @member
     */
    get handle(){
        return this._handle;
    }
    /**
     * 创建资源
     * @abstract
     */
    _createHandle() {
        // arguments.callee.toString();
        throw new Error(`no implementation of function _createHandle`);
    }
}

module.exports = Dispose;