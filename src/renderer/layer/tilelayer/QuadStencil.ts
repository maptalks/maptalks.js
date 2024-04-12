import { createProgram, enableVertexAttrib } from '../../../core/util/gl';
import { TileRenderingContext, TileRenderingProgram, VertexAttrib } from '../../types';

const quadVertices = typeof Int8Array !== 'undefined' ? new Int8Array([
    // positions
    -1,  1, 0,
    -1, -1, 0,
    1,  1, 0,
    1, -1, 0,
]) : [];

const vert: string = `
    attribute vec3 a_position;
    uniform mat4 transform;

    void main()
    {
        gl_Position = transform * vec4(a_position, 1.0);
    }
`;

const frag: string = `
    precision mediump float;
    uniform vec3 color;
    void main()
    {
        gl_FragColor = vec4(color, 1.0);
    }
`;

class QuadStencil {
    gl: TileRenderingContext;
    quadVertices: any;
    attributes: VertexAttrib;
    debug: boolean;
    buffer: any;

    program: TileRenderingProgram;
    _savedProgram: TileRenderingProgram;
    colorLoc: WebGLUniformLocation;
    transformLoc: WebGLUniformLocation;

    ref: GLint;

    constructor(gl: TileRenderingContext, vertices: any[] | Int8Array, debug?: boolean) {
        this.gl = gl;
        this.quadVertices = vertices || quadVertices;
        this.attributes = ['a_position', 3, getType(vertices)];
        this.debug = debug;
    }

    start() {
        const gl = this.gl;
        gl.enable(gl.STENCIL_TEST);
        gl.stencilMask(0xFF);
        gl.stencilOp(gl.KEEP, gl.REPLACE, gl.REPLACE);
        gl.depthMask(false);
        this._save();
        if (!this.buffer) {
            this._createBuffer();
            this._createProgram();
        }
        gl.useProgram(this.program);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        enableVertexAttrib(gl, this.program, this.attributes);
        if (!this.transformLoc) {
            this.transformLoc = gl.getUniformLocation(this.program, 'transform');
        }
        if (!this.colorLoc) {
            this.colorLoc = gl.getUniformLocation(this.program, 'color');
        }
        if (this.debug) {
            return;
        }
        gl.colorMask(false, false, false, false);
    }

    end(): void {
        const gl = this.gl;
        gl.depthMask(true);
        this._restore();
        if (this.debug) {
            return;
        }
        gl.colorMask(true, true, true, true);
    }

    draw(transform: number[]): void {
        const gl = this.gl;
        gl.uniformMatrix4fv(this.transformLoc, false, transform);
        gl.uniform3fv(this.colorLoc, [Math.random(), Math.random(), Math.random()]);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
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

    stencilMask(mask: number) {
        this.gl.stencilMask(mask);
        return this;
    }

    stencilFunc(func: number, ref: number, mask: number) {
        this.ref = ref;
        this.gl.stencilFunc(func, ref, mask);
        return this;
    }

    stencilOp(fail: number, zfail: number, zpass: number) {
        this.gl.stencilOp(fail, zfail, zpass);
        return this;
    }

    resetFunc() {
        this.ref = 1;
        this.gl.stencilFunc(this.gl.ALWAYS, 1, 0xFF);
        return this;
    }

    _save() {
        const gl = this.gl;
        this._savedProgram = gl.program;
    }

    _restore() {
        const gl = this.gl;
        gl.program = this._savedProgram;
        if (gl.program) {
            gl.useProgram(gl.program);
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

function getType(arr: any) {
    if (arr instanceof Float32Array) {
        return 'FLOAT';
    } else if (arr instanceof Int16Array) {
        return 'SHORT';
    } else if (arr instanceof Uint16Array) {
        return 'UNSIGNED_SHORT';
    } else if (arr instanceof Int8Array) {
        return 'BYTE';
    } else if (arr instanceof Uint8Array || arr instanceof Uint8ClampedArray) {
        return 'UNSIGNED_BYTE';
    }
    return 'FLOAT';
}
