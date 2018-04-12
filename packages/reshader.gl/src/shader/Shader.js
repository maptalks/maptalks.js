import { extend, isNumber, isFunction } from '../common/Util.js';

class Shader {
    constructor(vert, frag, context, shaderDefines, extraCommandProps) {
        this.vert = vert;
        this.frag = frag;
        //defines besides meshes : lights, etc
        this.shaderDefines = shaderDefines || {};

        context = context || [];
        this.context = {};
        for (let i = 0, l = context.length; i < l; i++) {
            const p = context[i];
            this.context[p] = null;
        }

        this.extraCommandProps = extraCommandProps || {};
        this.commands = {};
    }

    /**
     * The framebuffer object to render to
     * Set to null to render to default display
     * @param {REGLFramebuffer} frameBuffer
     */
    setFrameBuffer(frameBuffer) {
        this.context.frameBuffer = frameBuffer;
        return this;
    }

    /**
     * Set or get context uniform to or from the shader
     * @param {String} k - key
     * @param {Any} v - value
     * @returns {Any}
     */
    contextUniform(k, v) {
        this.context[k] = v;
        return this;
    }

    createREGLCommand(regl, materialDefines, attrProps, uniProps, elements) {
        const defines = extend({}, this.shaderDefines || {}, materialDefines || {});
        const vert = this._insertDefines(this.vert, defines);
        const frag = this._insertDefines(this.frag, defines);
        const attributes = {};
        for (const p of attrProps) {
            attributes[p] = regl.prop(p);
        }
        const uniforms = {};
        for (const p of uniProps) {
            uniforms[p] = regl.prop(p);
        }

        const context = this.context;
        for (const p in context) {
            uniforms[p] = regl.prop(p);
        }

        const command = {
            vert, frag, uniforms, attributes
        };
        if (isNumber(elements)) {
            command.count = regl.prop('elements');
        } else {
            command.elements = regl.prop('elements');
        }
        command.framebuffer = regl.prop('framebuffer');
        command.cull = {
            enable: true,
            face: 'back'
        };
        extend(command, this.extraCommandProps);
        return regl(command);
    }

    dispose() {
        //TODO dispose the shader
    }

    _insertDefines(source, defines) {
        const defineHeaders = [];
        for (const p in defines) {
            if (defines.hasOwnProperty(p) && !isFunction(defines[p])) {
                defineHeaders.push(`#define ${p} ${defines[p]}\n`);
            }
        }
        return defineHeaders.join('') + source;
    }
}

export default Shader;
