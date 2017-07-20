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
 * @modify 2017/6/20
 * @author yellow 2017/5/24
 * @class RenderNode
 * 
 */
import Event from './../utils/Event';
/**
 * @class
 */
class RenderNode extends Event {
    /**
     * 
     */
    _textures={};
    /**
     * 
     */
    _programs={};
    /**
     * 
     */
    _shaders={};

    constructor(gl) {
        super();
    }
    /**
     * 
     */
    add(){

    }

}

export default RenderNode;