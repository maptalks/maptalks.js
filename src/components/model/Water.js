/**
 * import model
 */
const Model = require('./Model'),
    isString = require('./../utils/isString');
/**
 * glsl
 */
const full_vertex = require('./../shader/water_vertex').full_vertex,
    ocean_vertex = require('./../shader/water_vertex').ocean_vertex,
    full_fragment = require('./../shader/water_fragment').full_fragment,
    ocean_fragment = require('./../shader/water_fragment').ocean_fragment,
    normal_fragment = require('./../shader/water_fragment').normal_fragment,
    phase_fragment = require('./../shader/water_fragment').phase_fragment,
    initial_spectrum_fragment = require('./../shader/water_fragment').initial_spectrum_fragment,
    spectrum_fragment = require('./../shader/water_fragment').spectrum_fragment,
    horizontal_transform_fragment = require('./../shader/water_fragment').horizontal_transform_fragment,
    vertical_transform_fragment = require('./../shader/water_fragment').vertical_transform_fragment;
/**
 * 
 * @param {WebGLRenderingContext} gl 
 * @param {String} text 
 */
const createShader = function (gl, type, text) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, text);
    gl.compileShader(shader);
    return shader;
}
/**
* @param {WebGLRenderingContext} gl 
* @param {String|GLShader} vs 
* @param {String|GLShader} fs
*/
const createProgram = function (gl, vs, fs) {
    let vShader, fShader;
    if (isString(vs)) {
        vShader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vShader, vs);
        gl.compileShader(vShader);
    } else {
        vShader = vs;
    }
    if (isString(fs)) {
        fShader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fShader, fs);
        gl.compileShader(fShader);
    }
    else {
        fShader = fs;
    }
    const program = gl.createProgram();
    gl.attachShader(program, vShader);
    gl.attachShader(program, fShader);
    gl.linkProgram(program);
    return program;
}
/**
 * @param {WebGLRenderingContext} gl 
 * @param {number} unit index of Actived texture unit
 * @param {*} format 
 * @param {*} type 
 * @param {*} width 
 * @param {*} height 
 * @param {*} data 
 * @param {*} wrapS 
 * @param {*} wrapT 
 * @param {*} minFilter 
 * @param {*} magFilter 
 */
const createTexture = function (gl, unit, format, type, width, height, data, wrapS, wrapT, minFilter, magFilter) {
    const texture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, format, width, height, 0, format, type, data);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrapS);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrapT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, minFilter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, magFilter);
    return texture;
};
/**
 * @param {WebGLRenderingContext} gl 
 * @param {Texture} attachment 
 */
const createFramebuffer = function (gl, attachment) {
    const framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, attachment, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER,null);
    return framebuffer;
}
/**
 * @class
 */
class Water extends Model {
    /**
     * @param {Object} [opts]
     */
    constructor(opts = {}) {
        super(opts);
        this.pingPhase = true;
    }
    /**
     * generic ocean data
     */
    _generic() {
        const oceanVetices = [], oceanIndices = [];
        const geometry_resolution = 256,
            geometry_size = 2000,
            geometry_origin = [-100.0, -100.0];
        for (var zIndex = 0; zIndex < geometry_resolution; zIndex++) {
            for (var xIndex = 0; xIndex < geometry_resolution; xIndex++) {
                // vertices
                oceanVetices.push((xIndex * geometry_size) / (geometry_resolution - 1) + geometry_origin[0]);
                oceanVetices.push((0.0));
                oceanVetices.push((zIndex * geometry_size) / (geometry_resolution - 1) + geometry_origin[1]);
                oceanVetices.push(xIndex / (geometry_resolution - 1));
                oceanVetices.push(zIndex / (geometry_resolution - 1));
                // indices
                var topLeft = zIndex * geometry_resolution + xIndex,
                    topRight = topLeft + 1,
                    bottomLeft = topLeft + geometry_resolution,
                    bottomRight = bottomLeft + 1;
                oceanIndices.push(topLeft);
                oceanIndices.push(bottomLeft);
                oceanIndices.push(bottomRight);
                oceanIndices.push(bottomRight);
                oceanIndices.push(topRight);
                oceanIndices.push(topLeft);
            }
        }
        return [oceanVetices, oceanIndices];
    }
    /**
     * @param {WebGLRenderingContext} gl 
     */
    _init(gl) {
        this._inited = true;
        gl.getExtension('OES_texture_float');
        gl.getExtension('OES_texture_float_linear');
        const RESOLUTION = 512;
        const full_vertex_shader = createShader(gl,gl.VERTEX_SHADER,full_vertex);
        // test program
        const full_program = createProgram(gl,full_vertex_shader,full_fragment);
        // horizontal program
        const horizontal_transform_program = createProgram(gl, full_vertex_shader, horizontal_transform_fragment);
        gl.useProgram(horizontal_transform_program);
        gl.uniform1f(gl.getUniformLocation(horizontal_transform_program, 'u_transformSize'), RESOLUTION);
        // vertical program
        const vertical_transform_program = createProgram(gl, full_vertex_shader, vertical_transform_fragment);
        gl.useProgram(vertical_transform_program);
        gl.uniform1f(gl.getUniformLocation(vertical_transform_program, 'u_transformSize'), RESOLUTION);
        // initial spectrum program
        const initial_spectrum_program = createProgram(gl, full_vertex_shader, initial_spectrum_fragment);
        gl.useProgram(initial_spectrum_program);
        gl.uniform1f(gl.getUniformLocation(initial_spectrum_program, 'u_resolution'), RESOLUTION);
        // phase program
        const phase_program = createProgram(gl, full_vertex_shader, phase_fragment);
        gl.useProgram(phase_program);
        gl.uniform1f(gl.getUniformLocation(phase_program, 'u_resolution'), RESOLUTION);
        // spectrum program
        const spectrum_program = createProgram(gl, full_vertex_shader, spectrum_fragment);
        gl.useProgram(spectrum_program);
        gl.uniform1i(gl.getUniformLocation(spectrum_program, 'u_initialSpectrum'), 0);
        gl.uniform1f(gl.getUniformLocation(spectrum_program, 'u_resolution'), RESOLUTION);
        // normal program
        const normal_program = createProgram(gl, full_vertex_shader, normal_fragment);
        gl.useProgram(normal_program);
        gl.uniform1i(gl.getUniformLocation(normal_program, 'u_displacementMap'), 2);
        gl.uniform1f(gl.getUniformLocation(normal_program, 'u_resolution'), RESOLUTION);
        // ocean program
        const ocean_program = createProgram(gl, ocean_vertex, ocean_fragment)
        gl.useProgram(ocean_program);
        gl.uniform1f(gl.getUniformLocation(ocean_program, 'u_geometrySize'), 2000);
        gl.uniform1i(gl.getUniformLocation(ocean_program, 'u_displacementMap'), 2);
        gl.uniform1i(gl.getUniformLocation(ocean_program, 'u_normalMap'), 3);
        gl.uniform3f(gl.getUniformLocation(ocean_program, 'u_oceanColor'), 0.004, 0.016, 0.047);
        gl.uniform3f(gl.getUniformLocation(ocean_program, 'u_skyColor'), 3.2, 9.6, 12.8);
        gl.uniform3f(gl.getUniformLocation(ocean_program, 'u_sunDirection'), -1.0, 1.0, 1.0);
        gl.uniform1f(gl.getUniformLocation(ocean_program, 'u_exposure'), 0.35);
        //buffer data
        const fullscreenbuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER,fullscreenbuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1.0, -1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0]), gl.STATIC_DRAW);

        const [oceanVertices, oceanIndices] = this._generic();
        const oceanBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, oceanBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(oceanVertices), gl.STATIC_DRAW);
        gl.vertexAttribPointer(gl.getAttribLocation(ocean_program, 'a_coordinates'), 2, gl.FLOAT, false, 5 * 4, 3 * 4);
        const oceanIndexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, oceanIndexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(oceanIndices), gl.STATIC_DRAW);
        // textures
        const initialSpectrumTexture = createTexture(gl, 0, gl.RGBA, gl.FLOAT, RESOLUTION, RESOLUTION, null, gl.REPEAT, gl.REPEAT, gl.NEAREST, gl.NEAREST),
            spectrumTexture = createTexture(gl, 1, gl.RGBA, gl.FLOAT, RESOLUTION, RESOLUTION, null, gl.CLAMP_TO_EDGE, gl.CLAMP_TO_EDGE, gl.NEAREST, gl.NEAREST),
            displacementMapTexture = createTexture(gl, 2, gl.RGBA, gl.FLOAT, RESOLUTION, RESOLUTION, null, gl.CLAMP_TO_EDGE, gl.CLAMP_TO_EDGE, gl.LINEAR, gl.LINEAR),
            normalMapTexture = createTexture(gl, 3, gl.RGBA, gl.FLOAT, RESOLUTION, RESOLUTION, null, gl.CLAMP_TO_EDGE, gl.CLAMP_TO_EDGE, gl.LINEAR, gl.LINEAR),
            pingTransformTexture = createTexture(gl, 6, gl.RGBA, gl.FLOAT, RESOLUTION, RESOLUTION, null, gl.CLAMP_TO_EDGE, gl.CLAMP_TO_EDGE, gl.NEAREST, gl.NEAREST),
            pongTransformTexture = createTexture(gl, 7, gl.RGBA, gl.FLOAT, RESOLUTION, RESOLUTION, null, gl.CLAMP_TO_EDGE, gl.CLAMP_TO_EDGE, gl.NEAREST, gl.NEAREST),
            pongPhaseTexture = createTexture(gl, 5, gl.RGBA, gl.FLOAT, RESOLUTION, RESOLUTION, null, gl.CLAMP_TO_EDGE, gl.CLAMP_TO_EDGE, gl.NEAREST, gl.NEAREST);
        var phaseArray = new Float32Array(RESOLUTION * RESOLUTION * 4);
        for (var i = 0; i < RESOLUTION; i += 1) {
            for (var j = 0; j < RESOLUTION; j += 1) {
                phaseArray[i * RESOLUTION * 4 + j * 4] = Math.random() * 2.0 * Math.PI;
                phaseArray[i * RESOLUTION * 4 + j * 4 + 1] = 0;
                phaseArray[i * RESOLUTION * 4 + j * 4 + 2] = 0;
                phaseArray[i * RESOLUTION * 4 + j * 4 + 3] = 0;
            }
        }
        const pingPhaseTexture = createTexture(gl, 4, gl.RGBA, gl.FLOAT, RESOLUTION, RESOLUTION, phaseArray, gl.CLAMP_TO_EDGE, gl.CLAMP_TO_EDGE, gl.NEAREST, gl.NEAREST);
        // framebuffer
        const initialSpectrumFramebuffer = createFramebuffer(gl, initialSpectrumTexture),
            pingPhaseFramebuffer = createFramebuffer(gl, pingPhaseTexture),
            pongPhaseFramebuffer = createFramebuffer(gl, pongPhaseTexture),
            spectrumFramebuffer = createFramebuffer(gl, spectrumTexture),
            displacementMapFramebuffer = createFramebuffer(gl, displacementMapTexture),
            normalMapFramebuffer = createFramebuffer(gl, normalMapTexture),
            pingTransformFramebuffer = createFramebuffer(gl, pingTransformTexture),
            pongTransformFramebuffer = createFramebuffer(gl, pongTransformTexture);
        // export program
        this.full_program = full_program;
        this.phase_program = phase_program;
        this.ocean_program = ocean_program;
        // export array
        this.phaseArray = phaseArray;
        // export texture
        this.pingPhaseTexture = pingPhaseTexture;
        // export framebuffer
        this.pingPhaseFramebuffer = pingPhaseFramebuffer;
        this.pongPhaseFramebuffer = pongPhaseFramebuffer;
        // index buffer
        this.fullscreenbuffer = fullscreenbuffer;
        this.oceanBuffer = oceanBuffer;
        this.oceanIndexBuffer = oceanIndexBuffer;
    }
    /**
     * 
     * @param {WebGLRenderingContext} gl 
     * @param {*} camera ·
     * @param {*} light 
     */
    draw(gl, camera, light, deltaTime) {
        if (!this._inited) this._init(gl);
        gl.viewport(0, 0, 800, 600);
        gl.disable(gl.DEPTH_TEST);
        //
        gl.useProgram(this.full_program);
        gl.bindBuffer(gl.ARRAY_BUFFER,this.fullscreenbuffer);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(0);
        //
        gl.useProgram(this.phase_program);
        // gl.bindFramebuffer(gl.FRAMEBUFFER, this.pingPhase ? this.pongPhaseFramebuffer : this.pingPhaseFramebuffer);
        // this.pingPhase ? 4 : 5
        gl.uniform1i(gl.getUniformLocation(this.phase_program, 'u_phases'), 4);
        gl.uniform1f(gl.getUniformLocation(this.phase_program, 'u_deltaTime'), deltaTime);
        gl.uniform1f(gl.getUniformLocation(this.phase_program, 'u_size'), 512);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        

      
        //海洋数据
        // gl.useProgram(this.ocean_program)
        // gl.bindBuffer(gl.ARRAY_BUFFER, this.oceanBuffer);
        // gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
        // gl.uniformMatrix4fv(gl.getUniformLocation(this.ocean_program, 'u_projectionMatrix'), false, camera.projectionMatrix.value);
        // gl.uniformMatrix4fv(gl.getUniformLocation(this.ocean_program, 'u_viewMatrix'), false, camera.viewMatrix.value);
        // gl.uniform3fv(gl.getUniformLocation(this.ocean_program, 'u_cameraPosition'), camera.position.value);
        // gl.drawArrays(gl.TRIANGLES, 0, 16);
        //gl.drawElements(gl.TRIANGLES, this.oceanIndexBuffer.length, gl.UNSIGNED_SHORT, 0);
        //根据随机的 pingPhaseTexture 绘制相位图
        // gl.useProgram(this.phase_program);
        // gl.bindFramebuffer(gl.FRAMEBUFFER, this.pingPhase ? this.pongPhaseFramebuffer : this.pingPhaseFramebuffer);
        // gl.uniform1i(gl.getUniformLocation(this.phase_program, 'u_phases'), this.pingPhase ? 4 : 5);
        // gl.uniform1f(gl.getUniformLocation(this.phase_program, 'u_deltaTime'), deltaTime);
        // gl.uniform1f(gl.getUniformLocation(this.phase_program, 'u_size'), 512);
        // gl.drawElements(gl.TRIANGLES, this.oceanIndexBuffer.length, gl.UNSIGNED_SHORT, 0);
    }
}

module.exports = Water;