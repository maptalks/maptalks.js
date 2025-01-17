import { ResourceType } from "wgsl_reflect";
import { toGPUSampler } from "./common/ReglTranslator";
import DynamicBuffer from "./DynamicBuffer";
import Mesh from "../Mesh";
import Texture2D from "../Texture2D";
import GraphicsDevice from "./GraphicsDevice";

export default class BindGroupFormat {
    bytes: number;
    //@internal
    alignment: number;
    //@internal
    groups: any;
    //@internal
    _shaderUniforms: any;
    //@internal
    _meshUniforms: any;

    constructor(bindGroupMapping, minUniformBufferOffsetAlignment) {
        this.groups = bindGroupMapping.groups;
        this.alignment = minUniformBufferOffsetAlignment;
        this._parse(bindGroupMapping);
    }

    getShaderUniforms() {
        return  this._shaderUniforms;
    }

    getMeshUniforms() {
        return this._meshUniforms;
    }

    _parse(bindGroupMapping) {
        this._shaderUniforms = [];
        this._shaderUniforms.index = 0;
        this._shaderUniforms.totalSize = 0;
        this._meshUniforms = [];
        this._meshUniforms.index = 0;
        this._meshUniforms.totalSize = 0;
        const groups = bindGroupMapping.groups;
        const group = groups[0];
        for (let i = 0; i < group.length; i++) {
            const uniform = group[i];
            if (uniform.isGlobal) {
                let index = this._shaderUniforms.index;
                this._shaderUniforms[index++] = uniform;
                this._shaderUniforms.index = index;
                this._shaderUniforms.totalSize += uniform.size;
            } else {
                let index = this._meshUniforms.index;
                this._meshUniforms[index++] = uniform;
                this._meshUniforms.index = index;
                this._meshUniforms.totalSize += uniform.size;
            }
        }
    }

    createBindGroup(device: GraphicsDevice, mesh: Mesh, layout: GPUBindGroupLayout, shaderBuffer: DynamicBuffer, meshBuffer: DynamicBuffer) {
        const groups = this.groups[0];
        const entries = [];
        for (let i = 0; i < groups.length; i++) {
            const group = groups[i];
            const name = group.name;
            if (group.resourceType === ResourceType.Sampler) {
                const texture = (mesh.getUniform(name) || mesh.material && mesh.material.getUniform(name)) as Texture2D;
                const { min, mag, wrapS, wrapT } = (texture as Texture2D).config;
                const filters = toGPUSampler(min, mag, wrapS, wrapT);
                const sampler = device.wgpu.createSampler(filters);
                entries.push({
                    binding: group.binding,
                    resource: sampler
                });
            } else if (group.resourceType === ResourceType.Texture) {
                const texture = (mesh.getUniform(name) || mesh.material && mesh.material.getUniform(name)) as Texture2D;
                entries.push({
                    binding: group.binding,
                    resource: (texture.getREGLTexture(device) as GPUTexture).createView()
                });
            } else {
                const allocation = group.isGlobal ? shaderBuffer.allocation : meshBuffer.allocation;
                entries.push({
                    binding: group.binding,
                    resource: {
                        buffer: allocation.gpuBuffer,
                        // offset 永远设为0，在setBindGroup中设置dynamicOffsets
                        offset: 0,
                        size: Math.max(group.size, this.alignment)
                    }
                });
            }
        }
        return device.wgpu.createBindGroup({
            layout,
            label: '',
            entries
        });
    }

    dispose() {
        delete this._shaderUniforms;
        delete this._meshUniforms;
        delete this.groups;
    }
}
