/**
 * 总线进行调度时，生产系列的block
 * tiny分为三种：
 * 
 * 
 * -1.非全局影响式，例如 bufferData
 * -2.全局影响式，例如 gl.Clear
 * -3.全局转换容器式，例如 readPixel（可合并到2）
 * 
 * 
 * 流程：
 * 1、当glContext进行赋值等操作的时候，根据不同的操作，讲非全局影响操作暂存插入执行区
 * 2、当操作为 drawBuffer,drawElement和draw的时候，将队列包装成task插入raf待处理
 * 3、待全部glProgram都执行完毕后，写入frameBuffer
 * 4、最后统一调度全局影响操作
 * 5、复制结果图层到实际可视区
 * 
 */

/**
 * @func
 */
const createTiny = function (name,glProgram,parameter) {

}

module.exports = createTiny;

