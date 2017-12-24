
/**
 * 基于实体的webglrenderingcontext构建资源包
 * 相关资源在Player启动时构建，并从中取相关对象
 * package包，用于存储
 * -glLimits
 * -glExtensions
 * -
 * @author yellow
 */

const Dispose = require('./../utils/Dispose');
const GLLimits  = require('./../gl/GLLimits');
const GLExtension = require('./../gl/GLExtension');
const GLContext = require('./../gl/GLContext');

/**
 * @class
 * @author yellow date 2017/12/23
 */
class Resource extends Dispose {

    constructor(canvasId){
        super(canvasId);
        this._glContext = new GLContext(canvasId);
    }

    /**
     * 加载资源
     * @param {WebGLRenderingContext} gl 
     */
    load(gl){
        this._glLimits = new GLLimits(gl);
        this._glExtension = new GLExtension(gl);
    }

    get glLimits(){
        if(!this._glLimits)
            throw new Error('Reousrce instance must be initializd by executing load funciton');
        return this._glLimits;
    }

    get glExtension(){
        if(!this._glExtension)
            throw new Error('Reousrce instance must be initializd by executing load funciton');
        return this._glExtension;
    }

    get glContext(){
        return this._glContext;
    }
}
/**
 * 实例
 */
Resource.instances = {};
/**
 * 获取资源实例
 * @param {String} canvasId 
 * @static
 */
Resource.getInstance = (canvasId)=>{
    Resource.instances[canvasId] = Resource.instances[canvasId]||new Resource(canvasId);
    return Resource.instances[canvasId];
}


module.exports = Resource;