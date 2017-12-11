/**
 * 状态记录器
 * @author yellow date 2017/11/10
 * @description 提供状态的搜集，上一状态存储，下一状态应用
 */

 /**
  * 每个glProgram对应一个Recoder对象
  * @class Recorder
  */
 class Recorder{
    /**
     * 
     * @param {Oject} [options]
     * @param {boolean} [options.forceUpdate] 指定是否record强制应用本次应用 
     */
    constructor(options = {}){
        /**
         * @type {boolean}
         */
        const {forceUpdate} = options;
        /**
         * 
         */
        this._lastQueue=[];
        /**
         * 操作集
         * @param {Array} _queue
         */
        this._queue = [];
    }
    /**
     * 组织执行操作的队列
     * @method increase
     * @param {*} name 
     * @param {*} rest 
     */
    increase(name,...rest){
        this._queue.push({
            name:name,
            rest:this._exact(rest)
        });
    }
    /**
     * 深拷贝数组对象，防止原应用处理数组引用导致应用时数值错误
     * @private
     * @param {Array} rest 
     */
    _exact(rest){
        for (let i = 0, len = rest.length; i < len; i++) {
            let target = rest[i];
            if (target instanceof Float32Array) {
                rest[i] = new Float32Array(target);
            }
        }
        return rest;
    }
    /**
     * 
     * @param {GLProgram} glProgram 
     */
    apply(glProgram){
        //1.深拷贝对象
        var [...cp] = this._queue.reverse();
        this._lastQueue = cp;
        //2.清理queue
        this._queue=[];
        //3.应用
        this.reapply(glProgram);
    }
    /**
     * 应用对象
     * @param {GLProgram} glProgram 
     */
    reapply(glProgram){
        glProgram.useProgram();
        const len = this._lastQueue.length,
            gl = glProgram.gl;
        let task = this._lastQueue.pop();
        while(task!=null){
            gl[task.name].apply(gl,task.rest);
            task.pop();
        }
    }

 }

 module.exports= Recorder;