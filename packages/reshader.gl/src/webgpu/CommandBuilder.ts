import { wgsl } from 'wgsl-preprocessor/wgsl-preprocessor.js';
import { WgslReflect } from "wgsl_reflect/wgsl_reflect.module.js";
import BindGroupFormat from '../webgpu/BindGroupFormat';
import Mesh from '../Mesh';
import { ResourceType } from 'wgsl_reflect';
import { extend } from '../common/Util';
import GraphicsDevice from './GraphicsDevice';
import PipelineDescriptor from './common/PipelineDesc';
import { ActiveAttributes } from '../types/typings';

export default class CommandBuilder {
    device: GraphicsDevice;
    vert: string;
    frag: string;
    mesh: Mesh;
    _presentationFormat: any;
    constructor(device, vert, frag, mesh) {
        this.device = device;
        this.vert = vert;
        this.frag = frag;
        this.mesh = mesh;
    }

    build(pipelineDesc) {
        const mesh = this.mesh;
        const device = this.device;
        const defines = this.mesh.getDefines();
        const defined = key => {
            return !!defines[key];
        }
        //FIXME 如何在wgsl中实现defined
        const vert = wgsl(this.vert);
        const frag = wgsl(this.frag);

        const vertReflect = new WgslReflect(vert);
        const vertexInfo = this._formatBufferInfo(vertReflect, mesh);
        const fragReflect = new WgslReflect(frag);

        // 生成 bind group layout
        const layout = this._createBindGroupLayout(vertReflect, fragReflect, mesh);
        const pipeline = this._createPipeline(device, vert, vertexInfo, frag, layout, mesh, pipelineDesc);

        const bindGroupMapping = this._createBindGroupMapping(vertReflect, fragReflect, mesh);
        const bindGroupFormat = new BindGroupFormat(bindGroupMapping, device.wgpu.limits.minUniformBufferOffsetAlignment);
        const activeAttributes = this._getActiveAttributes(vertexInfo);

        return {
            pipeline,
            vertexInfo,
            bindGroupMapping,
            bindGroupFormat,
            activeAttributes
        };
    }

    _getActiveAttributes(vertexInfo): ActiveAttributes {
        const attributes = [{ name: 'position', type: 1 }];
        (attributes as any).key = attributes.map(attr => attr.name).join();
        return attributes as ActiveAttributes;
    }

    _createBindGroupLayout(vertReflect: any, fragReflect: any, mesh: Mesh) {
        const vertGroups = vertReflect.getBindGroups();
        const fragGroups = fragReflect.getBindGroups();
        const entries = [];
        for (let i = 0; i < vertGroups.length; i++) {
            const groupInfo = vertGroups[i];
            const entry = this._createLayoutEntry(i, GPUShaderStage.VERTEX, groupInfo, mesh);
            entries.push(entry);
        }
        for (let i = 0; i < fragGroups.length; i++) {
            const groupInfo = fragGroups[i];
            const entry = this._createLayoutEntry(i, GPUShaderStage.FRAGMENT, groupInfo, mesh);
            entries.push(entry);
        }
        return this.device.wgpu.createBindGroupLayout({
            label: '',
            entries
        });
    }

    _createLayoutEntry(binding, visibility, groupInfo, mesh): GPUBindGroupLayoutEntry {
        if (groupInfo.resourceType === ResourceType.Sampler) {
            return {
                binding,
                visibility
                // sampler 采用默认值
            };
        } else if (groupInfo.resourceType === ResourceType.Texture) {
            const name = groupInfo.name;
            const texture = mesh.material && mesh.material.get(name);
            const type = texture && texture.config.type;
            let sampleType: GPUTextureSampleType = 'float';//sint， uint
            if (type === 'depth stencil' || type === 'depth') {
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
        const inputMapping = {};
        for (let i = 0; i < inputs.length; i++) {
            const name = inputs[i].name;
            inputMapping[name] = inputs[i];
        }
        const vertexInfo = {};
        const data = mesh.geometry.data;
        for (const name in data) {
            if (inputMapping[name]) {
                vertexInfo[name] = {
                    location: inputMapping[name].location,
                    itemSize: getItemSize(inputMapping[name].type)
                };
            }
        }
        return vertexInfo;
    }

    _createBindGroupMapping(vertReflect: any, fragReflect: any, mesh: Mesh) {
        const mapping = {};
        const vertGroups = vertReflect.getBindGroups();
        const fragGroups = fragReflect.getBindGroups();
        // 解析vertInfo和fragInfo，生成一个 bindGroupMapping，用于mesh在运行时，生成bindGroup
        // mapping 中包含 uniform 变量名对应的 group index 和 binding index
        this._parseGroupMapping(mapping, vertGroups[0], mesh);
        this._parseGroupMapping(mapping, fragGroups[0], mesh);
        return mapping;
    }

    _parseGroupMapping(mapping, groupReflect, mesh) {
        if (!groupReflect) {
            return;
        }
        for (let i = 0; i < groupReflect.length; i++) {
            const groupInfo = groupReflect[i];
            const { group, binding } = groupInfo;
            const members = groupInfo.members;
            let isGlobal = false;
            if (members && members.length) {
                for (let ii = 0; ii < members.length; ii++) {
                    const name = members[ii].name;
                    if (!meshHasUniform(mesh, name)) {
                        isGlobal = true;
                        break;
                    }
                }
            } else {
                const name = groupInfo.name;
                if (!meshHasUniform(mesh, name)) {
                    isGlobal = true;
                }
            }
            mapping.groups = mapping.groups || [];
            mapping.groups[group] = mapping.groups[group] || [];
            groupInfo.isGlobal = isGlobal;
            // we assume all the members in the same struct is all global or mesh owned
            mapping.groups[group][binding] = groupInfo;//extend({
        }
    }
    // 运行时调用，生成 uniform buffer， 用来存放全局 uniform 变量的值
    _createPipeline(graphicsDevice: GraphicsDevice, vert: string, vertInfo, frag: string, layout: GPUBindGroupLayout, mesh:Mesh, pipelineDesc: PipelineDescriptor): GPURenderPipeline {
        const device = graphicsDevice.wgpu;
        const vertModule = device.createShaderModule({
            code: vert,
        });
        const fragModule = device.createShaderModule({
            code: frag,
        });
        if (!this._presentationFormat) {
            this._presentationFormat = navigator.gpu.getPreferredCanvasFormat();
        }
        const buffers = mesh.geometry.getBufferDescriptor(vertInfo);
        const pipelineLayout = device.createPipelineLayout({
            label: 'label',
            bindGroupLayouts: [layout]
        });
        const pipelineOptions: GPURenderPipelineDescriptor = {
            layout: pipelineLayout,
            vertex: {
                module: vertModule,
                buffers
            },
            fragment: {
                module: fragModule,
                targets: [
                    {
                        format: this._presentationFormat,
                    }
                ],
            },
            primitive: {
                topology: pipelineDesc.topology,
                cullMode: pipelineDesc.cullMode
            },
            depthStencil: {
                depthBias: pipelineDesc.depthBias,
                depthBiasSlopeScale: pipelineDesc.depthBiasSlopeScale,
                depthWriteEnabled: pipelineDesc.depthWriteEnabled,
                depthCompare: pipelineDesc.depthCompare,
                format: 'depth24plus-stencil8'
            }
        };
        if (pipelineDesc.stencilFrontCompare) {
            pipelineOptions.depthStencil.stencilBack =
            pipelineOptions.depthStencil.stencilFront = {
                compare: pipelineDesc.stencilFrontCompare,
                passOp: pipelineDesc.stencilFrontPassOp
            };
        }
        if (pipelineDesc.blendAlphaDst) {
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
                };
            }
        }
        return device.createRenderPipeline(pipelineOptions);
    }
}

function meshHasUniform(mesh: Mesh, name: string) {
    if (name === 'modelMatrix' || name === 'positionMatrix') {
        return true;
    }
    return mesh.hasUniform(name) || (mesh.material && mesh.material.hasUniform(name));
}

function getItemSize(type) {
    if (type.name.startsWith('vec')) {
        return parseInt(type.name[3]);
    } else {
        return 1;
    }
}
