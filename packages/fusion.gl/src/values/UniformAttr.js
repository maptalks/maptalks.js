import GLContext from "../GLContext";
import { include } from "../Utils";

const nonNaNArray = [];

include(GLContext.prototype, {
    bindAttribLocation(program, index, name) {
        return this._gl.bindAttribLocation(program, index, name);
    },

    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/enableVertexAttribArray
     * @param {GLuint} index
     */
    enableVertexAttribArray(index) {
        this._checkAndRestore();
        if (!this.states.attributes[index]) {
            this.states.attributes[index] = {};
        }
        this.states.attributes[index].enable = true;
        return this._gl.enableVertexAttribArray(index);
    },
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/disableVertexAttribArray
     * @param {GLunit} index
     */
    disableVertexAttribArray(index) {
        this._checkAndRestore();
        if (!this.states.attributes[index]) {
            this.states.attributes[index] = {};
        }
        this.states.attributes[index].enable = false;
        return this._gl.disableVertexAttribArray(index);
    },
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getActiveAttrib
     * @param {GLProgram} program
     * @param {GLuint} index
     */
    getActiveAttrib(program, index) {
        return this._gl.getActiveAttrib(program, index);
    },
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getActiveUniform
     * @param {GLProgram} program
     * @param {GLuint} index
     */
    getActiveUniform(program, index) {
        return this._gl.getActiveUniform(program, index);
    },
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getAttribLocation
     * @modify yellow date 2018/2/3 direction return
     *
     * @param {GLProgram} program
     * @param {String} name
     */
    getAttribLocation(program, name) {
        return this._gl.getAttribLocation(program, name);
    },

    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getUniformLocation
     * @param {GLProgram} program
     * @param {DOMString} name
     */
    getUniformLocation(program, name) {
        return this._gl.getUniformLocation(program, name);
    },
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getVertexAttrib
     * @param {GLuint} index
     * @param {GLenum} pname
     */
    getVertexAttrib(index, pname) {
        this._checkAndRestore();
        return this._gl.getVertexAttrib(index, pname);
    },
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getVertexAttribOffset
     */
    getVertexAttribOffset(index, pname) {
        this._checkAndRestore();
        return this._gl.getVertexAttribOffset(index, pname);
    },

    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/uniformBlockBinding
     */
    uniformBlockBinding(program, uniformBlockIndex, uniformBlockBinding) {
        this._checkAndRestore();
        return this._gl.uniformBlockBinding(
            program,
            uniformBlockIndex,
            uniformBlockBinding
        );
    },

    _ifUniformEquals(location, ...args) {
        const program = this.states.program;
        if (!program) {
            return false;
        }
        let id = location.fid;
        if (id === undefined) {
            id = location.fid = program.fid++;
        }
        const cached = program.cachedUniforms[id];
        if (equalArgs(cached, args)) {
            return true;
        }
        program.cachedUniforms[id] = copyArgs(cached, args);
        return false;
    },

    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/uniformMatrix
     */
    uniformMatrix2fv(location, transpose, value) {
        if (this._ifUniformEquals(location, transpose, value)) {
            return;
        }
        this._checkAndRestore();
        this._gl.uniformMatrix2fv(location, transpose, value);
    },
    uniformMatrix3fv(location, transpose, value) {
        if (this._ifUniformEquals(location, transpose, value)) {
            return;
        }
        this._checkAndRestore();
        this._gl.uniformMatrix3fv(location, transpose, value);
    },
    uniformMatrix4fv(location, transpose, value) {
        if (!location) {
            console.warn('UniformLocation invalid, null value encountered in browser:', navigator.userAgent);
            return;
        }
        value = this._checkMatrix4fvNaN(value);
        if (this._ifUniformEquals(location, transpose, value)) {
            return;
        }
        this._gl.uniformMatrix4fv(location, transpose, value);
    },
    // defense NaN value cause non-finite error when calling uniformMatrix4fv
    _checkMatrix4fvNaN(array) {
        if (!array) {
            return array;
        }
        nonNaNArray[0] = isNaN(array[0]) ? -1E30 : array[0];
        nonNaNArray[1] = isNaN(array[1]) ? -1E30 : array[1];
        nonNaNArray[2] = isNaN(array[2]) ? -1E30 : array[2];
        nonNaNArray[3] = isNaN(array[3]) ? -1E30 : array[3];

        nonNaNArray[4] = isNaN(array[4]) ? -1E30 : array[4];
        nonNaNArray[5] = isNaN(array[5]) ? -1E30 : array[5];
        nonNaNArray[6] = isNaN(array[6]) ? -1E30 : array[6];
        nonNaNArray[7] = isNaN(array[7]) ? -1E30 : array[7];

        nonNaNArray[8] = isNaN(array[8]) ? -1E30 : array[8];
        nonNaNArray[9] = isNaN(array[9]) ? -1E30 : array[9];
        nonNaNArray[10] = isNaN(array[10]) ? -1E30 : array[10];
        nonNaNArray[11] = isNaN(array[11]) ? -1E30 : array[11];

        nonNaNArray[12] = isNaN(array[12]) ? -1E30 : array[12];
        nonNaNArray[13] = isNaN(array[13]) ? -1E30 : array[13];
        nonNaNArray[14] = isNaN(array[14]) ? -1E30 : array[14];
        nonNaNArray[15] = isNaN(array[15]) ? -1E30 : array[15];

        return nonNaNArray;
    },
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/uniform
     */
    uniform1f(location, v) {
        this._checkAndRestore();
        return this._gl.uniform1f(location, v);
    },

    uniform1i(location, v) {
        this._checkAndRestore();
        return this._gl.uniform1i(location, v);
    },
    uniform2f(location, v0, v1) {
        this._checkAndRestore();
        return this._gl.uniform2f(location, v0, v1);
    },

    uniform2i(location, v0, v1) {
        this._checkAndRestore();
        return this._gl.uniform2i(location, v0, v1);
    },

    uniform3f(location, v0, v1, v2) {
        this._checkAndRestore();
        return this._gl.uniform3f(location, v0, v1, v2);
    },
    uniform3i(location, v0, v1, v2) {
        this._checkAndRestore();
        return this._gl.uniform3i(location, v0, v1, v2);
    },
    uniform4f(location, v0, v1, v2, v3) {
        this._checkAndRestore();
        return this._gl.uniform4f(location, v0, v1, v2, v3);
    },
    uniform4i(location, v0, v1, v2, v3) {
        this._checkAndRestore();
        return this._gl.uniform4i(location, v0, v1, v2, v3);
    },
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/uniform
     */
    uniform1ui(location, v0) {
        this._checkAndRestore();
        return this._gl.uniform1ui(location, v0);
    },
    uniform2ui(location, v0, v1) {
        this._checkAndRestore();
        return this._gl.uniform2ui(location, v0, v1);
    },
    uniform3ui(location, v0, v1, v2) {
        this._checkAndRestore();
        return this._gl.uniform3ui(location, v0, v1, v2);
    },
    uniform4ui(location, v0, v1, v2, v3) {
        this._checkAndRestore();
        return this._gl.uniform4ui(location, v0, v1, v2, v3);
    },

    uniform1fv(location, data, srcOffset, srcLength) {
        this._checkAndRestore();
        if (srcLength !== undefined) {
            this._gl.uniform1fv(location, data, srcOffset, srcLength);
        } else if (srcOffset !== undefined) {
            this._gl.uniform1fv(location, data, srcOffset);
        } else {
            this._gl.uniform1fv(location, data);
        }
    },

    uniform2fv(location, data, srcOffset, srcLength) {
        this._checkAndRestore();
        if (srcLength !== undefined) {
            this._gl.uniform2fv(location, data, srcOffset, srcLength);
        } else if (srcOffset !== undefined) {
            this._gl.uniform2fv(location, data, srcOffset);
        } else {
            this._gl.uniform2fv(location, data);
        }
    },

    uniform3fv(location, data, srcOffset, srcLength) {
        this._checkAndRestore();
        if (srcLength !== undefined) {
            this._gl.uniform3fv(location, data, srcOffset, srcLength);
        } else if (srcOffset !== undefined) {
            this._gl.uniform3fv(location, data, srcOffset);
        } else {
            this._gl.uniform3fv(location, data);
        }
    },
    uniform4fv(location, data, srcOffset, srcLength) {
        this._checkAndRestore();
        if (srcLength !== undefined) {
            this._gl.uniform4fv(location, data, srcOffset, srcLength);
        } else if (srcOffset !== undefined) {
            this._gl.uniform4fv(location, data, srcOffset);
        } else {
            this._gl.uniform4fv(location, data);
        }
    },
    uniform1iv(location, data, srcOffset, srcLength) {
        this._checkAndRestore();
        if (srcLength !== undefined) {
            this._gl.uniform1iv(location, data, srcOffset, srcLength);
        } else if (srcOffset !== undefined) {
            this._gl.uniform1iv(location, data, srcOffset);
        } else {
            this._gl.uniform1iv(location, data);
        }
    },
    uniform2iv(location, data, srcOffset, srcLength) {
        this._checkAndRestore();
        if (srcLength !== undefined) {
            this._gl.uniform2iv(location, data, srcOffset, srcLength);
        } else if (srcOffset !== undefined) {
            this._gl.uniform2iv(location, data, srcOffset);
        } else {
            this._gl.uniform2iv(location, data);
        }
    },
    uniform3iv(location, data, srcOffset, srcLength) {
        this._checkAndRestore();
        if (srcLength !== undefined) {
            this._gl.uniform3iv(location, data, srcOffset, srcLength);
        } else if (srcOffset !== undefined) {
            this._gl.uniform3iv(location, data, srcOffset);
        } else {
            this._gl.uniform3iv(location, data);
        }
    },
    uniform4iv(location, data, srcOffset, srcLength) {
        this._checkAndRestore();
        if (srcLength !== undefined) {
            this._gl.uniform4iv(location, data, srcOffset, srcLength);
        } else if (srcOffset !== undefined) {
            this._gl.uniform4iv(location, data, srcOffset);
        } else {
            this._gl.uniform4iv(location, data);
        }
    },

    uniform1uiv(location, data, srcOffset, srcLength) {
        this._checkAndRestore();
        if (srcLength !== undefined) {
            this._gl.uniform1uiv(location, data, srcOffset, srcLength);
        } else if (srcOffset !== undefined) {
            this._gl.uniform1uiv(location, data, srcOffset);
        } else {
            this._gl.uniform1uiv(location, data);
        }
    },

    uniform2uiv(location, data, srcOffset, srcLength) {
        this._checkAndRestore();
        if (srcLength !== undefined) {
            this._gl.uniform2uiv(location, data, srcOffset, srcLength);
        } else if (srcOffset !== undefined) {
            this._gl.uniform2uiv(location, data, srcOffset);
        } else {
            this._gl.uniform2uiv(location, data);
        }
    },

    uniform3uiv(location, data, srcOffset, srcLength) {
        this._checkAndRestore();
        if (srcLength !== undefined) {
            this._gl.uniform3uiv(location, data, srcOffset, srcLength);
        } else if (srcOffset !== undefined) {
            this._gl.uniform3uiv(location, data, srcOffset);
        } else {
            this._gl.uniform3uiv(location, data);
        }
    },
    uniform4uiv(location, data, srcOffset, srcLength) {
        this._checkAndRestore();
        if (srcLength !== undefined) {
            this._gl.uniform4uiv(location, data, srcOffset, srcLength);
        } else if (srcOffset !== undefined) {
            this._gl.uniform4uiv(location, data, srcOffset);
        } else {
            this._gl.uniform4uiv(location, data);
        }
    },

    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/vertexAttrib
     */
    vertexAttrib1f(index, v0) {
        this._checkAndRestore();
        return this._gl.vertexAttrib1f(index, v0);
    },
    vertexAttrib2f(index, v0, v1) {
        this._checkAndRestore();
        return this._gl.vertexAttrib2f(index, v0, v1);
    },
    vertexAttrib3f(location, v0, v1, v2) {
        this._checkAndRestore();
        return this._gl.vertexAttrib3f(location, v0, v1, v2);
    },
    vertexAttrib4f(location, v0, v1, v2, v3) {
        this._checkAndRestore();
        return this._gl.vertexAttrib4f(location, v0, v1, v2, v3);
    },
    vertexAttrib1fv(index, v) {
        this._checkAndRestore();
        return this._gl.vertexAttrib1fv(index, v);
    },
    vertexAttrib2fv(index, v) {
        this._checkAndRestore();
        return this._gl.vertexAttrib2fv(index, v);
    },
    vertexAttrib3fv(index, v) {
        this._checkAndRestore();
        return this._gl.vertexAttrib3fv(index, v);
    },
    vertexAttrib4fv(index, v) {
        this._checkAndRestore();
        return this._gl.vertexAttrib4fv(index, v);
    },
    vertexAttribI4i(index, v0, v1, v2, v3) {
        this._checkAndRestore();
        return this._gl.vertexAttribI4i(index, v0, v1, v2, v3);
    },
    vertexAttribI4ui(index, v0, v1, v2, v3) {
        this._checkAndRestore();
        return this._gl.vertexAttribI4ui(index, v0, v1, v2, v3);
    },
    vertexAttribI4iv(index, value) {
        this._checkAndRestore();
        return this._gl.vertexAttribI4iv(index, value);
    },
    vertexAttribI4uiv(index, value) {
        this._checkAndRestore();
        return this._gl.vertexAttribI4uiv(index, value);
    },
});


function copyArgs(out, args) {
    out = out || new Array(args.length);
    const len = args.length;
    for (let i = 0; i < len; i++) {
        out[i] = args[i].length !== undefined ? copyArr(out[i] || [], args[i]) : args[i];
    }
    return out;
}

function copyArr(out, arr) {
    const len = arr.length;
    for (let i = 0; i < len; i++) {
        out[i] = arr[i];
    }
    return out;
}

function equalArgs(args0, args1) {
    if (!args0) {
        return false;
    }
    const len = args1.length;
    for (let i = 0; i < len; i++) {
        if (!args0[i] || args0[i].length === undefined) {
            if (args0[i] !== args1[i]) {
                return false;
            }
        } else {
            const count = args0[i].length;
            for (let ii = 0; ii < count; ii++) {
                if (args0[i][ii] !== args1[i][ii]) {
                    return false;
                }
            }
        }
    }
    return true;
}

