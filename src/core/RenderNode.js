/**
 * reference https://github.com/mapbox/earcut
 * #RenderNode actor as an core object in gl
 * each geometry should be converted to #RenderNode
 * you can also building a update tree to cut down the cost in redraw by adding child nodes.
 * 
 * 每个Node包含自己的切割转换Buffer Array方法，提供给RenderManager下的work进行数据转换与裁剪
 * 
 * -vertexarraybuffer
 * -shader
 * -
 * 
 * @modify :1 2017/6/20
 * @author yellow 2017/5/24
 * @class RenderNode
 * 
 * @modify :2 2017/7/20
 * renderNode基类，其他需要render的结点须实现此基类方法：
 * 1. prepare,数据准备阶段，将任务插入队列
 * 2. draw,实际绘制方法
 * 3. animationDraw,动画时绘制方法，此方法将在requestFrameLoop里采用队列式插入调用
 * 
 */
import Event from './../utils/Event';
/**
 * @class
 */
class RenderNode extends Event {
    /**
     * @type {WebGLRenderingContext}
     */
    _gl;
    /**
     * 
     */
    _textures={};
    /**
     * 
     */
    _buffer={};
    /**
     * 
     */
    _shaders={};
    /**
     * 待载入资源队列
     */
    _promiseToLoadResources=[];

    constructor(gl) {
        super();
        this._gl = gl;
        //准备资源
        this.prepare();
    }

    /**
     * 数据拆分与准备阶段
     */
    prepare(){
        throw Error('no implement of RenderNode.prepare')
    }
    
    animate(){
        
    }
    

}

export default RenderNode;