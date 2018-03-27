/**
 * renderer models and lights
 * @author yellow date 2018/3/25
 */
const std_fs = require('./../components/shader/stdfs'),
    std_vs = require('./../components/shader/stdvs');
/**
 * vertex shader cache
 */
const VSCACHE = {};
/**
 * fragment shader cache
 */
const FSCACHE = {};
/**
 * program cache
 */
const PROGRAMCACHE = {};
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
    render(camera,models,light){
        /**
         * @type {WebGLRenderingContext}
         */
        const gl = this.gl;
        //1.判断lights，组织shader(这里采用直接构建的方式)
        if(!VSCACHE['stdvs']){
            VSCACHE['stdvs'] = gl.createShader(gl.VERTEX_SHADER);
            gl.shaderSource(VSCACHE['stdvs'],std_vs);
            gl.compileShader(VSCACHE['stdvs']);
        }
        if(!VSCACHE['stdfs']){
            VSCACHE['stdfs'] = gl.createShader(gl.FRAGMENT_SHADER);
            gl.shaderSource(VSCACHE['stdfs'],std_fs);
            gl.compileShader(VSCACHE['stdfs']);
        }
        if(!PROGRAMCACHE['std']){
            PROGRAMCACHE['std'] = gl.createProgram();
            gl.attachShader(PROGRAMCACHE['std'],VSCACHE['stdvs']);
            gl.attachShader(PROGRAMCACHE['std'],VSCACHE['stdfs']);
            gl.linkProgram(PROGRAMCACHE['std']);
            gl.useProgram(PROGRAMCACHE['std']);
        }
        const program = PROGRAMCACHE['std'];
        //2.默认开启相关测试
        gl.enable(gl.DEPTH_TEST);
        gl.clearColor(1,1,1,1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
        //3.写入lights数据
        light.prepareDraw(gl,program);
        //4.写入camera数据
        camera.prepareDraw(gl,program);
        //5.写入models数据,并绘制
        for(let i=0;i<models.length;i++)
            models[i].draw(gl,program);
    }

}

module.exports = Renderer;