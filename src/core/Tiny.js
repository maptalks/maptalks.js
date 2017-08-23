/**
 * Tiny的作用与策略，详情请参见：
 * https://github.com/axmand/fusion.gl/wiki/Tiny
 * 
 * -
 * -
 * -
 * 
 */
const stamp = require('./../utils/stamp').stamp,
    ticker = require('./handle').ticker,
    INTERNAL_ENUM = require('./handle').INTERNAL_ENUM,
    OVERRAL_ENUM = require('./handle').OVERRAL_ENUM,
    TICKER_ENUM = require('./handle').TICKER_ENUM;

const GLPROGRAMS = require('./../utils/util').GLPROGRAMS,
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
        this._glPrgram = glProgram;
        const id = stamp(glProgram),
            tinyProgramCache = this._tinyProgramCache;
        if (!tinyProgramCache[id])
            tinyProgramCache[id] = [];
        this._programInternal = tinyProgramCache[id];
    }
    /**
     * 
     * @param {String} name 
     * @param {[]} rest 
     */
    push(name, ...rest) {
        const glProgram = this._glPrgram,
            overrall = this._overrall,
            programInternal = this._programInternal;
        programInternal === null ? overrall.push({ name, rest }) : programInternal.push({ name, rest });
        //如果是TICKER_ENUM,则需要加入ticker
        if (TICKER_ENUM[name]) {
            ticker.addOnce(
                function (deltaTime, bucket) {
                    bucket.glProgram.useProgram();
                    const gl = bucket.glProgram.gl;
                    const queue = bucket.overrall.concat(bucket.internal).reverse();
                    let task = queue.pop();
                    while(task!=null){
                        gl[task.name].apply(gl,task.rest);
                        task = queue.pop();
                    }
                },
                this,
                {
                    overrall: overrall.splice(0, overrall.length),//重复取
                    internal: programInternal.splice(0, programInternal.length),//清空取
                    glProgram: glProgram
                });
        }
        //

    }

}

module.exports = Tiny;