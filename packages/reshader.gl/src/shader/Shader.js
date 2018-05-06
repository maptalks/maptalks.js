import { extend, isNumber, isString, isFunction } from '../common/Util.js';
import ShaderLib from '../shaderlib/ShaderLib.js';

const UNIFORM_TYPE = {
    function : 'function',
    array : 'array'
};

class Shader {
    constructor({ vert, frag, uniforms, defines, extraCommandProps }) {
        this.vert = vert;
        this.frag = frag;
        //defines besides meshes : lights, etc
        this.shaderDefines = defines || {};

        const context = uniforms || [];
        this.contextDesc = {};
        for (let i = 0, l = context.length; i < l; i++) {
            const p = context[i];
            if (isString(p)) {
                if (p.indexOf('[') > 0) {
                    // array
                    const l = p.indexOf('['), r = p.indexOf(']');
                    const name = p.substring(0, l), len = +p.substring(l + 1, r);
                    this.contextDesc[name] = { name, type : 'array', length : len };
                } else {
                    this.contextDesc[p] = null;
                }
            } else {
                // e.g.
                // {
                //     name : 'foo',
                //     type : 'function',
                //     fn : (context, props) => { ... }
                // }
                this.contextDesc[p.name] = p;
            }
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
    setFramebuffer(frameBuffer) {
        this.context.framebuffer = frameBuffer;
        return this;
    }

    /**
     * Set or get context uniform to or from the shader
     * @param {String} k - key
     * @param {Any} v - value
     * @returns {Any}
     */
    setUniforms(uniforms) {
        this.context = uniforms;
        const desc = this.contextDesc;
        const extra = {};
        for (const p in uniforms) {
            if (desc[p] && desc[p].type === 'array') {
                //an array uniform's value
                const name = p, len = desc[p].length;
                if (uniforms[p].length !== len) {
                    throw new Error(`${name} uniform's length is not ${len}`);
                }
                // change uniform value to the following form as regl requires:
                // foo : {
                //     0 : 'value',
                //     1 : 'value',
                //     2 : 'value'
                // }
                extra[name] = {};
                for (let i = 0; i < len; i++) {
                    extra[name][`${i}`] = uniforms[p][i];
                }
            }
        }
        extend(this.context, extra);
        return this;
    }

    createREGLCommand(regl, materialDefines, attrProps, uniProps, elements) {
        uniProps = uniProps || [];
        attrProps = attrProps || [];
        const defines = extend({}, this.shaderDefines || {}, materialDefines || {});
        const vert = this._insertDefines(this.vert, defines);
        const frag = this._insertDefines(this.frag, defines);
        const attributes = {};
        attrProps.forEach(p => {
            attributes[p] = regl.prop(p);
        });

        const uniforms = {};
        uniProps.forEach(p => {
            uniforms[p] = regl.prop(p);
        });

        const desc = this.contextDesc;
        for (const p in desc) {
            if (desc[p] && desc[p].type === UNIFORM_TYPE['function']) {
                uniforms[p] = desc[p]['fn'];
            } else if (desc[p] && desc[p].type === UNIFORM_TYPE['array']) {
                // an array uniform
                // split to foo[0], foo[1], .... as regl requires
                // https://github.com/regl-project/regl/issues/258
                const name = desc[p].name,
                    len = desc[p].length;
                for (let i = 0; i < len; i++) {
                    const key = `${name}[${i}]`;
                    uniforms[key] = regl.prop(key);
                }
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
        command.primitive = regl.prop('primitive');
        command.framebuffer = regl.prop('framebuffer');
        extend(command, this.extraCommandProps);
        return regl(command);
    }

    dispose() {
        //TODO dispose the shader and regl commands
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

    _compileSource() {
        this.vert = ShaderLib.compile(this.vert);
        this.frag = ShaderLib.compile(this.frag);
    }
}

export default Shader;
