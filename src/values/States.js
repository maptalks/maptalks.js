import GLContext from '../GLContext';
import { include } from '../Utils';
import equal from 'fast-deep-equal';

const KEY_CONTEXT = '_fusion_context';

include(GLContext.prototype, {
    //states update methods
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/scissor
     */
    scissor(x, y, width, height) {
        this._checkAndRestore();
        const v = this.states.scissor;
        if (v[0] === x && v[1] === y &&
            v[2] === width && v[3] === height) {
            return;
        }
        v[0] = x;
        v[1] = y;
        v[2] = width;
        v[3] = height;
        this._gl.scissor(x, y, width, height);
    },
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/viewport
     */
    viewport(x, y, width, height) {
        this._checkAndRestore();
        const v = this.states.viewport;
        if (v[0] === x && v[1] === y &&
            v[2] === width && v[3] === height) {
            return;
        }
        v[0] = x;
        v[1] = y;
        v[2] = width;
        v[3] = height;
        this._gl.viewport(x, y, width, height);
    },

    blendColor(r, g, b, a) {
        this._checkAndRestore();
        const v = this.states.blendColor;
        if (v[0] === r && v[1] === g &&
            v[2] === b && v[3] === a) {
            return;
        }
        v[0] = r;
        v[1] = g;
        v[2] = b;
        v[3] = a;
        this._gl.blendColor(r, g, b, a);
    },

    blendEquation(mode) {
        this._checkAndRestore();
        const v = this.states.blendEquationSeparate;
        if (v[0] === mode && v[1] === mode) {
            return;
        }
        v[0] = mode;
        v[1] = mode;
        this._gl.blendEquation(mode);
    },

    blendEquationSeparate(modeRGB, modeAlpha) {
        this._checkAndRestore();
        const v = this.states.blendEquationSeparate;
        if (v[0] === modeRGB && v[1] === modeAlpha) {
            return;
        }
        v[0] = modeRGB;
        v[1] = modeAlpha;
        this._gl.blendEquationSeparate(modeRGB, modeAlpha);
    },

    blendFunc(sfactor, dfactor) {
        this._checkAndRestore();
        const v = this.states.blendFuncSeparate;
        if (v[0] === sfactor && v[2] === sfactor &&
            v[1] === dfactor && v[3] === dfactor) {
            return;
        }
        v[0] = sfactor;
        v[1] = sfactor;
        v[2] = dfactor;
        v[3] = dfactor;
        this._gl.blendFunc(sfactor, dfactor);
    },

    blendFuncSeparate(srcRGB, dstRGB, srcAlpha, dstAlpha) {
        this._checkAndRestore();
        const v = this.states.blendFuncSeparate;
        if (v[0] === srcRGB && v[1] === dstRGB &&
            v[2] === srcAlpha && v[3] === dstAlpha) {
            return;
        }
        v[0] = srcRGB;
        v[1] = dstRGB;
        v[2] = srcAlpha;
        v[3] = dstAlpha;
        this._gl.blendFuncSeparate(srcRGB, dstRGB, srcAlpha, dstAlpha);
    },

    clearColor(r, g, b, a) {
        this._checkAndRestore();
        const v = this.states.clearColor;
        if (v[0] === r && v[1] === g &&
            v[2] === b && v[3] === a) {
            return;
        }
        v[0] = r;
        v[1] = g;
        v[2] = b;
        v[3] = a;
        this._gl.clearColor(r, g, b, a);
    },

    clearDepth(depth) {
        this._checkAndRestore();
        const v = this.states.clearDepth;
        if (v[0] === depth) {
            return;
        }
        v[0] = depth;
        this._gl.clearDepth(depth);
    },

    clearStencil(s) {
        this._checkAndRestore();
        const v = this.states.clearStencil;
        if (v[0] === s) {
            return;
        }
        v[0] = s;
        this._gl.clearStencil(s);
    },

    colorMask(r, g, b, a) {
        this._checkAndRestore();
        const v = this.states.colorMask;
        if (v[0] === r && v[1] === g &&
            v[2] === b && v[3] === a) {
            return;
        }
        v[0] = r;
        v[1] = g;
        v[2] = b;
        v[3] = a;
        this._gl.colorMask(r, g, b, a);
    },

    cullFace(mode) {
        this._checkAndRestore();
        const v = this.states.cullFace;
        if (v[0] === mode) {
            return;
        }
        v[0] = mode;
        this._gl.cullFace(mode);
    },

    depthFunc(func) {
        this._checkAndRestore();
        const v = this.states.depthFunc;
        if (v[0] === func) {
            return;
        }
        v[0] = func;
        this._gl.depthFunc(func);
    },

    depthMask(flag) {
        this._checkAndRestore();
        const v = this.states.depthMask;
        if (v[0] === flag) {
            return;
        }
        v[0] = flag;
        this._gl.depthMask(flag);
    },

    depthRange(zNear, zFar) {
        this._checkAndRestore();
        const v = this.states.depthRange;
        if (v[0] === zNear && v[1] === zFar) {
            return;
        }
        v[0] = zNear;
        v[1] = zFar;
        this._gl.depthRange(zNear, zFar);
    },

    disable(cap) {
        this._checkAndRestore();
        const v = this.states.capabilities;
        if (!v[cap]) {
            return;
        }
        v[cap] = false;
        this._gl.disable(cap);
    },

    enable(cap) {
        this._checkAndRestore();
        const v = this.states.capabilities;
        if (v[cap]) {
            return;
        }
        v[cap] = true;
        this._gl.enable(cap);
    },

    frontFace(mode) {
        this._checkAndRestore();
        const v = this.states.frontFace;
        if (v[0] === mode) {
            return;
        }
        v[0] = mode;
        this._gl.frontFace(mode);
    },

    hint(target, mode) {
        this._checkAndRestore();
        const v = this.states.hints;
        if (v[target][0] === mode) {
            return;
        }
        v[target][0] = mode;
        this._gl.hint(target, mode);
    },

    lineWidth(width) {
        this._checkAndRestore();
        const v = this.states.lineWidth;
        if (v[0] === width) {
            return;
        }
        v[0] = width;
        this._gl.lineWidth(width);
    },

    pixelStorei(pname, param) {
        this._checkAndRestore();
        const v = this.states.pixelStorei;
        if (v[pname] === param) {
            return;
        }
        v[pname][0] = param;
        this._gl.pixelStorei(pname, param);
    },

    polygonOffset(factor, units) {
        this._checkAndRestore();
        const v = this.states.polygonOffset;
        if (v[0] === factor && v[1] === units) {
            return;
        }
        v[0] = factor;
        v[1] = units;
        this._gl.polygonOffset(factor, units);
    },

    sampleCoverage(value, invert) {
        this._checkAndRestore();
        const v = this.states.sampleCoverage;
        if (v[0] === value && v[1] === invert) {
            return;
        }
        v[0] = value;
        v[1] = invert;
        this._gl.sampleCoverage(value, invert);
    },

    stencilFunc(func, ref, mask) {
        this._checkAndRestore();
        const v = this.states.stencilFuncSeparate;
        const gl = this._gl;
        if (v[gl.FRONT][0] === func && v[gl.FRONT][1] === ref && v[gl.FRONT][2] === mask &&
            v[gl.BACK][0] === func && v[gl.BACK][1] === ref && v[gl.BACK][2] === mask) {
            return;
        }
        v[gl.FRONT][0] = v[gl.BACK][0] = func;
        v[gl.FRONT][1] = v[gl.BACK][1] = ref;
        v[gl.FRONT][2] = v[gl.BACK][2] = mask;
        this._gl.stencilFunc(func, ref, mask);
    },

    stencilFuncSeparate(face, func, ref, mask) {
        this._checkAndRestore();
        const gl = this._gl;
        if (face === gl.FRONT_AND_BACK) {
            this.stencilFunc(func, ref, mask);
            return;
        }
        const v = this.states.stencilFuncSeparate;
        if (v[face][0] === func &&
            v[face][1] === ref && v[face][2] === mask) {
            return;
        }
        v[face][0] = func;
        v[face][1] = ref;
        v[face][2] = mask;
        this._gl.stencilFuncSeparate(face, func, ref, mask);
    },

    stencilMask(mask) {
        this._checkAndRestore();
        const gl = this._gl;
        const v = this.states.stencilMaskSeparate;
        if (v[gl.FRONT][0] === mask && v[gl.BACK][0] === mask) {
            return;
        }
        v[gl.FRONT][0] = mask;
        v[gl.BACK][0] = mask;
        this._gl.stencilMask(mask);
    },

    stencilMaskSeparate(face, mask) {
        this._checkAndRestore();
        if (face === this._gl.FRONT_AND_BACK) {
            this.stencilMask(mask);
            return;
        }
        const v = this.states.stencilMaskSeparate;
        if (v[face][0] === mask) {
            return;
        }
        v[face][0] = mask;
        this._gl.stencilMaskSeparate(face, mask);
    },

    stencilOp(fail, zfail, zpass) {
        this._checkAndRestore();
        const v = this.states.stencilOpSeparate;
        const gl = this._gl;
        if (v[gl.FRONT][0] === fail && v[gl.FRONT][1] === zfail && v[gl.FRONT][2] === zpass &&
            v[gl.BACK][0] === fail && v[gl.BACK][1] === zfail && v[gl.BACK][2] === zpass) {
            return;
        }
        v[gl.FRONT][0] = v[gl.BACK][0] = fail;
        v[gl.FRONT][1] = v[gl.BACK][1] = zfail;
        v[gl.FRONT][2] = v[gl.BACK][2] = zpass;
        this._gl.stencilOp(fail, zfail, zpass);
    },

    stencilOpSeparate(face, fail, zfail, zpass) {
        this._checkAndRestore();
        if (face === this._gl.FRONT_AND_BACK) {
            this.stencilOp(fail, zfail, zpass);
            return;
        }
        const v = this.states.stencilOpSeparate;
        if (v[face][0] === fail &&
            v[face][1] === zfail && v[face][2] === zpass) {
            return;
        }
        v[face][0] = fail;
        v[face][1] = zfail;
        v[face][2] = zpass;
        this._gl.stencilOpSeparate(face, fail, zfail, zpass);
    },

    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/bindFramebuffer
     */
    bindFramebuffer(target, framebuffer) {
        this._checkAndRestore();
        const v = this.states.framebuffer;
        if (v[target] === framebuffer) {
            return;
        }
        v[target] = framebuffer;
        this._gl.bindFramebuffer(target, framebuffer);
    },

    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/bindRenderbuffer
     */
    bindRenderbuffer(target, renderbuffer) {
        this._checkAndRestore();
        const v = this.states.renderbuffer;
        if (v[target] === renderbuffer) {
            return;
        }
        v[target] = renderbuffer;
        this._gl.bindRenderbuffer(target, renderbuffer);
    },

    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/bindTexture
     */
    bindTexture(target, texture) {
        this._checkAndRestore();
        const v = this.states.textures;
        const active = v.active !== -1 ? v.active - 0x84C0 : -1; //0x84C0 is TEXTURE0
        const activeUnit = v.units[active];
        activeUnit[target] = texture;
        this._gl.bindTexture(target, texture);
    },

    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/activeTexture
     * @param {*} texture
     */
    activeTexture(unit) {
        this._checkAndRestore();
        const gl = this._gl;
        const v = this.states.textures;
        const preActive = v.active;
        v.active = unit;
        gl.activeTexture(unit);
        if (preActive === -1) {
            v.units[unit - 0x84C0][gl.TEXTURE_2D] = v.units[-1][gl.TEXTURE_2D];
            v.units[unit - 0x84C0][gl.TEXTURE_CUBE_MAP] = v.units[-1][gl.TEXTURE_CUBE_MAP];
            v.units[-1][gl.TEXTURE_2D] = null;
            v.units[-1][gl.TEXTURE_CUBE_MAP] = null;
        }
    },

    /**
     * @param {GLProgram} program
     */
    useProgram(program) {
        this._checkAndRestore();
        const v = this.states;
        if (v.program === program) {
            return;
        }
        v.program = program;
        this._gl.useProgram(program);
    },

    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/bindBuffer
     * @param {GLenum} target
     * @param {GLBuffer} buffer
     */
    bindBuffer(target, buffer) {
        this._checkAndRestore();
        const gl = this._gl;
        const v = this.states;
        if (target === gl.ELEMENT_ARRAY_BUFFER) {
            if (v.elementArrayBuffer === buffer) {
                return;
            }
            v.elementArrayBuffer = buffer;
        } else {
            if (v.arrayBuffer === buffer) {
                return;
            }
            v.arrayBuffer = buffer;
        }
        gl.bindBuffer(target, buffer);
    },

    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/vertexAttribPointer
     * @param {*} index
     * @param {*} size
     * @param {*} type
     * @param {*} normalized
     * @param {*} stride
     * @param {*} offset
     */
    vertexAttribPointer(index, size, type, normalized, stride, offset) {
        this._checkAndRestore();
        const args = [index, size, type, normalized, stride, offset];
        this.states.attributes[index] = {
            buffer : this.states.arrayBuffer,
            args
        };
        return this._gl.vertexAttribPointer(index, size, type, normalized, stride, offset);
    },
    //VAO
}, {
    _checkAndRestore() {
        const gl = this._gl;
        if (gl[KEY_CONTEXT] && gl[KEY_CONTEXT] !== this) {
            const preContext = gl[KEY_CONTEXT];
            this._restore(preContext.states);
            gl[KEY_CONTEXT] = this;
        }
        gl[KEY_CONTEXT] = this;
    },


    _restore(preStates) {
        const target = this.states;

        const gl = this._gl;
        for (const p in target) {
            if (p === 'capabilities' || p === 'textures' || p === 'attributes' ||
                p === 'arrayBuffer' || p === 'elementArrayBuffer') {
                continue;
            } else if (p === 'program') {
                if (!gl.isProgram(target.program)) {
                    target.program = null;
                }
                if (target.program !== preStates.program) {
                    gl.useProgram(target.program);
                }
            } else if (p === 'framebuffer') {
                for (const t in target[p]) {
                    if (!gl.isFramebuffer(target[p][t])) {
                        target[p][t] = null;
                    }
                    if (target[p][t] !== preStates[p][t]) {
                        gl.bindFramebuffer(+t, target[p][t]);
                    }
                }
            } else if (p === 'renderbuffer') {
                for (const t in target[p]) {
                    if (!gl.isRenderbuffer(target[p][t])) {
                        target[p][t] = null;
                    }
                    if (target[p][t] !== preStates[p][t]) {
                        gl.bindRenderbuffer(+t, target[p][t]);
                    }
                }
            } else if (!equal(target[p], preStates[p])) {
                if (Array.isArray(preStates[p])) {
                    //execute methods
                    gl[p](...target[p]);
                } else {
                    //methods with multiple targets
                    //such as pixelStorei, stencilFuncSeparate, etc
                    for (const t in target[p]) {
                        if (!equal(target[p][t], preStates[p][t])) {
                            gl[p](+t, ...target[p][t]);
                        }
                    }
                }
            }
        }

        // enable/disable capabilities
        for (const p in target.capabilities) {
            if (target.capabilities[p] !== preStates.capabilities[p]) {
                gl[target.capabilities[p] ? 'enable' : 'disable'](+p);
            }
        }

        //restore textures
        const textures = target.textures,
            preTextures = preStates.textures,
            units = textures.units,
            preUnits = preTextures.units;
        const activeIdx = textures.active - gl.TEXTURE0;
        for (let i = 0; i < units.length; i++) {
            if (i !== activeIdx && (units[i][gl.TEXTURE_2D] !== preUnits[i][gl.TEXTURE_2D] ||
                units[i][gl.TEXTURE_CUBE_MAP] !== preUnits[i][gl.TEXTURE_CUBE_MAP])) {
                gl.activeTexture(gl.TEXTURE0 + i);
                gl.bindTexture(gl.TEXTURE_2D, units[i][gl.TEXTURE_2D]);
                gl.bindTexture(gl.TEXTURE_CUBE_MAP, units[i][gl.TEXTURE_CUBE_MAP]);
            }
        }
        if (textures.active > -1) {
            const activeUnit = units[activeIdx];
            if (activeUnit[gl.TEXTURE_2D] !== preUnits[activeIdx][gl.TEXTURE_2D] ||
                activeUnit[gl.TEXTURE_CUBE_MAP] !== preUnits[activeIdx][gl.TEXTURE_CUBE_MAP]) {
                gl.activeTexture(textures.active);
                gl.bindTexture(gl.TEXTURE_2D, activeUnit[gl.TEXTURE_2D]);
                gl.bindTexture(gl.TEXTURE_CUBE_MAP, activeUnit[gl.TEXTURE_CUBE_MAP]);
            }
        }

        //restore attributes
        const attrs = target.attributes,
            preAttrs = preStates.attributes;
        for (const p in attrs) {
            if (!preAttrs[p] || attrs[p].buffer !== preAttrs[p].buffer ||
                !equal(attrs[p].args, preAttrs[p].args)) {
                if (gl.isBuffer(attrs[p].buffer)) {
                    gl.bindBuffer(gl.ARRAY_BUFFER, attrs[p].buffer);
                    gl.vertexAttribPointer(...attrs[p].args);
                } else {
                    attrs[p].buffer = null;
                }
            }
        }

        //restore array buffer and element array buffer
        if (!gl.isBuffer(target.arrayBuffer)) {
            target.arrayBuffer = null;
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, target.arrayBuffer);

        if (!gl.isBuffer(target.elementArrayBuffer)) {
            target.elementArrayBuffer = null;
        }
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, target.elementArrayBuffer);

    }
});
