import { extend, isString, isFunction, isNumber } from '../common/Util.js';
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

        uniforms = uniforms || [];
        this.contextDesc = {};
        for (let i = 0, l = uniforms.length; i < l; i++) {
            const p = uniforms[i];
            if (isString(p)) {
                if (p.indexOf('[') > 0) {
                    // array
                    const { name, len } = parseArrayName(p);
                    this.contextDesc[name] = { name, type : 'array', length : len };
                } else {
                    this.contextDesc[p] = null;
                }
            } else if (p.name.indexOf('[') > 0) {
                // array function
                const { name, len } = parseArrayName(p.name);
                this.contextDesc[name] = { name, type : 'array', length : len, fn : p.fn };
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
     * @param {REGLFramebuffer} framebuffer
     */
    setFramebuffer(framebuffer) {
        this.context.framebuffer = framebuffer;
        return this;
    }

    /**
     * Get shader's context uniforms values
     * @param {Object} meshProps - mesh uniforms
     */
    appendRenderUniforms(meshProps) {
        //append but not extend to save unnecessary object copies
        const context = this.context;
        //TODO 这里以前是extend2，需要明确改用extend后是否会有bug
        const props = extend(meshProps, context);
        const uniforms = props;
        const desc = this.contextDesc;
        for (const p in desc) {
            if (desc[p] && desc[p].type === 'array') {
                //an array uniform's value
                const name = p, len = desc[p].length;
                // change uniform value to the following form as regl requires:
                // foo[0]: 'value'
                // foo[1]: 'value'
                // foo[2]: 'value'
                let values = context[p];
                if (desc[p].fn) {
                    // an array function
                    values = desc[p].fn(context, props);
                }
                if (!values) {
                    continue;
                }
                if (values.length !== len) {
                    throw new Error(`${name} uniform's length is not ${len}`);
                }
                uniforms[name] = uniforms[name] || {};
                for (let i = 0; i < len; i++) {
                    uniforms[name][`${i}`] = values[i];
                }
            }
        }
        return uniforms;
    }

    /**
     * Set or get context uniform to or from the shader
     * @param {String} k - key
     * @param {Any} v - value
     * @returns {Any}
     */
    setUniforms(uniforms) {
        this.context = uniforms;
        return this;
    }

    createREGLCommand(regl, materialDefines, attrProps, uniProps, elements, isInstanced) {
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
        if (elements && !isNumber(elements)) {
            command.elements = regl.prop('elements');
        }
        command.count = regl.prop('count');
        command.offset = regl.prop('offset');
        command.primitive = regl.prop('primitive');
        command.framebuffer = regl.prop('framebuffer');
        if (isInstanced) {
            command.instances = regl.prop('instances');
        }
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

function parseArrayName(p) {
    const l = p.indexOf('['), r = p.indexOf(']');
    const name = p.substring(0, l), len = +p.substring(l + 1, r);
    return { name, len };
}

export default Shader;
