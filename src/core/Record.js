/**
 * 操作记单元
 * @author yellow date 2018/1/4
 */
const isString = require('./../utils/isString'), 
    isArray = require('./../utils/isArray'),
    stamp = require('./../utils/stamp');
/**
 * @class
 */
class Record {
    /**
     * 
     * @param {*} opName 
     * @param {*} rest 
     */
    constructor(opName, ...rest) {
        /**
         * webgl operation name
         */
        this._opName = opName;
        /**
         * args
         */
        this._rest = this._exact(rest);
        /**
         * use prfix instead of value in args
         * @type {Int}
         */
        this._ptMapIndex = {};
        /**
         * indicate this record needs to return value
         * @type {String}
         */
        this._returnId = null;
    }
    /**
     * operation name
     */
    get opName() {
        return this._opName;
    }
    /**
     * arguments of record
     */
    get args() {
        return this._rest;
    }
    /**
     * @returns {String}
     */
    get returnId() {
        return this._returnId;
    }
    /**
     * @returns {String}
     */
    get returanIdPrefix() {
        return this._returanIdPrefix;
    }
    /**
     * @type {Int}
     */
    get ptMapIndex() {
        return this._ptMapIndex;
    }
    /**
     * }{debug arraybuffer.set much more faster than copy
     * 
     * @private
     * @param {Array} rest 
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
     * 修改某处指令的值
     * @param {int} ptIndex 
     * @param {String} ptName always represents shaderId/porgramId/
     */
    exactIndexByValue(ptIndex, ptName) {
        const arr = ptName.split('_');
        //map to _ptIndex
        this._ptMapIndex[ptIndex] = {
            prefix: arr[0],
            index: ptIndex,
            id: ptName
        };
        //replace value
        this._rest[ptIndex] = ptName;
    }
    /**
     * 
     * @param {Array} ptIndex 
     */
    exactIndexByObject(ptIndexs) {
        for (let i = 0, len = ptIndexs.length; i < len; i++) {
            const ptIndex = ptIndexs[i],
                ptName = stamp(this._rest[ptIndex]);
            ptName&&ptName.indexOf('_')!==-1?this.exactIndexByValue(ptIndex, ptName):null;
        }
    }
    /**
     * 
     * @param {Array} refs 
     */
    replace(refs) {
        for (const key in refs)
            this._rest[key] = refs[key];
    }
    /**
     * 设置返回的id
     */
    setReturnId(v,needToAnalysis = true) {
        this._returnId = v;
        needToAnalysis?this._analysisReturnId(v):null;
    }
    /**
     * 
     * @param {String} v 
     */
    _analysisReturnId(v) {
        const val = isString(v)?v:stamp(v);
        const arr = val.split('_');
        //map to _ptIndex
        this._returanIdPrefix = arr[0];
    }

}

module.exports = Record;