/**
 * @author yellow date 2018/1/4
 */
const Record = require('./Record');
/** 
 * 
*/
const Encrypt = require('./Encrypt');
/**
 * @class
 */
class Recorder {

    constructor(glContext, storeInstance = true) {
        /**
         * @type {GLContext}
         */
        this._glContext = glContext;
        /**
         * @type {Array}
         */
        this._records = [];
        /**
         * 注册到全局实例中
         */
        storeInstance ? Recorder.instances[glContext.id] = this : null;
    }
    /**
     * 新增record
     * @param {Record} record 
     */
    increase(record) {
        this._records.push(record);
    }
    /**
     * convert to gl commands collection
     */
    toInstruction(programId) {
        const reocrds = this._records,
            len = reocrds.length,
            record = new Record('useProgram', null);
        record.exactIndexByValue(0, programId);
        return [record].concat(reocrds.splice(0, len));
    }
    /** 
     * convert to commands collection which not just webgl operation
     * makes recorder as a general logger.(such as htmlElement logger)
    */
    toOperation() {
        const len = this._records.length,
            list = this._records.splice(0, len);
        return list;
    }

}

Recorder.instances = {};

module.exports = Recorder;