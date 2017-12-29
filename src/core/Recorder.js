const Dispose = require('./../utils/Dispose');

/**
 * @class
 * @author yellow date 2017/12/12
 * 操作记录对象，提供
 * -记录操作名称
 * -记录操作相关参数
 */
export default class Record extends Dispose {

    constructor(opName, ...rest) {
        super();
        this._opName = opName;
        this._rest = this._exact(rest)
    }
    /**
     * @private
     * @param {*} rest 
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
    /**
     * 修改索引对饮参数值，Player执行Record时自动替换
     * @private
     * @param {*} ptIndex 
     * @param {*} ptName 
     */
    _exactIndex(ptIndex, ptName) {
        this._rest[ptIndex] = ptName;
    }

}

/**
 * webgl operaion records
 * 与Record的区别是
 * 记录操作时传入的指针
 */
class GLRecord extends Record {

    constructor(opName, ...rest) {
        super(opName, ...rest);
    }

    setPt(ptIndex,ptName){
        //修改Record指针
        ptName && ptIndex !== -1 ? this._exactIndex(ptIndex, ptName) : null;
    }


}

/**
 * 每个glProgram对应一个Recoder对象
 * @class Recorder
 */
class Recorder {
    /**
     * 
     * @param {Oject} [options]
     * @param {boolean} [options.forceUpdate] 指定是否record强制应用本次应用 
     */
    constructor(options = {}) {
        /**
         * @type {boolean}
         */
        const { forceUpdate } = options;
        /**
         * 
         */
        this._lastQueue = [];
        /**
         * dom操作
         * @type {Array}
         */
        this._domQueue = [];
        /**
         * gl操作
         * @type {Array} _queue
         */
        this._glQueue = [];
    }
    /**
     * 添加记录到记录器
     * @param {GLRecord|DomRecord} record 
     */
    increase(record) {
        if (record instanceof GLRecord) {
            this._glQueue.push(record);
        } else if (record instanceof DomRecord) {
            this._domQueue.push(record);
        }
    }
    /**
     * 
     * @param {GLProgram} glProgram 
     */
    apply(glProgram) {
        //1.deep copy the target operation queue
        let [...cp] = this._glQueue.reverse();
        this._lastQueue = cp;
        //2.清理queue
        this._glQueue = [];
        //3.应用
        this.reapply(glProgram);
    }
    /**
     * 应用对象
     * @param {GLProgram} glProgram 
     */
    reapply(glProgram) {
        glProgram.useProgram();
        const len = this._lastQueue.length,
            gl = glProgram.gl;
        let task = this._lastQueue.pop();
        while (task != null) {
            gl[task.name].apply(gl, task.rest);
            task.pop();
        }
    }

}

module.exports = {
    GLRecord,
    Recorder
};