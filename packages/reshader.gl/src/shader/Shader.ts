import { extend, isString, isFunction, isNumber, isSupportVAO, hasOwn, hashCode } from '../common/Util.js';

import ShaderLib from '../shaderlib/ShaderLib.js';
import { KEY_DISPOSED } from '../common/Constants.js';
import { ShaderUniformValue } from '../types/typings';
import PipelineDescriptor from '../webgpu/common/PipelineDesc';
import InstancedMesh from '../InstancedMesh';
import Mesh, { GPUMesh } from '../Mesh';
import DynamicBuffer from '../webgpu/DynamicBuffer';
import CommandBuilder from '../webgpu/CommandBuilder';
import GraphicsDevice from '../webgpu/GraphicsDevice';


const UNIFORM_TYPE = {
    function : 'function',
    array : 'array'
};

let uid = 0;

const activeVarsCache = {};

export class AbstractShader {
    vert: string;
    frag: string;
    uid: number;
    //@internal
    uniforms: ShaderUniformValue[];
    //@internal
    contextDesc: Record<string, any>;
    extraCommandProps: any;
    //@internal
    commands: any;
    //@internal
    _shaderDefines: Record<string, string | number>;
    //@internal
    dkey: string;
    //@internal
    context: any;
    //@internal
    contextKeys: string;

    constructor({ vert, frag, uniforms, defines, extraCommandProps }) {
        this.vert = vert;
        this.frag = frag;
        const shaderId = uid++;
        Object.defineProperty(this, 'uid', {
            enumerable: true,
            configurable: false,
            get: () => {
                return shaderId;
            }
        });
        //defines besides meshes : lights, etc
        this.shaderDefines = defines && extend({}, defines) || {};

        uniforms = this.uniforms = (uniforms || []).slice();
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
        this.extraCommandProps = extraCommandProps && extend({}, extraCommandProps) || {};
        this.commands = {};
        this._compileSource();
    }

    set shaderDefines(defines) {
        this._shaderDefines = defines;
        this.dkey = Object.keys(this._shaderDefines).join();
    }

    get shaderDefines() {
        return this._shaderDefines || {};
    }

    setDefines(defines) {
        this.shaderDefines = defines;
    }

    /**
     * The framebuffer object to render to
     * Set to null to render to default display
     * @param framebuffer
     */
    setFramebuffer(framebuffer) {
        this.context.framebuffer = framebuffer;
        return this;
    }

    /**
     * Get shader's context uniforms values
     * @param {Object} meshProps - mesh uniforms
     */
    appendDescUniforms(regl, meshProps) {
        // const context = this.context;
        //TODO 这里以前是extend2，需要明确改用extend后是否会有bug
        // const props = extend(meshProps, context);
        const uniforms = meshProps;
        const desc = this.contextDesc;
        for (const p in desc) {
            if (!desc[p]) {
                continue;
            }
            if (desc[p].type === 'array') {
                //an array uniform's value
                const name = p, len = desc[p].length;
                // change uniform value to the following form as regl requires:
                // foo[0]: 'value'
                // foo[1]: 'value'
                // foo[2]: 'value'
                let values = meshProps[p];
                if (desc[p].fn) {
                    // an array function
                    values = desc[p].fn(null, meshProps);
                }
                if (!values) {
                    continue;
                }
                if (values.length !== len) {
                    throw new Error(`${name} uniform's length is not ${len}`);
                }
                uniforms[name] = uniforms[name] || {};
                for (let i = 0; i < len; i++) {
                    uniforms[name][`${i}`] = values[i].getREGLTexture ? values[i].getREGLTexture(regl) : values[i];
                }
            } else if (desc[p].type === 'function') {
                if (!Object.getOwnPropertyDescriptor(uniforms, p)) {
                    Object.defineProperty(uniforms, p, {
                        configurable: false,
                        enumerable: true,
                        get: function () {
                            return desc[p].fn(null, meshProps);
                        }
                    });
                }

            }
        }

        return uniforms;
    }

    /**
     * Set or get context uniform to or from the shader
     * @returns {this}
     */
    setUniforms(uniforms) {
        if (uniforms['modelMatrix'] || uniforms['positionMatrix']) {
            throw new Error('modelMatrix or positionMatrix is reserved uniform name for Mesh, please change to another name');
        }
        this.contextKeys = uniforms ? Object.keys(uniforms).join() : null;
        this.context = uniforms;
        return this;
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

const pipelineDesc = new PipelineDescriptor();

export class GPUShader extends AbstractShader {
    gpuCommands: any[];
    //@internal
    _presentationFormat: GPUTextureFormat;
    _bindGroupCache: Record<string, GPUBindGroup>;
    _buffers: Record<string, DynamicBuffer>;

    getShaderCommandKey(mesh, uniformValues, doubleSided) {
        // 获取pipeline所需要的特征变量，即任何变量发生变化后，就需要创建新的pipeline
        const commandProps = this.extraCommandProps;
        pipelineDesc.readFromREGLCommand(commandProps, mesh, uniformValues, doubleSided);
        return pipelineDesc.getSignatureKey();
    }

    createMeshCommand(device: GPUDevice, mesh: Mesh) {
        // 生成期：
        // 1. 负责对 wgsl 做预处理，生成最终执行的wgsl代码
        // 2. 解析wgsl，生成 bind group mapping 信息，用于运行时，mesh生成bind group
        // 3. 解析wgsl，获得全局 uniform 变量名和类型
        // 4. 生成 layout 和 pipeline

        // preprocess vert and frag codes
        const builder = new CommandBuilder(device, this.vert, this.frag, mesh)
        return builder.build(pipelineDesc);
    }

    run(device: GraphicsDevice, command, shaderUniforms, props, context) {
        const buffersPool = device.dynamicBufferPool;
        const passEncoder: GPURenderPassEncoder = context.passEncoder;
        passEncoder.setPipeline(command.pipeline);

        const { key, bindGroupFormat, pipeline, vertexInfo } = command;
        const layout = pipeline.getBindGroupLayout(0);
        // 1. 生成shader uniform 需要的dynamic buffer
        let shaderBuffer = this._buffers[key] as DynamicBuffer;
        if (shaderBuffer) {
            shaderBuffer = this._buffers[key] = new DynamicBuffer(bindGroupFormat.getShaderUniforms(), buffersPool);
        }
        // 向buffer中填入shader uniform值
        shaderBuffer.writeBuffer(shaderUniforms);
        for (let i = 0; i < props.length; i++) {
            const mesh = props[i].meshObject as GPUMesh;
            // 获取mesh的dynamicBuffer
            const meshBuffer = mesh.writeDynamicBuffer(props[i], bindGroupFormat.getMeshUniforms(), buffersPool);
            const groupKey = meshBuffer.version + '-' + shaderBuffer.version;
            // 获取或者生成bind group
            let bindGroup = this._bindGroupCache[groupKey];
            if (!bindGroup) {
                bindGroup = bindGroupFormat.createBindGroup(device, mesh, layout, shaderBuffer, meshBuffer);
                // 缓存bind group，只要buffer没有发生变化，即可以重用
                // TODO 可以考虑每帧开始把缓存 bind group 标记为 retire，每帧结束时把不是 current 的 bind group 销毁掉
                this._bindGroupCache[groupKey] = bindGroup;
            }

            // 获取 dynamicOffsets
            const dynamicOffsets = shaderBuffer.dynamicOffsets.concat(meshBuffer.dynamicOffsets);
            passEncoder.setBindGroup(0, bindGroup, dynamicOffsets);

            for (const vertex of vertexInfo) {
                const vertexBuffer = mesh.geometry.getVertexBuffer(vertex.name);
                passEncoder.setVertexBuffer(vertex.index, vertexBuffer);
            }

            //TODO InstancedMesh 的参数
            const elements = mesh.getElements();
            const drawOffset = mesh.geometry.getDrawOffset();
            const drawCount = mesh.geometry.getDrawCount();
            if (isNumber(elements)) {
                passEncoder.draw(drawCount, 1, drawOffset);
            } else {
                passEncoder.setIndexBuffer(elements.getBuffer(), elements.getFormat());
                passEncoder.drawIndexed(drawCount, 1, drawOffset);
            }
        }
        passEncoder.end();
    }

    _deleteCommand(command) {
        if (command.bindGroupFormat) {
            command.bindGroupFormat.dispose();
        }
    }

    dispose() {
        for (const key in this._buffers) {
            if (this._buffers[key]) {
                this._buffers[key].dispose();
            }
        }
        const commands = this.gpuCommands;
        for (let i = 0; i < commands.length; i++) {
            if (!commands[i]) {
                continue;
            }
            this._deleteCommand(commands[i]);
        }
    }
}

export default class Shader extends AbstractShader {
    version: number;

    run(command, props) {
        return command(props);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    getShaderCommandKey() {
        return this.dkey || 'default';
    }

    getVersion(regl, source) {
        const versionDefined = source.substring(0, 8) === '#version';
        if (versionDefined) {
            return '';
        }
        const isWebGL2 = regl.limits['version'].indexOf('WebGL 2.0') === 0;
        if (isWebGL2 && this.version === 300) {
            return '#version 300 es\n';
        } else {
            return '#version 100\n';
        }
    }

    getActiveVars(regl, vert, frag, hash) {
        const cacheKey = hash;
        if (activeVarsCache[cacheKey]) {
            return activeVarsCache[cacheKey];
        }
        const gl = regl['_gl'];
        const program = gl.createProgram();

        const vertShader = gl.createShader(35633);
        gl.shaderSource(vertShader, vert);
        gl.compileShader(vertShader);

        const fragShader = gl.createShader(35632);
        gl.shaderSource(fragShader, frag);
        gl.compileShader(fragShader);

        gl.attachShader(program, fragShader);
        gl.attachShader(program, vertShader);
        gl.linkProgram(program);

        // active attributes
        const numAttributes = gl.getProgramParameter(program, 0x8B89);
        const activeAttributes = [];
        for (let i = 0; i < numAttributes; ++i) {
            const info = gl.getActiveAttrib(program, i);
            if (info) {
                activeAttributes.push({
                    name: info.name,
                    type: info.type
                });
            }
        }

        // active uniforms
        const numUniforms = gl.getProgramParameter(program, 0x8B86);
        const activeUniforms = [];
        for (let i = 0; i < numUniforms; ++i) {
            const uniformInfo = gl.getActiveUniform(program, i);
            let name = uniformInfo.name;
            if (uniformInfo.name.indexOf('[') > 0) {
                name = name.replace('[0]', '');
                // array
                // const { name, len } = parseArrayName(uniformInfo.name.replace('[0]', `[${uniformInfo.size}]`));
                // for (let ii = 0; ii < len; ii++) {
                //     activeUniforms.push(name + `[${ii}]`);
                // }
            }
            activeUniforms.push(name);
        }
        gl.deleteProgram(program);
        gl.deleteShader(vertShader);
        gl.deleteShader(fragShader);

        activeVarsCache[cacheKey] = {
            activeUniforms,
            activeAttributes
        };
        return activeVarsCache[cacheKey];
    }


    _insertDefines(source, defines) {
        const defineHeaders = [];
        for (const p in defines) {
            if (hasOwn(defines, p) && !isFunction(defines[p])) {
                defineHeaders.push(`#define ${p} ${defines[p]}\n`);
            }
        }
        return defineHeaders.join('') + source;
    }

    createMeshCommand(regl, mesh, commandProps = {}) {
        const materialDefines = mesh.getDefines();
        const elements = mesh.getElements();
        const isInstanced = mesh instanceof InstancedMesh;
        const disableVAO = mesh.disableVAO;

        const isVAO = isSupportVAO(regl) && !disableVAO;
        const defines = extend({}, this.shaderDefines || {}, materialDefines || {});
        const vertSource = this._insertDefines(this.vert, defines);
        const vert = this.getVersion(regl, vertSource) + vertSource;
        const fragSource = this._insertDefines(this.frag, defines);
        const frag = this.getVersion(regl, fragSource) + fragSource;
        const vHash = hashCode(vert);
        const fHash = hashCode(frag);
        const hash = vHash + '_' + fHash;
        const { activeAttributes, activeUniforms } = this.getActiveVars(regl, vert, frag, hash);

        const attributes = {};
        activeAttributes.forEach((p, idx) => {
            const name = p.name;
            if (isVAO) {
                attributes[name] = idx;
            } else {
                attributes[name] = regl.prop(name);
            }
        });

        const uniforms = {};
        activeUniforms.forEach(p => {
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

        const command: any = {
            vert, frag, uniforms, attributes
        };
        if (isVAO) {
            command['vao'] = regl.prop('vao');
        }
        if ((!isVAO || isInstanced) && elements && !isNumber(elements)) {
            command.elements = regl.prop('elements');
        }
        command.count = regl.prop('count');
        command.offset = regl.prop('offset');
        command.primitive = regl.prop('primitive');
        command.framebuffer = regl.prop('framebuffer');
        if (isInstanced) {
            command.instances = regl.prop('instances');
        }
        extend(command, this.extraCommandProps, commandProps);
        const reglCommand = regl(command);
        activeAttributes.key = activeAttributes.map(attr => attr.name).join();
        reglCommand.activeAttributes = activeAttributes;
        return reglCommand;
    }

    dispose() {
        for (const p in this.commands) {
            const command = this.commands[p];
            if (!command) {
                continue;
            }
            if (command.destroy && !command[KEY_DISPOSED]) {
                command[KEY_DISPOSED] = true;
                command.destroy();
            }
        }
        this.commands = {};
        delete this.vert;
        delete this.frag;
    }
}

