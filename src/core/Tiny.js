/**
 * Tiny的作用与策略，详情请参见：
 * https://github.com/axmand/fusion.gl/wiki/Tiny
 * 
 */
const stamp = require('./../utils/stamp').stamp,
    isArray = require('./../utils/isArray'),
    ticker = require('./handle').ticker,
    Recorder = require('./Recorder'),
    INTERNAL_ENUM = require('./handle').INTERNAL_ENUM,
    OVERRAL_ENUM = require('./handle').OVERRAL_ENUM,
    TICKER_ENUM = require('./handle').TICKER_ENUM,
    GLPROGRAMS = require('./../utils/util').GLPROGRAMS,
    GLSHADERS = require('./../utils/util').GLSHADERS,
    GLTEXTURES = require('./../utils/util').GLTEXTURES;
/**
 * @class
 */
class Tiny {
    /**
     * 
     * @param {GLContext} glContext 
     */
    constructor(glContext) {
        /**
         * @type {GLContext}
         */
        this._glContext = glContext;
        /**
         * @type {WebGLRenderingContext}
         */
        this._gl = glContext.gl;
        /**
         * the operations which need's to be updated all without program context change
         */
        this._overrall = [];
        /**
         * the operations which need's to be updated in a tick combine with program context 
         */
        this._programInternal = null;
        /**
         * 
         */
        this._tinyProgramCache = {};
        /**
         * @type {GLProgram}
         */
        this._glPrgram = null;
    }
    /**
     * indicate wether it's need to be updated
     */
    get isEmpty() {
        return this._programInternal.length === 0;
    }
    /**
     * 
     * @param {GLProgram} glProgram
     * @returns {Array} [] 
     */
    switchPorgarm(glProgram) {
        //如果在切换program的时候，上一个program的代码未执行，则先执行
        if(!!this._glPrgram&&!!this._programInternal&&this._programInternal.length>0)
            this._tick(this._glPrgram, this._programInternal.splice(0, this._programInternal.length), this._overrall.splice(0, this._overrall.length));
        this._glPrgram = glProgram;
        const id = stamp(glProgram),
            tinyProgramCache = this._tinyProgramCache;
        //切换program
        if (!tinyProgramCache[id])
            tinyProgramCache[id] = [];
        this._programInternal = tinyProgramCache[id];
    }
    /**
     * 
     * @param {String} name 
     * @param {Array} rest 
     */
    push(name, ...rest) {
        const glPrograms = GLPROGRAMS,
            glProgram = this._glPrgram,
            gl = this._gl,
            overrall = this._overrall,
            programInternal = this._programInternal;
        if (!glProgram)
            gl[name].apply(gl, rest);
        else
            programInternal.push({ name: name, rest: this._exact(rest) });
        //如果是TICKER_ENUM,则需要加入ticker
        if (TICKER_ENUM[name])
            this._tick(glProgram, programInternal.splice(0, programInternal.length), overrall.splice(0, overrall.length));
    }
    /**
     * 
     * @param {GLProgram} glProgram 
     * @param {*} internal 
     * @param {*} overrall 
     */
    _tick(glProgram, internal, overrall) {
        //
        ticker.addOnce(function (deltaTime, bucket) {
            bucket.glProgram.useProgram();
            const gl = bucket.glProgram.gl;
            const queue = bucket.overrall.concat(bucket.internal).reverse();
            let task = queue.pop();
            while (task != null) {
                gl[task.name].apply(gl, task.rest);
                task = queue.pop();
            }
        }, this, 
        {
            overrall,
            internal,
            glProgram
        });
        //update RenderFrame
        ticker.update();
    }
    /**
     * 拷贝float32数组
     * @param {number} rest 
     */
    _exact(rest) {
        for (let i = 0, len = rest.length; i < len; i++) {
            let target = rest[i];
            if (target instanceof Float32Array) {
                rest[i] = new Float32Array(target);
            }
        }
        return rest;
    }

}
/**
 * Global instances of Tiny
 */
Tiny.instances = [];

module.exports = Tiny;