import { createProgram, enableVertexAttrib } from '../../../core/util/gl';

const quadVertices = new Float32Array([
    // positions
    -1,  1, 0,
    -1, -1, 0,
    1,  1, 0,
    1, -1, 0,
]);

const attributes = ['a_position', 3];

const vert = `
    attribute vec3 a_position;
    uniform mat4 transform;

    void main()
    {
        gl_Position = transform * vec4(a_position, 1.0);
    }
`;

const frag = `
    precision mediump float;
    uniform vec3 color;
    void main()
    {
        gl_FragColor = vec4(color, 1.0);
    }
`;

class QuadStencil {
    constructor(gl, vertices, debug) {
        this.gl = gl;
        this.quadVertices = vertices || quadVertices;
        this.debug = debug;
    }

    start() {
        if (this.debug) {
            return;
        }
        const gl = this.gl;
        gl.colorMask(false, false, false, false);
        this.depthTest = gl.isEnabled(gl.DEPTH_TEST);
        if (this.depthTest) {
            gl.depthMask(false);
            gl.disable(gl.DEPTH_TEST);
        }
        gl.enable(gl.STENCIL_TEST);
        gl.stencilMask(0xFF);
    }

    end() {
        if (this.debug) {
            return;
        }
        const gl = this.gl;
        gl.stencilMask(0x00);
        gl.colorMask(true, true, true, true);
        if (this.depthTest) {
            gl.depthMask(true);
            gl.enable(gl.DEPTH_TEST);
        }
    }

    draw(transform) {
        if (!this.buffer) {
            this._createBuffer();
            this._createProgram();
        }
        const gl = this.gl;
        this._save();
        gl.useProgram(this.program);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        enableVertexAttrib(gl, this.program, attributes);
        if (!this.transformLoc) {
            this.transformLoc = gl.getUniformLocation(this.program, 'transform');
        }
        gl.uniformMatrix4fv(this.transformLoc, false, transform);
        if (!this.colorLoc) {
            this.colorLoc = gl.getUniformLocation(this.program, 'color');
        }
        gl.uniform3fv(this.colorLoc, [Math.random(), Math.random(), Math.random()]);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        this._restore();
    }

    remove() {
        const gl = this.gl;
        if (this.buffer) {
            gl.deleteBuffer(this.buffer);
        }
        if (this.program) {
            gl.deleteShader(this.program.fragmentShader);
            gl.deleteShader(this.program.vertexShader);
            gl.deleteProgram(this.program);
        }
        delete this.transformLoc;
        delete this.gl;
        return this;
    }

    stencilMask(mask) {
        if (this.debug) {
            return this;
        }
        this.gl.stencilMask(mask);
        return this;
    }

    stencilFunc(func, ref, mask) {
        if (this.debug) {
            return this;
        }
        this.gl.stencilFunc(func, ref, mask);
        return this;
    }

    stencilOp(fail, zfail, zpass) {
        if (this.debug) {
            return this;
        }
        this.gl.stencilOp(fail, zfail, zpass);
        return this;
    }

    resetFunc() {
        if (this.debug) {
            return this;
        }
        this.gl.stencilFunc(this.gl.ALWAYS, 1, 0xFF);
        return this;
    }

    _save() {
        this._savedProgram = this.gl.program;
        const gl = this.gl;
        if (gl.isEnabled(gl.CULL_FACE)) {
            this._culling = true;
            gl.disable(gl.CULL_FACE);
        }
    }

    _restore() {
        const gl = this.gl;
        gl.program = this._savedProgram;
        if (gl.program) {
            gl.useProgram(gl.program);
        }
        if (this._culling) {
            gl.enable(gl.CULL_FACE);
            delete this._culling;
        }
    }

    _createBuffer() {
        const gl = this.gl;
        this.buffer = gl.createBuffer();
        if (!this.buffer) {
            throw new Error('Failed to create the buffer object');
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.quadVertices, gl.STATIC_DRAW);
    }

    _createProgram() {
        const { program, vertexShader, fragmentShader }  = createProgram(this.gl, vert, frag);
        program.vertexShader = vertexShader;
        program.fragmentShader = fragmentShader;
        this.program = program;
    }

}

export default QuadStencil;
