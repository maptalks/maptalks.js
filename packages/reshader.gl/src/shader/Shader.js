import { extend, isNumber, isString, isFunction } from '../common/Util.js';
import ShaderLib from './ShaderLib.js';

const TYPE_FUNC = 'function';

class Shader {
    constructor({ vert, frag, uniforms, defines, includes, extraCommandProps }) {
        this.vert = vert;
        this.frag = frag;
        //defines besides meshes : lights, etc
        this.shaderDefines = defines || {};

        const context = uniforms || [];
        this.context = {};
        for (let i = 0, l = context.length; i < l; i++) {
            const p = context[i];
            if (isString(p)) {
                this.context[p] = null;
            } else {
                // e.g.
                // {
                //     name : 'foo',
                //     type : 'function',
                //     fn : (context, props) => { ... }
                // }
                this.context[p.name] = p;
            }
        }
        if (includes) {
            this._insertIncludes(includes);
        }
        this.extraCommandProps = extraCommandProps || {};
        this.commands = {};
        this._compileSource();
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
        uniProps = uniProps || {};
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
            if (context[p] && context[p].type === TYPE_FUNC) {
                uniforms[p] = context[p]['fn'];
            } else {
                uniforms[p] = regl.prop(p);
            }
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

    _insertIncludes(includes) {
        const vertIncludes = includes['vert'],
            fragIncludes = includes['frag'];
        if (vertIncludes) {
            // const includes = vertIncludes.map(inc => `#include <${inc}>\n`);
            this.vert = vertIncludes + '\n' + this.vert;
        }
        if (fragIncludes) {
            // const includes = fragIncludes.map(inc => `#include <${inc}>\n`);
            this.frag = fragIncludes + '\n' + this.frag;
        }
    }

    _compileSource() {
        this.vert = ShaderLib.compile(this.vert);
        this.frag = ShaderLib.compile(this.frag);
    }
}

export default Shader;
