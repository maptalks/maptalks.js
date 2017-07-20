/**
 * 生产和处理绘制数据，丢给render队列待output
 */
import { _KIWI_EVENT_RESIZE } from './../core/EventNames';

import Event from './../utils/Event';
import merge from './../utils/merge';
import { stamp } from './../utils/stamp';

import Context from './../renderer/Context';

/**
 * contain two dimensional
 * -renderer,the paint renderer method
 * -data production queue
 * so,if we want to render geometry,we shoud produce data by customer DataManage
 * 
 * -将RenderNode内的数据取出，生成与逻辑无关的顶点用于渲染。
 *  绘制好后放入待output队列，等待RenderLoop操作逐帧渲染。
 * 
 * @class
 */
class RenderManager extends Event {
    /**
     * render数据集
     */
    _renderNodes=[];
    /**
     * render instance
     * @memberof RenderManager
     * @type {Context}
     */
    _ctx;
    /**
     * 
     * @param {Object} [options] 
     * @param {String} [options.renderType] default is 'webgl'
     * @param {number} [options.width] 
     * @param {number} [options.height]
     */
    constructor(options) {
        super();
        this._ctx=new Context(options);
        //renderManager监听 _KIWI_EVENT_RESIZE 事件
        //this.addEventPopNode(this._ctx);
        this.on(_KIWI_EVENT_RESIZE, this._onResize);
    }

    _onResize(width,height) {
        const ctx = this._ctx;
        ctx.resize(width,height);
    }

    get context(){
         const ctx = this._ctx;
         return ctx;
    }

    get width(){
         const ctx = this._ctx;
         return ctx.width;
    }

    get height(){
         const ctx = this._ctx;
         return ctx.height;
    }

    addRenderNode(renderNode){
        this._renderNodes.push(renderNode);
    }

}

export default RenderManager;