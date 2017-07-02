/**
 * 设计思路为.net framework 的 IDispose接口
 * 除此之外提供额外的属性：
 * -id
 * -handle
 * -create handle
 * -des
 * @class GLDispose
 */


class GLDispose {
    /**
     * 资源对象句柄
     */
    _handle;
    /**
     * 构建一个可被销毁的资源对象
     */
    constructor() {
        this._handle = this._createHandle();
    }
    /**
     * 资源销毁方法，执行完一段后，统一调用
     * must be implement be child class
     * @abstract
     */
    dispose() {

    }
    /**
     * 创建资源
     * @abstract
     */
    _createHandle() {

    }


}