


const Model = require('./Model'),
    //pbr 
    pbr_fragment = require('./../shader/pbr_fragment'),
    pbr_vertex = require('./../shader/pbr_vertex'),
    //background
    bg_fragment = require('./../shader/background_fragment'),
    bg_vertex = require('./../shader/background_vertex'),
    //irradiance
    irradiance_fragment = require('./../shader/irradiance_fragment'),
    irradiance_vertex = require('./../shader/irradiance_vertex');
//
let pbrProgram;
//
let bgProgram;
//
let etcProgram;
//
let irdProgram;

/**
 * @param {WebGLRenderingContext} gl
 */
const createFramebuffer = function(gl){
    const fbo = gl.createFramebuffer();
    const rbo = gl.createRenderbuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER,fbo);
    gl.bindRenderbuffer(gl.RENDERBUFFER,rbo);
    gl.renderbufferStorage(gl.RENDERBUFFER,gl.DEPTH_COMPONENT16,512,512);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.RENDERBUFFER,rbo);
    
};
/**
 * 
 * @param {WebGLRenderingContext} gl 
 * @param {*} vs 
 * @param {*} fs 
 */
const createProgram = function (gl, vs, fs) {
    //pbr vertex shader
    const vs = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vs, vs);
    gl.compileShader(vs);
    //pbr fragment shader
    const fs = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fs, fs);
    gl.compileShader(fs);
    //pbr program
    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    //
    return program;
};
/**
 * @class
 * 
 */
class IBL extends Model {
    constructor(opts = {}) {
        super(opts);
        this._inited = false;
    }
    /**
     * 
     * @param {WebGLRenderingContext} gl 
     */
    _init(gl) {
        const vertices = this.vertices,
            normals = this.normals,
            indeices = this.indices,
            textureCoords = this.textureCoords;
        //
        const pbrProgram = createProgram(gl,pbr_vertex,pbr_fragment);
        const bgProgram = createProgram(gl,bg_vertex,bg_fragment);
        //use pbr
        gl.useProgram(pbrProgram);
        const irradianceMap = gl.getUniformLocation(pbrProgram, 'irradianceMap');
        gl.uniform1i(irradianceMap, 0);
        //set albedo
        const albedo = gl.getUniformLocation(pbrProgram, 'albedo');
        gl.uniform3fv(albedo, [0.5, 0.0, 0.0]);
        //set ao
        const ao = gl.getUniformLocation(pbrProgram, 'ao');
        //use bg
        gl.useProgram(bgProgram);
        const environmentMap = gl.getUniformLocation(bgProgram,'environmentMap');
        gl.uniform1i(environmentMap,0);





        //map buffer
        this._pBuffer = pBuffer;
        this._iBuffer = iBuffer;
        this._nBuffer = nBuffer;
        this._tBuffer = tBuffer;
        this.a_position = a_position;
        this.a_normal = a_normal;
        this.a_texCoord = a_texCoord;
    }

}

module.exports = IBL;