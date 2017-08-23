/**
 * Tiny的作用与策略，详情请参见：
 * https://github.com/axmand/fusion.gl/wiki/Tiny
 * 
 * -
 */
const stamp = require('./../utils/stamp').stamp,
    ticker = require('./handle').ticker,
    INTERNAL_ENUM = require('./handle').INTERNAL_ENUM,
    OVERRAL_ENUM = require('./handle').OVERRAL_ENUM,
    TICKER_ENUM = require('./handle').TICKER_ENUM;

    const popAll

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
    }
    /**
     * indicate wether it's need to be updated
     */
    get isEmpty() {
        return this._programInternal.length === 0;
    }
    /**
     * useProgram
     * @returns {Array} []
     */
    switchPorgarm(glProgram) {
        const id = stamp(glProgram),
            tinyProgramCache = this._tinyProgramCache;
        if (tinyProgramCache[id])
            tinyProgramCache[id] = [];
        this._programInternal = tinyProgramCache[id];
    }
    /**
     * 
     */
    push(name, ...rest) {
        const programInternal = this._programInternal;
        if (programInternal === null) {
            this._overrall.push({
                name,
                ...rest
            });
        } else {
            programInternal.push({
                name,
                ...rest
            });
        }
        //如果是TICKER_ENUM,则需要加入ticker
        if(TICKER_ENUM[name]){
            ticker.addOnce(function(detialTime,data){
                alert(data);
            },this,{
                overrall:this._overrall.slice(0,this._overrall.length-1),//重复取
                internal:programInternal.splice(0,programInternal.length)//清空取
            })
        }
        //
    }

}

module.exports = Tiny;