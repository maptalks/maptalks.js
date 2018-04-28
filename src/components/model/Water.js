/**
 * import model
 */
const Model = require('./Model'),
    isString = require('./../utils/isString');
/**
 * parameters
 */
const RESOLUTION = 512;
const SIZE = 250;
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
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
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
        const oceanData = [], oceanIndices = [], coordinates = [-1.0, -1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0];
        const GEOMETRY_RESOLUTION = 256,
            GEOMETRY_SIZE = 2,
            GEOMETRY_ORIGIN = [-1.0, -1.0];
        for (var zIndex = 0; zIndex < GEOMETRY_RESOLUTION; zIndex += 1) {
            for (var xIndex = 0; xIndex < GEOMETRY_RESOLUTION; xIndex += 1) {
                oceanData.push(GEOMETRY_ORIGIN[0] + GEOMETRY_SIZE * xIndex / (GEOMETRY_RESOLUTION - 1));
                oceanData.push(GEOMETRY_ORIGIN[1] + GEOMETRY_SIZE * zIndex / (GEOMETRY_RESOLUTION - 1));
                oceanData.push(0.0);
                // oceanData.push((xIndex * GEOMETRY_SIZE) / (GEOMETRY_RESOLUTION - 1) + GEOMETRY_ORIGIN[0]);
                // oceanData.push((0.0));
                // oceanData.push((zIndex * GEOMETRY_SIZE) / (GEOMETRY_RESOLUTION - 1) + GEOMETRY_ORIGIN[1]);
                // oceanData.push(xIndex / (GEOMETRY_RESOLUTION - 1));
                // oceanData.push(zIndex / (GEOMETRY_RESOLUTION - 1));
            }
        }
        for (var zIndex = 0; zIndex < GEOMETRY_RESOLUTION - 1; zIndex += 1) {
            for (var xIndex = 0; xIndex < GEOMETRY_RESOLUTION - 1; xIndex += 1) {
                var topLeft = zIndex * GEOMETRY_RESOLUTION + xIndex,
                    topRight = topLeft + 1,
                    bottomLeft = topLeft + GEOMETRY_RESOLUTION,
                    bottomRight = bottomLeft + 1;
                oceanIndices.push(topLeft);
                oceanIndices.push(bottomLeft);
                oceanIndices.push(bottomRight);
                oceanIndices.push(bottomRight);
                oceanIndices.push(topRight);
                oceanIndices.push(topLeft);
            }
        }
        return [oceanData, oceanIndices, coordinates];
    }
    /**
     * @param {WebGLRenderingContext} gl 
     */
    _init(gl) {
        this._inited = true;
        gl.getExtension('OES_texture_float');
        gl.getExtension('OES_texture_float_linear');
        const full_vertex_shader = createShader(gl, gl.VERTEX_SHADER, full_vertex);
        // test program
        const full_program = createProgram(gl, full_vertex_shader, full_fragment);
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
        gl.uniform1f(gl.getUniformLocation(normal_program, 'u_size'), SIZE);
        // ocean program
        const ocean_program = createProgram(gl, ocean_vertex, ocean_fragment)
        gl.useProgram(ocean_program);
        // gl.uniform1f(gl.getUniformLocation(ocean_program, 'u_geometrySize'), 2000);
        // gl.uniform1i(gl.getUniformLocation(ocean_program, 'u_displacementMap'), 2);
        // gl.uniform1i(gl.getUniformLocation(ocean_program, 'u_normalMap'), 3);
        // gl.uniform3f(gl.getUniformLocation(ocean_program, 'u_oceanColor'), 0.004, 0.016, 0.047);
        // gl.uniform3f(gl.getUniformLocation(ocean_program, 'u_skyColor'), 3.2, 9.6, 12.8);
        // gl.uniform3f(gl.getUniformLocation(ocean_program, 'u_sunDirection'), -1.0, 1.0, 1.0);
        // gl.uniform1f(gl.getUniformLocation(ocean_program, 'u_exposure'), 0.35);
        //ocean data
        const [oceanVertices, oceanIndices, coordinates] = this._generic();
        //ocean vertices data
        const oceanBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, oceanBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(oceanVertices), gl.STATIC_DRAW);
        //ocean indices data
        const oceanIndexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, oceanIndexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(oceanIndices), gl.STATIC_DRAW);
        const coordinatesBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, coordinatesBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(coordinates), gl.STATIC_DRAW)
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
        // 初始化 spetrumFramebuffer
        gl.useProgram(initial_spectrum_program);
        //vertex data
        const fullscreenbuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, fullscreenbuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1.0, -1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0]), gl.STATIC_DRAW);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(0);
        //fragment data
        gl.bindFramebuffer(gl.FRAMEBUFFER, initialSpectrumFramebuffer);
        gl.uniform2f(gl.getUniformLocation(initial_spectrum_program, 'u_wind'), 10.0, 10.0);
        gl.uniform1f(gl.getUniformLocation(initial_spectrum_program, 'u_size'), SIZE);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        // export program
        this.full_program = full_program;
        this.normal_program = normal_program;
        this.phase_program = phase_program;
        this.ocean_program = ocean_program;
        this.spectrum_program = spectrum_program;
        this.horizontal_transform_program = horizontal_transform_program;
        this.vertical_transform_program = vertical_transform_program;
        // export array
        this.phaseArray = phaseArray;
        // export texture
        this.pingPhaseTexture = pingPhaseTexture;
        // export framebuffer
        this.pingPhaseFramebuffer = pingPhaseFramebuffer;
        this.pongPhaseFramebuffer = pongPhaseFramebuffer;
        this.spectrumFramebuffer = spectrumFramebuffer;
        this.pingTransformFramebuffer = pingTransformFramebuffer;
        this.pongTransformFramebuffer = pongTransformFramebuffer;
        this.displacementMapFramebuffer = displacementMapFramebuffer;
        this.normalMapFramebuffer = normalMapFramebuffer;
        // index buffer
        this.fullscreenbuffer = fullscreenbuffer;
        this.oceanBuffer = oceanBuffer;
        this.oceanIndexBuffer = oceanIndexBuffer;
        this.coordinatesBuffer = coordinatesBuffer;
        // export 
        this.oceanIndices = oceanIndices;
        this.oceanVertices = oceanVertices;
    }
    /**
     * 
     * @param {WebGLRenderingContext} gl 
     * @param {*} camera ·
     * @param {*} light 
     */
    draw(gl, camera, light, deltaTime) {
        gl.viewport(0, 0, 512, 512);
        gl.disable(gl.DEPTH_TEST);
        if (!this._inited) this._init(gl);
        //
        gl.useProgram(this.full_program);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.fullscreenbuffer);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(0);
        //
        gl.useProgram(this.phase_program);
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.pingPhase ? this.pongPhaseFramebuffer : this.pingPhaseFramebuffer);
        gl.uniform1i(gl.getUniformLocation(this.phase_program, 'u_phases'), this.pingPhase ? 4 : 5);
        gl.uniform1f(gl.getUniformLocation(this.phase_program, 'u_deltaTime'), deltaTime);
        gl.uniform1f(gl.getUniformLocation(this.phase_program, 'u_size'), SIZE);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        this.pingPhase = !this.pingPhase;
        //
        gl.useProgram(this.spectrum_program);
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.spectrumFramebuffer);
        gl.uniform1i(gl.getUniformLocation(this.spectrum_program, 'u_phases'), this.pingPhase ? 4 : 5);
        gl.uniform1f(gl.getUniformLocation(this.spectrum_program, 'u_size'), SIZE);
        gl.uniform1f(gl.getUniformLocation(this.spectrum_program, 'u_choppiness'), 1.5);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        //
        let subtransformProgram = this.horizontal_transform_program;
        gl.useProgram(subtransformProgram);
        const iterations = Math.log(512) / Math.log(2) * 2;
        for (var i = 0; i < iterations; i += 1) {
            if (i === 0) {
                gl.bindFramebuffer(gl.FRAMEBUFFER, this.pingTransformFramebuffer);
                gl.uniform1i(gl.getUniformLocation(subtransformProgram, 'u_input'), 1);
            }
            else if (i === iterations - 1) {
                gl.bindFramebuffer(gl.FRAMEBUFFER, this.displacementMapFramebuffer);
                gl.uniform1i(gl.getUniformLocation(subtransformProgram, 'u_input'), (iterations % 2 === 0) ? 6 : 7);
            }
            else if (i % 2 === 1) {
                gl.bindFramebuffer(gl.FRAMEBUFFER, this.pongTransformFramebuffer);
                gl.uniform1i(gl.getUniformLocation(subtransformProgram, 'u_input'), 6);
            }
            else {
                gl.bindFramebuffer(gl.FRAMEBUFFER, this.pingTransformFramebuffer);
                gl.uniform1i(gl.getUniformLocation(subtransformProgram, 'u_input'), 7);
            }
            if (i === iterations / 2) {
                subtransformProgram = this.vertical_transform_program;
                gl.useProgram(subtransformProgram);
            }
            gl.uniform1f(gl.getUniformLocation(subtransformProgram, 'u_subtransformSize'), Math.pow(2, (i % (iterations / 2)) + 1));
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        }
        //
        gl.useProgram(this.normal_program);
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.normalMapFramebuffer);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        // 绘制海洋
        gl.viewport(0, 0, 800, 600);
        gl.enable(gl.DEPTH_TEST);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.useProgram(this.ocean_program);
        //vertex
        gl.bindBuffer(gl.ARRAY_BUFFER, this.oceanBuffer);
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(0);
        //coordinates
        gl.bindBuffer(gl.ARRAY_BUFFER, this.coordinatesBuffer);
        gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(1);
        //gl.uniform1f(gl.getUniformLocation(this.ocean_program, 'u_size'), SIZE);
        //coord
        // gl.enableVertexAttribArray(1);
        // gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 5 * 4, 3 * 4);
        //index buffer
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.oceanIndexBuffer);
        // gl.uniformMatrix4fv(gl.getUniformLocation(this.ocean_program, 'u_projectionMatrix'), false, camera.projectionMatrix.value);
        // gl.uniformMatrix4fv(gl.getUniformLocation(this.ocean_program, 'u_viewMatrix'), false, camera.viewMatrix.value);
        // gl.uniform3fv(gl.getUniformLocation(this.ocean_program, 'u_cameraPosition'), camera.position.value);
        gl.drawElements(gl.TRIANGLES, this.oceanIndices.length, gl.UNSIGNED_SHORT, 0);
    }
}

module.exports = Water;