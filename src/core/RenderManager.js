/**
 * 生产和处理绘制数据，丢给render队列待output
 * @author yellow date 2017/6/12
 */

const Event = require('./../utils/Event'),
    merge = require('./../utils/merge'),
    stamp = require('./../utils/stamp').stamp;

const Context = require('./../gl/Context');

class RenderManager extends Event{

    constructor(options){
        super();
        /**
         * Array of Nodes
         */
        this._renderNodes=[];
        /**
         * render Context
         * @type {Context}
         */
        this._ctx = new Context(options);
        /**
         * register event of 'resize'
         */
        this.on('resize',this._onResize);
    }
    /**
     * 
     * @param {number} w 
     * @param {number} h 
     */
    _onResize(w,h){
        const ctx = this._ctx;
        ctx.resize(w,h);
    }

}
