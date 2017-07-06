/**
 * 设计思路为.net framework 的 IDispose接口
 * 除此之外提供额外的属性：
 * -id
 * -handle
 * -create handle
 * -des
 * @class Dispose
 */

import { stamp } from './stamp';

class Dispose {
    /**
     * 资源id
     */
    _id;
    /**
     * 资源对象句柄
     */
    _handle;
    /**
     * 构建一个可被销毁的资源对象
     */
    constructor() {
        this.id = stamp(this);
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

export default Dispose;