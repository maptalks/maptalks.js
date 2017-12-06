import { IS_NODE, extend } from 'core/util';
import * as mat4 from 'core/util/mat4';
import Canvas from 'core/Canvas';
import Browser from 'core/Browser';

const shaders = {
    'vertexShader': `
        attribute vec3 a_position;

        attribute vec2 a_texCoord;

        uniform mat4 u_matrix;

        varying vec2 v_texCoord;

        void main() {
            gl_Position = u_matrix * vec4(a_position, 1.0);

            v_texCoord = a_texCoord;
        }
    `,
    // fragment shader, can be replaced by layer.options.fragmentShader
    'fragmentShader': `
        precision mediump float;

        uniform sampler2D u_image;

        uniform float u_opacity;

        varying vec2 v_texCoord;

        void main() {

            gl_FragColor = texture2D(u_image, v_texCoord) * u_opacity;

        }
    `
};

/**
 * A mixin providing image support in WebGL env
 * @mixin ImageGLRenderable
 * @protected
 */
const ImageGLRenderable = Base => {
    const renderable = class extends Base {

        /**
         * Draw an image at x, y at map's gl zoom
         * @param {Image|Canvas} image
         * @param {Number} x - x at map's gl zoom
         * @param {Number} y - y at map's gl zoom
         * @param {Number} w - width at map's gl zoom
         * @param {Number} h - height at map's gl zoom
         * @param {Number} opacity
         */
        drawGLImage(image, x, y, w, h, opacity) {
            const gl = this.gl;
            this.loadTexture(image);

            gl.uniformMatrix4fv(this.program['u_matrix'], false, this.getProjViewMatrix());
            gl.uniform1f(this.program['u_opacity'], opacity);
            const x1 = x;
            const x2 = x + w;
            const y1 = y;
            const y2 = y + h;
            gl.bindBuffer(gl.ARRAY_BUFFER, this.posBuffer);
            this.enableVertexAttrib(['a_position', 3]);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
                x1, y1, 0.0,  //0
                x2, y1, 0.0, //1
                x1, y2, 0.0, //2
                x1, y2, 0.0,  //2
                x2, y1, 0.0, //1
                x2, y2, 0.0 //3
            ]), gl.DYNAMIC_DRAW);
            gl.drawArrays(gl.TRIANGLES, 0, 6);
        }

        /**
         * Draw the tile image as tins
         * @param {HtmlElement} image
         * @param {Array} vertices  - tin vertices
         * @param {Array} texCoords - texture coords
         * @param {Array} indices   - element indexes
         * @param {number} opacity
         */
        drawTinImage(image, vertices, texCoords, indices, opacity) {
            const gl = this.gl;
            this.loadTexture(image);
            gl.uniformMatrix4fv(this.program['u_matrix'], false, this.getProjViewMatrix());
            gl.uniform1f(this.program['u_opacity'], opacity);

            //bufferdata vertices
            gl.bindBuffer(gl.ARRAY_BUFFER, this.posBuffer);
            this.enableVertexAttrib(['a_position', 3]);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);

            //bufferdata tex coords
            gl.bindBuffer(gl.ARRAY_BUFFER, this.texBuffer);
            this.enableVertexAttrib(['a_texCoord', 2]);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.DYNAMIC_DRAW);

            //bufferdata indices
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.DYNAMIC_DRAW);
            //draw
            gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
        }

        /**
         * Return map's projection view matrix
         * @returns {Float32Array}
         */
        getProjViewMatrix() {
            return this.copy16(this.getMap().projViewMatrix);
        }

        /**
         * Prepare GL canvas and context
         */
        prepareGLCanvas() {
            const map = this.getMap();
            this.glCanvas = Canvas.createCanvas(this.canvas.width, this.canvas.height, map.glCanvasClass);
            const gl = this.gl = this._createGLContext(this.glCanvas, this.layer.options['glOptions']);
            gl.clearColor(0.0, 0.0, 0.0, 0.0);

            gl.disable(gl.DEPTH_TEST);
            gl.disable(gl.STENCIL_TEST);

            gl.enable(gl.BLEND);
            gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

            this.program = this.createProgram(shaders['vertexShader'], this.layer.options['fragmentShader'] || shaders['fragmentShader'], ['u_matrix', 'u_image', 'u_opacity']);
            this.useProgram(this.program);

            // input texture vec data
            this.texBuffer = this.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, this.texBuffer);
            this.enableVertexAttrib(['a_texCoord', 2]);
            gl.bufferData(gl.ARRAY_BUFFER, this.copy12([
                0.0, 0.0,
                1.0, 0.0,
                0.0, 1.0,
                0.0, 1.0,
                1.0, 0.0,
                1.0, 1.0]), gl.STATIC_DRAW);

            this.enableSampler('u_image');

            // Enable texture unit 0
            gl.activeTexture(gl['TEXTURE0']);

            gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);

            this.posBuffer = this.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, this.posBuffer);
            this.enableVertexAttrib(['a_position', 3]);

            // Enable indices buffer
            this.indicesBuffer = this.createBuffer();
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indicesBuffer);
        }

        /**
         * Resize GL canvas with renderer's 2D canvas
         */
        resizeGLCanvas() {
            if (!this.glCanvas) {
                return;
            }
            if (this.glCanvas.width !== this.canvas.width || this.glCanvas.height !== this.canvas.height) {
                this.glCanvas.width = this.canvas.width;
                this.glCanvas.height = this.canvas.height;
                this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
            }
        }

        /**
         * Clear gl canvas
         */
        clearGLCanvas() {
            if (this.gl) {
                this.gl.clear(this.gl.COLOR_BUFFER_BIT);
            }
        }

        _createTexture(image) {
            const gl = this.gl;
            const texture = this.getTexture() || gl.createTexture();   // Create a texture object
            // Bind the texture object to the target
            gl.bindTexture(gl.TEXTURE_2D, texture);
            // from mapbox-gl-js
            // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

            gl.generateMipmap(gl.TEXTURE_2D);
            return texture;
        }

        /**
         * Get a texture from cache or create one if cache is empty
         * @returns {WebGLTexture}
         */
        getTexture() {
            if (!this._textures) {
                this._textures = [];
            }
            const textures = this._textures;
            return textures && textures.length > 0 ? textures.pop() : null;
        }

        /**
         * Save a texture to the cache
         * @param {WebGLTexture} texture
         */
        saveTexture(texture) {
            this._textures.push(texture);
        }

        /**
         * Load image into a text and bind it with WebGLContext
         * @param {Image|Canvas} image
         * @returns {WebGLTexture}
         */
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

        /**
         * remove all the resources and remove gl canvas
         */
        removeGLCanvas() {
            // release resources
            const gl = this.gl;
            if (!gl) {
                return;
            }
            if (this._buffers) {
                this._buffers.forEach(function (b) {
                    gl.deleteBuffer(b);
                });
                delete this._buffers;
            }
            if (this._textures) {
                this._textures.forEach(t => gl.deleteTexture(t));
                delete this._textures;
            }
            delete this.posBuffer;
            const program = gl.program;
            gl.deleteProgram(program);
            gl.deleteShader(program.fragmentShader);
            gl.deleteShader(program.vertexShader);
            delete this.gl;
            delete this.glCanvas;
        }

        //----------------------- webgl utils unlike to change ---------------------------------

        /**
         * Create a WebGL buffer
         * @returns {WebGLBuffer}
         */
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
         * Enable vertex attributes
         * @param {Array} attributes [[name, stride, type], [name, stride, type]...]
         * @example
         * rendererr.enableVertexAttrib([
         *  ['a_position', 3, 'FLOAT'],
         *  ['a_normal', 3, 'FLOAT']
         * ]);
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
         * @param {String} vshader a vertex shader program (string)
         * @param {String} fshader a fragment shader program (string)
         * @return {WebGLProgram} created program object, or null if the creation has failed
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

        /**
         * use the given program
         * @param {WebGLProgram} program
         */
        useProgram(program) {
            const gl = this.gl;
            gl.useProgram(program);
            gl.program = program;
            return this;
        }

        /**
         * Enable a sampler, and set texture
         * @param {WebGLSampler} sampler
         * @param {ptr} texture id
         */
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

        _createGLContext(canvas, options) {
            const attributes = {
                'alpha': true,
                'preserveDrawingBuffer' : true,
                'antialias' : false
            };
            const names = ['webgl', 'experimental-webgl'];
            let context = null;
            /* eslint-disable no-empty */
            for (let i = 0; i < names.length; ++i) {
                try {
                    context = canvas.getContext(names[i], options || attributes);
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
    };

    extend(renderable.prototype, {
        copy12: function () {
            const m = Browser.ie9 ? null : new Float32Array(12);
            return function (arr) {
                return mat4.copy(m, arr);
            };
        }(),

        copy16: function () {
            const m = Browser.ie9 ? null : new Float32Array(16);
            return function (arr) {
                return mat4.copy(m, arr);
            };
        }()
    });

    return renderable;
};

export default ImageGLRenderable;


