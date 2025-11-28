import { extend, isString, isFunction, isNumber, isSupportVAO, hasOwn, hashCode } from '../common/Util.js';

import ShaderLib from '../shaderlib/ShaderLib.js';
import WgslShaderLib from '../shaderlib/WgslShaderLib';
import { KEY_DISPOSED } from '../common/Constants.js';
import { ShaderUniformValue } from '../types/typings';
import PipelineDescriptor from '../webgpu/common/PipelineDesc';
import InstancedMesh from '../InstancedMesh';
import Mesh from '../Mesh';
import DynamicBuffer from '../webgpu/DynamicBuffer';
import CommandBuilder from '../webgpu/CommandBuilder';
import GraphicsDevice from '../webgpu/GraphicsDevice';
import GraphicsFramebuffer from '../webgpu/GraphicsFramebuffer';
import DynamicOffsets from '../webgpu/DynamicOffsets';


const UNIFORM_TYPE = {
    function : 'function',
    array : 'array'
};

let uid = 0;

const activeVarsCache = {};

export class GLShader {
    vert: string;
    frag: string;
    wgslVert: string;
    wgslFrag: string;
    uid: number;
    version: number;
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
    name: string;

    constructor({ vert, frag, wgslVert, wgslFrag, uniforms, defines, extraCommandProps, name }) {
        this.name = name;
        this.vert = vert;
        this.frag = frag;
        this.wgslVert = wgslVert;
        this.wgslFrag = wgslFrag;
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

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    run(regl: any, command, props) {
        return command(props);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    getShaderCommandKey(device, mesh, uniformValues) {
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

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    createMeshCommand(regl, mesh, commandProps = {}, _uniformValues?) {
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
        if (this.vert) {
            this.vert = ShaderLib.compile(this.vert);
        }
        if (this.frag) {
            this.frag = ShaderLib.compile(this.frag);
        }
    }
}

function parseArrayName(p) {
    const l = p.indexOf('['), r = p.indexOf(']');
    const name = p.substring(0, l), len = +p.substring(l + 1, r);
    return { name, len };
}

const pipelineDesc = new PipelineDescriptor();

export default class GPUShader extends GLShader {
    //@internal
    gpuCommands: any[];
    //@internal
    isGPU: boolean;
    //@internal
    _presentationFormat: GPUTextureFormat;
    //@internal
    _buffers: Record<string, DynamicBuffer>;
    //@internal
    _passEncoders: Record<string, GPURenderPassEncoder>;
    //@internal
    _currentPassEncoder: GPURenderPassEncoder
    //@internal
    _gpuFramebuffer: GraphicsFramebuffer;
    //@internal
    _dynamicOffsets: DynamicOffsets;
    //@internal
    _shaderDynamicOffsets: DynamicOffsets;

    getShaderCommandKey(device, mesh, renderProps) {
        if (device && device.wgpu) {
            // 获取pipeline所需要的特征变量，即任何变量发生变化后，就需要创建新的pipeline
            const fnValues = mesh.getShaderFnValues(this.uid);
            if (fnValues) {
                const { funcs, key, commandKey } = fnValues;
                if (!funcs.length) {
                    return commandKey;
                }
                const values = funcs.map(func => func(null, renderProps));
                const currentKey = pipelineDesc.generateValuesKey(values);
                if (currentKey === key) {
                    return commandKey;
                }
            }
            const fbo = this._gpuFramebuffer;
            const commandProps = this.extraCommandProps;
            pipelineDesc.readFromREGLCommand(commandProps, mesh, renderProps, fbo);
            const commandKey = pipelineDesc.getSignatureKey();
            mesh.setShaderFnValues(this.uid, {
                funcs: pipelineDesc.functionProps.map(item => item.func),
                key: pipelineDesc.getFnValuesKey(),
                commandKey
            })
            return commandKey;
        } else {
            // regl
            return super.getShaderCommandKey(device, mesh, renderProps);
        }
    }

    createMeshCommand(device: any, mesh: Mesh, commandProps: any, renderProps: any) {
        if (device && device.wgpu) {
            // 生成期：
            // 1. 负责对 wgsl 做预处理，生成最终执行的wgsl代码
            // 2. 解析wgsl，生成 bind group mapping 信息，用于运行时，mesh生成bind group
            // 3. 解析wgsl，获得全局 uniform 变量名和类型
            // 4. 生成 layout 和 pipeline

            // preprocess vert and frag codes
            const uniformValues = this.context;
            const fbo = this._gpuFramebuffer;
            // 不同于glsl，因为不支持预处理指令，wgsl需要在创建command时编译源代码
            const defines = extend({}, this.shaderDefines || {}, mesh.getDefines());
            const { vert, frag } = this._compileWGSLSource(defines);

            const builder = new CommandBuilder(this.name, device, vert, frag, mesh, this.contextDesc, defines, uniformValues);
            const pipelineDesc = new PipelineDescriptor();
            const extraCommandProps = extend({}, this.extraCommandProps || {}, commandProps || {});
            pipelineDesc.readFromREGLCommand(extraCommandProps, mesh, renderProps, fbo);
            const command = builder.build(pipelineDesc, fbo);
            command.uid = this.uid;
            return command;
        } else {
            // regl
            return super.createMeshCommand(device, mesh, commandProps);
        }
    }

    _compileWGSLSource(defines) {
        const vert = WgslShaderLib.compile(this.wgslVert, defines);
        let frag;
        if (this.wgslFrag) {
            frag = WgslShaderLib.compile(this.wgslFrag, defines);
        }
        return { vert, frag };
    }

    run(deviceOrRegl: any, command, props) {
        if (!deviceOrRegl.wgpu) {
            // regl command
            return super.run(deviceOrRegl, command, props);
        }
        if (!props || !props.length) {
            return;
        }
        // const shaderUniforms = this.context;
        const device = deviceOrRegl as GraphicsDevice;
        this.isGPU = true;
        const buffersPool = device.dynamicBufferPool;
        const passEncoder: GPURenderPassEncoder = this._getCurrentRenderPassEncoder(device);
        passEncoder.setPipeline(command.pipeline);

        const { uid, bindGroupFormat, vertexInfo, layout } = command;
        // 1. 生成shader uniform 需要的dynamic buffer
        if (!this._buffers) {
            this._buffers = {};
        }
        let shaderBuffer = this._buffers[uid] as DynamicBuffer;
        if (!shaderBuffer) {
            shaderBuffer = this._buffers[uid] = new DynamicBuffer(bindGroupFormat.getShaderUniforms(), buffersPool);
        }

        if (!this._dynamicOffsets) {
            this._dynamicOffsets = new DynamicOffsets();
        }
        if (!this._shaderDynamicOffsets) {
            this._shaderDynamicOffsets = new DynamicOffsets();
        }
        this._shaderDynamicOffsets.reset();
        // 向buffer中填入shader uniform值
        shaderBuffer.writeBuffer(props[0], this._shaderDynamicOffsets);
        const shaderDynamicOffsets = this._shaderDynamicOffsets.getItems();

        for (let i = 0; i < props.length; i++) {
            this._dynamicOffsets.reset();
            const mesh = props[i].meshObject as Mesh;
            // 获取mesh的dynamicBuffer
            const meshBuffer = mesh.writeDynamicBuffer(uid, props[i], bindGroupFormat.getMeshUniforms(), buffersPool, this._dynamicOffsets);
            const groupKey = bindGroupFormat.uuid + '-' + meshBuffer.version + '-' + shaderBuffer.version;
            // 获取或者生成bind group
            let bindGroup = mesh.getBindGroup(groupKey);
            if (!bindGroup || (bindGroup as any).outdated) {
                bindGroup = bindGroupFormat.createBindGroup(device, mesh, props[i], layout, shaderBuffer, meshBuffer);
                // 缓存bind group，只要buffer没有发生变化，即可以重用
                mesh.setBindGroup(groupKey, bindGroup);
            }

            // 获取 dynamicOffsets
            this._dynamicOffsets.addItems(shaderDynamicOffsets);
            const dynamicOffsets = this._dynamicOffsets.getDynamicOffsets();
            passEncoder.setBindGroup(0, bindGroup, dynamicOffsets);

            let instancedMesh;
            if (mesh instanceof InstancedMesh) {
                instancedMesh = mesh as InstancedMesh;
            }
            for (const name in vertexInfo) {
                const vertex = vertexInfo[name];
                let vertexBuffer = mesh.geometry.getBuffer(vertex.geoAttrName || name);
                if (!vertexBuffer && instancedMesh) {
                    vertexBuffer = instancedMesh.getInstancedBuffer(name);
                }
                passEncoder.setVertexBuffer(vertex.location, vertexBuffer, 0, vertexBuffer.byteLength);
            }

            const elements = mesh.getElements();
            const drawOffset = mesh.geometry.getDrawOffset();
            const drawCount = mesh.geometry.getDrawCount();
            let instanceCount = 1;
            if (instancedMesh) {
                instanceCount = instancedMesh.instanceCount;
            }
            if (mesh.geometry.isIndexedElements()) {
                passEncoder.setIndexBuffer(elements, elements.itemType);
                passEncoder.drawIndexed(drawCount, instanceCount, drawOffset);
            } else {
                passEncoder.draw(drawCount, instanceCount, drawOffset);
            }
            device.incrDrawCall();
        }
        passEncoder.end();
    }

    _getCurrentRenderPassEncoder(device: GraphicsDevice) {
        // stencilLoadOp?: GPULoadOp,
        // stencilClearValue?: number,
        // colorLoadOp?: GPULoadOp,
        // depthLoadOp?: GPULoadOp
        return device.getRenderPassEncoder(this._gpuFramebuffer);
    }

    setFramebuffer(framebuffer) {
        if (!framebuffer) {
            if (this._gpuFramebuffer) {
                this._gpuFramebuffer = null;
                return this;
            }
            return super.setFramebuffer(framebuffer);
        }
        if (!framebuffer.getRenderPassDescriptor) {
            return super.setFramebuffer(framebuffer);
        }
        this._gpuFramebuffer = framebuffer;
        return this;
    }

    dispose() {
        if (!this.isGPU) {
            super.dispose();
            return;
        }
        for (const key in this._buffers) {
            if (this._buffers[key]) {
                this._buffers[key].dispose();
            }
        }
        const commands = this.gpuCommands;
        if (!commands) {
            return;
        }
        for (let i = 0; i < commands.length; i++) {
            if (!commands[i]) {
                continue;
            }
            if (commands[i].bindGroupFormat) {
                commands[i].bindGroupFormat.dispose();
            }
        }
    }
}

