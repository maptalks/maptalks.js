import { WgslReflect } from "wgsl_reflect/wgsl_reflect.module.js";
import BindGroupFormat from '../webgpu/BindGroupFormat';
import Mesh from '../Mesh';
import { ResourceType } from 'wgsl_reflect';
import GraphicsDevice from './GraphicsDevice';
import PipelineDescriptor from './common/PipelineDesc';
import { ActiveAttributes, ShaderDefines, ShaderUniforms } from '../types/typings';
import InstancedMesh from '../InstancedMesh';
import { WGSLParseDefines } from "./common/WGSLParseDefines";
import GraphicsFramebuffer from "./GraphicsFramebuffer";
import Texture2D from "../Texture2D";
import GraphicsTexture from "./GraphicsTexture";
import { extend, isNil } from "../common/Util";

const GLOBAL_IN_MESH_ERROR = 'Found a global uniform in mesh struct:';
const MESH_IN_GLOBAL_ERROR = 'Found a mesh uniform in global struct:';

export default class CommandBuilder {
    //@internal
    device: GraphicsDevice;
    //@internal
    vert: string;
    //@internal
    frag: string;
    //@internal
    mesh: Mesh;
    //@internal
    _presentationFormat: any;
    //@internal
    name: string;
    //@internal
    uniformValues: ShaderUniforms;
    //@internal
    contextDesc: Record<string, any>;
    //@internal
    defines: ShaderDefines;

    constructor(name: string, device: GraphicsDevice,
        vert: string, frag: string, mesh: Mesh,
        contextDesc: Record<string, any>, defines: ShaderDefines,
        uniformValues: ShaderUniforms) {
        this.name = name;
        this.device = device;
        this.vert = vert;
        this.frag = frag;
        this.mesh = mesh;
        this.contextDesc = contextDesc;
        this.defines = defines;
        this.uniformValues = uniformValues;
    }

    build(pipelineDesc: PipelineDescriptor, fbo: GraphicsFramebuffer) {
        const mesh = this.mesh;
        const device = this.device;
        const defines = this.defines;
        //FIXME 如何在wgsl中实现defined
        let vert = removeComment(this.vert);
        let frag = removeComment(this.frag);
        try {
            vert = WGSLParseDefines(vert, defines);
        } catch (error) {
            error.message = this.name + '(vert):' + error.message;
            throw error;
        }
        try {
            frag = WGSLParseDefines(frag, defines);
        } catch (error) {
            error.message = this.name + '(frag):' + error.message;
            throw error;
        }

        // dynamically assign location index with $in and $out
        vert = parseLocationIndex(vert);
        if (frag) {
            frag = parseLocationIndex(frag);
        }

        // dynamically assign binding index with $bi
        const { source, index } = parseBindingIndex(vert, 0)
        vert = source;
        if (frag) {
            const { source: fragSource } = parseBindingIndex(frag, index)
            frag = fragSource;
        }


        const vertReflect = new WgslReflect(vert);
        const vertexInfo = this._formatBufferInfo(vertReflect, mesh);
        let fragReflect;
        if (frag) {
            fragReflect = new WgslReflect(frag);
        }

        const vertGroups = vertReflect.getBindGroups();
        let fragGroups = [];
        if (fragReflect) {
            fragGroups = fragReflect.getBindGroups();
        }
        // generate bind group layout
        const layout = this._createBindGroupLayout(vertGroups, fragGroups, mesh, this.uniformValues);
        const pipeline = this._createPipeline(device, vert, vertexInfo, frag, layout, mesh, pipelineDesc, fbo);

        const bindGroupMapping = this._createBindGroupMapping(vertGroups, fragGroups, mesh);
        const alignment = device.wgpu.limits.minUniformBufferOffsetAlignment;
        const bindGroupFormat = new BindGroupFormat(this.name, bindGroupMapping, alignment);
        const activeAttributes = this._getActiveAttributes(vertexInfo);

        return {
            uid: -1,
            layout,
            pipeline,
            vertexInfo,
            bindGroupFormat,
            bindGroupMapping,
            activeAttributes
        };
    }

    _getActiveAttributes(vertexInfo): ActiveAttributes {
        //TODO
        const attributes = [{ name: 'position', type: 1 }];
        (attributes as any).key = attributes.map(attr => attr.name).join();
        return attributes as ActiveAttributes;
    }

    _createBindGroupLayout(vertGroups: any, fragGroups: any, mesh: Mesh, uniformValues: ShaderUniforms) {

        const entries = [];
        for (let i = 0; i < vertGroups.length; i++) {
            const groupInfo = vertGroups[i];
            for (let ii = 0; ii < groupInfo.length; ii++) {
                const uniform = groupInfo[ii];
                if (!uniform) {
                    continue;
                }
                const entry = this._createLayoutEntry(uniform.binding, GPUShaderStage.VERTEX, uniform, mesh, uniformValues);
                entries.push(entry);
            }
        }
        for (let i = 0; i < fragGroups.length; i++) {
            const groupInfo = fragGroups[i];
            for (let ii = 0; ii < groupInfo.length; ii++) {
                const uniform = groupInfo[ii];
                if (!uniform) {
                    continue;
                }
                const entry = this._createLayoutEntry(uniform.binding, GPUShaderStage.FRAGMENT, uniform, mesh, uniformValues);
                entries.push(entry);
            }
        }
        // sort by binding
        entries.sort(sortByBinding);

        return this.device.wgpu.createBindGroupLayout({
            label: this.name + '-bindgrouplayout',
            entries
        });
    }

    _createLayoutEntry(binding, visibility, groupInfo, mesh, uniformValues): GPUBindGroupLayoutEntry {
        if (groupInfo.resourceType === ResourceType.Sampler) {
            const sampler: GPUSamplerBindingLayout = {};
            if (groupInfo.type && groupInfo.type.name === 'sampler_comparison') {
                sampler.type = 'comparison';
            }
            return {
                binding,
                visibility,
                sampler
            };
        } else if (groupInfo.resourceType === ResourceType.Texture) {
            const name = groupInfo.name;
            const texture = uniformValues[name] || mesh.material && mesh.material.get(name);
            let format;
            if (texture) {
                if (texture instanceof Texture2D) {
                    format = (texture as Texture2D).config.type;
                } else if (texture instanceof GraphicsTexture) {
                    format = (texture as GraphicsTexture).gpuFormat.format;
                }
            }
            let sampleType: GPUTextureSampleType = 'float';//sint， uint
            if (format && format.startsWith('depth')) {
                sampleType = 'depth';
            }
            return {
                binding,
                visibility,
                texture: {
                    sampleType
                }
            };
        } else {
            return {
                binding,
                visibility,
                buffer: {
                    type: 'uniform',
                    hasDynamicOffset: true
                }
            };
        }
    }

    // 从vertex的entry function读出vertex的信息（如location，format等）
    _formatBufferInfo(vertReflect: any, mesh: Mesh) {
        const vertEntryFuncion = vertReflect.entry.vertex[0];
        const inputs = vertEntryFuncion.inputs;
        const inputMapping = {} as any;
        for (let i = 0; i < inputs.length; i++) {
            const name = inputs[i].name;
            inputMapping[name] = inputs[i];
        }
        const vertexInfo = {};
        const data = mesh.geometry.data;
        const semantic = mesh.geometry.semantic;
        for (const name in data) {
            const attr = semantic[name] || name;
            const info = inputMapping[attr];
            if (info) {
                vertexInfo[attr] = {
                    geoAttrName: name,
                    location: info.location,
                    itemSize: getItemSize(info.type)
                };
            }
        }
        if (mesh instanceof InstancedMesh) {
            const data = (mesh as InstancedMesh).instancedData;
            for (const name in data) {
                if (inputMapping[name]) {
                    vertexInfo[name] = {
                        geoAttrName: name,
                        location: inputMapping[name].location,
                        itemSize: getItemSize(inputMapping[name].type)
                    };
                }
            }
        }
        return vertexInfo;
    }

    _createBindGroupMapping(vertGroups: any, fragGroups: any, mesh: Mesh) {
        const mapping = {};
        // 解析vertInfo和fragInfo，生成一个 bindGroupMapping，用于mesh在运行时，生成bindGroup
        // mapping 中包含 uniform 变量名对应的 group index 和 binding index
        this._parseGroupMapping(mapping, vertGroups[0], mesh, 'vert');
        this._parseGroupMapping(mapping, fragGroups[0], mesh, 'frag');
        return mapping;
    }

    _parseGroupMapping(mapping, groupReflect, mesh, shaderType) {
        if (!groupReflect) {
            return;
        }
        for (let i = 0; i < groupReflect.length; i++) {
            const groupInfo = groupReflect[i];
            if (!groupInfo) {
                continue;
            }
            const { group, binding } = groupInfo;
            const members = groupInfo.members;
            let isGlobal = false;
            if (members && members.length) {
                for (let ii = 0; ii < members.length; ii++) {
                    const name = members[ii].name;
                    if (!meshHasUniform(mesh, name, this.contextDesc)) {
                        if (!isGlobal && ii > 0) {
                            throw new Error(GLOBAL_IN_MESH_ERROR + name + '(' + groupInfo.name + ') in ' + this.name + '_' + shaderType);
                        }
                        isGlobal = true;
                    } else if (isGlobal) {
                        throw new Error(MESH_IN_GLOBAL_ERROR + name + '(' + groupInfo.name + ') in ' + this.name + '_' + shaderType);
                    }
                }
            } else {
                const name = groupInfo.name;
                if (!meshHasUniform(mesh, name, this.contextDesc)) {
                    isGlobal = true;
                }
            }
            mapping.groups = mapping.groups || [];
            mapping.groups[group] = mapping.groups[group] || [];
            groupInfo.isGlobal = isGlobal;
            groupInfo.index =
            // we assume all the members in the same struct is all global or mesh owned
            mapping.groups[group][binding] = groupInfo;//extend({
        }
    }
    // 运行时调用，生成 uniform buffer， 用来存放全局 uniform 变量的值
    _createPipeline(graphicsDevice: GraphicsDevice,
        vert: string, vertInfo, frag: string, layout: GPUBindGroupLayout, mesh:Mesh,
        pipelineDesc: PipelineDescriptor, fbo: GraphicsFramebuffer): GPURenderPipeline {
        const device = graphicsDevice.wgpu;
        const vertModule = device.createShaderModule({
            label: this.name + '-vertmodule',
            code: vert,
        });
        let fragModule;
        if (frag) {
            fragModule = device.createShaderModule({
                label: this.name + '-fragmodule',
                code: frag,
            });
        }

        if (!this._presentationFormat) {
            this._presentationFormat = navigator.gpu.getPreferredCanvasFormat();
        }
        const buffers = mesh.geometry.getBufferDescriptor(vertInfo);
        if (mesh instanceof InstancedMesh) {
            const instanceBuffers = (mesh as InstancedMesh).getBufferDescriptor(vertInfo);
            for (let i = 0; i < instanceBuffers.length; i++) {
                if (!instanceBuffers[i]) {
                    continue;
                }
                buffers[i] = instanceBuffers[i];
            }
        }
        const pipelineLayout = device.createPipelineLayout({
            label: this.name + '-pipelinelayout',
            bindGroupLayouts: [layout]
        });
        const pipelineOptions: GPURenderPipelineDescriptor = {
            label: this.name + '-pipeline',
            layout: pipelineLayout,
            vertex: {
                module: vertModule,
                buffers
            },
            primitive: {
                topology: pipelineDesc.topology,
                cullMode: pipelineDesc.cullMode
            }
        };
        const sampleCount = fbo && fbo.colorTexture && fbo.colorTexture.config.sampleCount;
        if (sampleCount) {
            pipelineOptions.multisample = { count: sampleCount };
        }
        const depthEnabled = !fbo || !!fbo.depthTexture;

        if (depthEnabled) {
            const depthTexture = fbo && fbo.depthTexture;
            pipelineOptions.depthStencil = {
                depthBias: pipelineDesc.depthBias,
                depthBiasSlopeScale: pipelineDesc.depthBiasSlopeScale,
                depthWriteEnabled: pipelineDesc.depthWriteEnabled,
                depthCompare: pipelineDesc.depthCompare,
                format: (!depthTexture || depthTexture.gpuFormat.isDepthStencil) ? 'depth24plus-stencil8' : 'depth24plus'
            };
        }
        if (fragModule) {
            const fboPresentationFormat = fbo && fbo.colorTexture && fbo.colorTexture.gpuFormat.format;
            const writeMask = pipelineDesc.writeMask;
            pipelineOptions.fragment = {
                module: fragModule,
                targets: [
                    {
                        format: fboPresentationFormat || this._presentationFormat,
                        writeMask: isNil(writeMask) ? GPUColorWrite.ALL : writeMask
                    }
                ],
            };
        }
        if (pipelineDesc.stencilFrontCompare) {
            pipelineOptions.depthStencil.stencilBack =
            pipelineOptions.depthStencil.stencilFront = {
                compare: pipelineDesc.stencilFrontCompare,
                passOp: pipelineDesc.stencilFrontPassOp
            };
        }
        if (fragModule && pipelineDesc.blendAlphaDst) {
            const fragTargets = pipelineOptions.fragment.targets;
            for (const target of fragTargets) {
                target.blend = {
                    color: {
                        srcFactor: pipelineDesc.blendColorSrc,
                        dstFactor: pipelineDesc.blendColorDst,
                        operation: 'add'
                    },
                    alpha: {
                        srcFactor: pipelineDesc.blendAlphaSrc,
                        dstFactor: pipelineDesc.blendAlphaDst,
                        operation: 'add'
                    }
                }
            }
        }
        return device.createRenderPipeline(pipelineOptions);
    }
}

function meshHasUniform(mesh: Mesh, name: string, contextDesc: Record<string, any>) {
    if (name === 'modelMatrix' || name === 'positionMatrix' ||
        name === 'projViewModelMatrix' || name === 'modelViewMatrix' ||
        name === 'modelNormalMatrix' ||
        name === 'polygonFill' || name === 'polygonOpacity' ||
        name === 'lineColor' || name === 'lineOpacity') {
        return true;
    }
    return contextDesc[name] && !contextDesc[name].global || mesh.hasUniform(name) || (mesh.material && mesh.material.hasUniform(name));
}

function getItemSize(type) {
    if (type.name.startsWith('vec')) {
        return parseInt(type.name[3]);
    } else {
        return 1;
    }
}

function sortByBinding(a: GPUBindGroupLayoutEntry, b: GPUBindGroupLayoutEntry): number {
    return a.binding - b.binding;
}

function parseLocationIndex(code: string) {
    let index = 0;
    let parsedIn = code.replaceAll('$i', () => '' + index++);

    index = 0;
    let parsedOut = parsedIn.replaceAll('$o', () => '' + index++);

    return parsedOut;
}

function parseBindingIndex(code: string, index: number) {
    return {
        source: code.replaceAll('$b', () => '' + index++),
        index
    };
}

function removeComment(str) {
    if (!str) {
        return str;
    }
    return str.replace(/[ \t]*\/\/.*\n/g, '') // remove //
        .replace(/[ \t]*\/\*[\s\S]*?\*\//g, ''); // remove /* */
}
