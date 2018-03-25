/**
 * renderer models and lights
 * @author yellow date 2018/3/25
 */
const std_fs = require('./../components/shader/std_fs'),
    std_vs = require('./../components/shader/std_vs');

/**
 * refrenece:
 * https://github.com/xeolabs/xeogl/blob/master/src/renderer/renderer.js#L286
 * -1.理论上最好在render时，根据scene内容实时构建shader，并绘制最终图形。
 * -2.目前阶段对glsl的组织形式尚未考虑完全，所以采用预先定义shader形式，
 * -3.render过程实际是在向shader内填对应值
 * @class
 */
class Renderer{
    /**
     * 
     * @param {opts} opts 
     * @param {WebGLRenderingContext} [opts.gl] the context of canvas
     */
    constructor(opts){
        /**
         * @type {WebGLRenderingContext}
         */
        this.gl = opts.gl;
    }

    render(camera,models,lights){
        //1.判断lights，组织shader
        //2.判断models，组织shader
        //3.rendering
    }

}