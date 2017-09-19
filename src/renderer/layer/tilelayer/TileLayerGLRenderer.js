import { IS_NODE } from 'core/util';
import * as mat4 from 'core/util/mat4';
import TileLayer from 'layer/tile/TileLayer';
import TileLayerCanvasRenderer from './TileLayerCanvasRenderer';
import Browser from 'core/Browser';
import Canvas from 'core/Canvas';

const shaders = {
    'vertexShader' : `
        attribute vec2 a_position;
        attribute vec2 a_texCoord;

        uniform mat4 u_matrix;

        varying vec2 v_texCoord;

        void main() {
            vec2 t = a_position * vec2(1.0, -1.0);

            gl_Position = u_matrix * vec4(t, 0.0, 1.0);

            v_texCoord = a_texCoord;
        }
    `,
    'fragmentShader' : `
        precision mediump float;

        // our texture
        uniform sampler2D u_image;

        // the texCoords passed in from the vertex shader.
        varying vec2 v_texCoord;

        void main() {
            gl_FragColor = texture2D(u_image, v_texCoord);
        }
    `
};

/**
 * @classdesc
 * Renderer class based on HTML5 WebGL for TileLayers
 * @class
 * @protected
 * @memberOf renderer
 * @extends {renderer.TileLayerCanvasRenderer}
 * @param {TileLayer} layer - TileLayer to render
 */
export default class TileLayerGLRenderer extends TileLayerCanvasRenderer {

    _isDrawable() {
        return true;
    }

    initContext() {
        super.initContext();
        const map = this.getMap();
        const size = map.getSize();
        const r = Browser.retina ? 2 : 1;
        this.glCanvas = Canvas.createCanvas(r * size['width'], r * size['height'], map.glCanvasClass);
        const gl = this.gl = this._createGLContext(this.glCanvas, this.layer.options['glOptions']);

        gl.clearColor(0.0, 0.0, 0.0, 0.0);
    }

    onCanvasCreate() {
        const gl = this.gl;
        gl.disable(gl.DEPTH_TEST);
        gl.disable(gl.STENCIL_TEST);
        this.program = this.createProgram(shaders['vertexShader'], shaders['fragmentShader'], ['u_matrix', 'u_image']);
        this.useProgram(this.program);

        // input texture vec data
        const texBuffer = this.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, texBuffer);
        this.enableVertexAttrib(['a_texCoord', 2]);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
            0.0,  0.0,
            1.0,  0.0,
            0.0,  1.0,
            0.0,  1.0,
            1.0,  0.0,
            1.0,  1.0]), gl.STATIC_DRAW);
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);

        this.enableSampler('u_image');

        // Enable texture unit0
        gl.activeTexture(gl['TEXTURE0']);

        this.posBuffer = this.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.posBuffer);
        this.enableVertexAttrib(['a_position', 2]);
    }

    resizeCanvas(canvasSize) {
        if (!this.canvas) {
            return;
        }
        super.resizeCanvas(canvasSize);
        if (this.glCanvas.width !== this.canvas.width || this.glCanvas.height !== this.canvas.height) {
            this.glCanvas.width = this.canvas.width;
            this.glCanvas.height = this.canvas.height;
            this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        }
    }

    clearCanvas() {
        if (!this.canvas) {
            return;
        }
        super.clearCanvas();
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    }

    _gl() {
        return !!this.getMap().getPitch();
    }

    getCanvasImage() {
        if (this._gl()) {
            this.context.drawImage(this.glCanvas, 0, 0);
        }
        return super.getCanvasImage();
    }

    _onTileLoad(tileImage, tileInfo) {
        if (this._gl()) {
            const texture = this._createTexture(tileImage);
            tileImage.texture = texture;
        }
        super._onTileLoad(tileImage, tileInfo);
    }

    _createTexture(tileImage) {
        const gl = this.gl;
        const texture = this._getTexture() || gl.createTexture();   // Create a texture object
        if (!texture) {
            throw new Error('Failed to create the texture object');
        }
        // Bind the texture object to the target
        gl.bindTexture(gl.TEXTURE_2D, texture);

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, tileImage);

        gl.generateMipmap(gl.TEXTURE_2D);
        return texture;
    }

    _getTexture() {
        if (!this._textures) {
            this._textures = [];
        }
        const textures = this._textures;
        return textures && textures.length > 0 ? textures.pop() : null;
    }

    _saveTexture(texture) {
        this._textures.push(texture);
    }

    _drawTile(point, tileId, tileImage) {
        if (!this._gl()) {
            // fall back to canvas 2D, as canvas 2D is much more performant than webgl here
            super._drawTile(point, tileId, tileImage);
            return;
        }
        const map = this.getMap();
        if (!point || !map) {
            return;
        }
        const gl = this.gl,
            pp = map._pointToPoint(point, this._tileZoom),
            scale = map._getResolution(this._tileZoom) / map._getResolution(),
            tileSize = this.layer.getTileSize();
        // const opacity = this._getTileOpacity(tileImage);
        const x = pp.x,
            y = pp.y,
            w = tileSize['width'] * scale,
            h = tileSize['height'] * scale;
        this.loadTexture(tileImage);
        const matrix = this.getViewMatrix();
        gl.uniformMatrix4fv(this.program['u_matrix'], false, Float32Array.from(matrix));

        const x1 = x;
        const x2 = x + w;
        const y1 = y;
        const y2 = y + h;
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
            x1, y1,
            x2, y1,
            x1, y2,
            x1, y2,
            x2, y1,
            x2, y2
        ]), gl.DYNAMIC_DRAW);

        gl.drawArrays(gl.TRIANGLES, 0, 6);

        // if (opacity < 1) {
        //     this.setToRedraw();
        // }
    }

    _getTileOpacity(tileImage) {
        if (this._gl()) {
            return 1;
        } else {
            return super._getTileOpacity(tileImage);
        }
    }

    getViewMatrix() {
        const m = mat4.copy(new Float64Array(16), this.getMap().projMatrix);
        mat4.scale(m, m, [1, -1, 1]);
        return m;
    }

    _drawBackground() {
        if (!this._gl() && this.background) {
            const ctx = this.context,
                back = this.background,
                map = this.getMap();
            const scale = map._getResolution(back.tileZoom) / map._getResolution();
            const cp = map._pointToContainerPoint(back.nw, back.zoom);
            ctx.save();
            ctx.translate(cp.x, cp.y);
            ctx.scale(scale, scale);
            ctx.drawImage(back.canvas, 0, 0);
            ctx.restore();
        }
    }

    _deleteTile(tile) {
        super._deleteTile(tile);
        if (tile && !tile.current && tile.texture) {
            this._saveTexture(tile.texture);
            delete tile.texture;
        }
    }

    loadTexture(image) {
        const gl = this.gl;
        let texture = image.texture;   // Create a texture object
        if (!texture) {
            texture = this._createTexture(image);
            image.texture = texture;
        }
        gl.bindTexture(gl.TEXTURE_2D, texture);
        return texture;
    }

    onRemove() {
        const gl = this.gl;
        if (this._buffers) {
            this._buffers.forEach(function (b) {
                gl.deleteBuffer(b);
            });
            delete this._buffers;
        }
        const program = this.gl.program;
        gl.deleteProgram(program);
        gl.deleteShader(program.fragmentShader);
        gl.deleteShader(program.vertexShader);
        if (this._textures) {
            this._textures.forEach(t => gl.deleteTexture(t));
            delete this._textures;
        }
    }

    //-------------------------------------------------------------------------------------------

    createBuffer() {
        const gl = this.gl;
        // Create the buffer object
        const buffer = gl.createBuffer();
        if (!buffer) {
            throw new Error('Failed to create the buffer object');
        }
        if (!this._buffers) {
            this._buffers = [];
        }
        this._buffers.push(buffer);
        return buffer;
    }

    /**
     *
     * @param {Array} attributes [[name, stride, type], [name, stride, type]...]
     */
    enableVertexAttrib(attributes) {
        const gl = this.gl;
        if (Array.isArray(attributes[0])) {
            const verticesTexCoords = new Float32Array([0.0, 0.0, 0.0]);
            const FSIZE = verticesTexCoords.BYTES_PER_ELEMENT;
            let STRIDE = 0;
            for (let i = 0; i < attributes.length; i++) {
                STRIDE += (attributes[i][1] || 0);
            }
            let offset = 0;
            for (let i = 0; i < attributes.length; i++) {
                const attr = gl.getAttribLocation(gl.program, attributes[i][0]);
                if (attr < 0) {
                    throw new Error('Failed to get the storage location of ' + attributes[i][0]);
                }
                gl.vertexAttribPointer(attr, attributes[i][1], gl[attributes[i][2] || 'FLOAT'], false, FSIZE * STRIDE, FSIZE * offset);
                offset += (attributes[i][1] || 0);
                gl.enableVertexAttribArray(attr);
            }
        } else {
            const attr = gl.getAttribLocation(gl.program, attributes[0]);
            gl.vertexAttribPointer(attr, attributes[1], gl[attributes[2] || 'FLOAT'], false, 0, 0);
            gl.enableVertexAttribArray(attr);
        }
    }

    /**
     * Create the linked program object
     * @param vshader a vertex shader program (string)
     * @param fshader a fragment shader program (string)
     * @return created program object, or null if the creation has failed
     */
    createProgram(vshader, fshader, uniforms) {
        const gl = this.gl;
        // Create shader object
        const vertexShader = this._compileShader(gl, gl.VERTEX_SHADER, vshader);
        const fragmentShader = this._compileShader(gl, gl.FRAGMENT_SHADER, fshader);
        if (!vertexShader || !fragmentShader) {
            return null;
        }

        // Create a program object
        const program = gl.createProgram();
        if (!program) {
            return null;
        }

        // Attach the shader objects
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);

        // Link the program object
        gl.linkProgram(program);
        gl.vertexShader = vertexShader;
        gl.fragmentShader = fragmentShader;
        // Check the result of linking
        const linked = gl.getProgramParameter(program, gl.LINK_STATUS);
        if (!linked) {
            const error = gl.getProgramInfoLog(program);
            gl.deleteProgram(program);
            gl.deleteShader(fragmentShader);
            gl.deleteShader(vertexShader);
            throw new Error('Failed to link program: ' + error);
        }

        this._initUniforms(program, uniforms);

        return program;
    }

    useProgram(program) {
        const gl = this.gl;
        gl.useProgram(program);
        gl.program = program;
        return this;
    }

    enableSampler(sampler, texIdx) {
        const gl = this.gl;
        const uSampler = this._getUniform(gl.program, sampler);
        if (!texIdx) {
            texIdx = 0;
        }
        // Set the texture unit to the sampler
        gl.uniform1i(uSampler, texIdx);
        return uSampler;
    }

    _createGLContext(canvas) {
        const attributes = {
            'alpha': true
        };
        const names = ['webgl', 'experimental-webgl'];
        let context = null;
        /* eslint-disable no-empty */
        for (let i = 0; i < names.length; ++i) {
            try {
                context = canvas.getContext(names[i], attributes);
            } catch (e) {}
            if (context) {
                break;
            }
        }
        return context;
        /* eslint-enable no-empty */
    }

    /**
     * Create a shader object
     * @param gl GL context
     * @param type the type of the shader object to be created
     * @param source shader program (string)
     * @return created shader object, or null if the creation has failed.
     */
    _compileShader(gl, type, source) {
        // Create shader object
        const shader = gl.createShader(type);
        if (shader == null) {
            throw new Error('unable to create shader');
        }

        // Set the shader program
        gl.shaderSource(shader, source);
        // Compile the shader
        gl.compileShader(shader);

        // Check the result of compilation
        const compiled = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
        if (!compiled) {
            const error = gl.getShaderInfoLog(shader);

            gl.deleteShader(shader);
            throw new Error('Failed to compile shader: ' + error);
        }

        return shader;
    }

    _initUniforms(program, uniforms) {
        for (let i = 0; i < uniforms.length; i++) {
            let name = uniforms[i];
            let uniform = uniforms[i];
            const b = name.indexOf('[');
            if (b >= 0) {
                name = name.substring(0, b);
                if (!IS_NODE) {
                    // In browser, remove [0] from uniforma declaration
                    uniform = uniform.substring(0, b);
                }
            }
            program[name] = this._getUniform(program, uniform);
        }
    }

    _getUniform(program, uniformName) {
        const gl = this.gl;
        const uniform = gl.getUniformLocation(program, uniformName);
        if (!uniform) {
            throw new Error('Failed to get the storage location of ' + uniformName);
        }
        return uniform;
    }
}

TileLayer.registerRenderer('gl', TileLayerGLRenderer);
