/**
 * renderer models and lights
 * @author yellow date 2018/3/25
 */

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
    /**
     * 
     * @param {Camera} camera 
     * @param {Array[]|Model} models 
     * @param {Light} lights 
     */
    render(camera,skybox,model,shadow,light){
        const gl = this.gl;
        //默认开启相关测试
        gl.enable(gl.DEPTH_TEST);
        gl.clearColor(1,1,1,1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        //textures have a width that divide by 4
        gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
        // gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
        skybox.draw(gl,camera);
        model.draw(gl,camera,skybox);
        shadow.draw(gl,model,light,camera);
        //3.写入lights数据
        // light.prepareDraw(gl,program);
        //4.写入camera数据
        // camera.prepareDraw(gl,program);
        //5.写入models数据,并绘制
    }

}

module.exports = Renderer;