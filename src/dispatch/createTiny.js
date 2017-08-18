/**
 * reference:
 * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext
 * 
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
const merge = require('./../utils/merge'),
    isString = require('./../utils/isString'),
    stamp = require('./../utils/stamp').stamp,
    Dispose = require('./../utils/Dispose'),
    Ticker = require('./../ticker/Ticker');
/**
 * tiny
 */
const InternalTiny = require('./tiny/InternallTiny').InternalTiny,
    OverrallTiny = require('./tiny/OverrallTiny').OverrallTiny;
/**
 * tiny_Enum
 */
const INTERNAL_TINY_ENUM = require('./tiny/InternallTiny').INTERNAL_TINY_ENUM,
    OVERRAL_TINY_ENUM = require('./tiny/OverrallTiny').OVERRAL_TINY_ENUM;
/**
 * Tiny Cache
 */
const Tinys = {};
/**
 * 
 * @param {GLProgram} glProgram 
 * @param {*} tiny 
 */
const enQueue = (glProgram, tiny, head = false) => {
    const id = glProgram.id;
    if (!Tinys[id])
        Tinys[id] = [];
    const queue = Tinys[id];
    queue.push(tiny);
}
/**
 * 
 * @param {*} id 
 */
const acquireQueue = (id) => {
    const queue = Tinys[id];
    Tinys[id] = [];
    return queue;
}

/**
 * 
 */
const ticker = new Ticker({
    autoStart: true
});
/**
 * tinys which needs to render
 */
const TICK_TINY_ENUM = {
    'drawArrays': true,
    'drawElements': true
}
/**
 * @type {enum}
 */
const TINY_ENUM = merge({}, OVERRAL_TINY_ENUM, INTERNAL_TINY_ENUM, TICK_TINY_ENUM);
/**
 * @func
 */
const createTiny = function (glContext,glProgram, name, ...rest) {
    //1.加入正序处理队列
    if (TINY_ENUM[name]) {
        const tiny = new InternalTiny(glProgram, name, ...rest);
        enQueue(glProgram, tiny);
    }
    //2.加入反序执行队列
    if (OVERRAL_TINY_ENUM[name]) {

    }
    //3.加入ticker
    if (TICK_TINY_ENUM[name]) {
        ticker.addOnce(function (deltaTime, data) {
            data.tickPrgoram.useProgram();
            const queue = data.queue;
            let tiny = queue.shift();
            while (!!tiny) {
                tiny.apply();
                tiny = queue.shift();
            }
        },glProgram.handle, {
            tickPrgoram: glProgram,
            queue: acquireQueue(glProgram.id)
        });
    }
}

module.exports = {
    TINY_ENUM,
    createTiny
}

