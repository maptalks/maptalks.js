import { ResourceType } from "wgsl_reflect";
import { toGPUSampler } from "./common/ReglTranslator";
import DynamicBuffer from "./DynamicBuffer";
import Mesh from "../Mesh";
import Texture2D from "../Texture2D";
import GraphicsDevice from "./GraphicsDevice";
import { ShaderUniforms } from "../types/typings";
import AbstractTexture from "../AbstractTexture";
import GraphicsTexture from "./GraphicsTexture";
import { roundUp } from "./common/math";
import GraphicsFramebuffer from "./GraphicsFramebuffer";

let uuid = 0;

export default class BindGroupFormat {
    bytes: number;
    uuid: number;
    name: string;
    //@internal
    alignment: number;
    //@internal
    groups: any;
    //@internal
    _shaderUniforms: any;
    //@internal
    _meshUniforms: any;

    constructor(name, bindGroupMapping, minUniformBufferOffsetAlignment) {
        this.name = name;
        this.uuid = uuid++;
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
        if (!groups) {
            return;
        }
        const group = groups[0];
        if (!group) {
            return;
        }
        for (let i = 0; i < group.length; i++) {
            const uniform = group[i];
            if (!uniform) {
                continue;
            }
            if (uniform.isGlobal) {
                let index = this._shaderUniforms.index;
                this._shaderUniforms[index++] = uniform;
                this._shaderUniforms.index = index;
                this._shaderUniforms.totalSize += roundUp(uniform.size, this.alignment);;
            } else {
                let index = this._meshUniforms.index;
                this._meshUniforms[index++] = uniform;
                this._meshUniforms.index = index;
                this._meshUniforms.totalSize += roundUp(uniform.size, this.alignment);
            }
        }
    }

    createBindGroup(device: GraphicsDevice, mesh: Mesh, shaderUniforms: ShaderUniforms, layout: GPUBindGroupLayout, shaderBuffer: DynamicBuffer, meshBuffer: DynamicBuffer) {
        const label = this.name + '-' + mesh.uuid;
        if (!this.groups) {
            return device.wgpu.createBindGroup({
                layout,
                label,
                entries: []
            });
        }
        const groups = this.groups[0];
        const entries = [];
        const textures = [];
        for (let i = 0; i < groups.length; i++) {
            const group = groups[i];
            if (!group) {
                continue;
            }
            const name = group.name;
            if (group.resourceType === ResourceType.Sampler) {
                // we assume sampler's name always be [textureName]Sampler
                const textureName = name.substring(0, name.length - 7);
                let texture = shaderUniforms && shaderUniforms[textureName] || (mesh.getUniform(textureName) || mesh.material && mesh.material.getUniform(textureName)) as Texture2D;
                //TODO texture是否存在
                if (texture instanceof GraphicsFramebuffer) {
                    texture = texture.colorTexture;
                }
                const { min, mag, wrapS, wrapT, compare } = (texture as Texture2D).config;
                const filters = toGPUSampler(min, mag, wrapS, wrapT, compare);
                const sampler = device.wgpu.createSampler(filters);
                entries.push({
                    binding: group.binding,
                    resource: sampler
                });
            } else if (group.resourceType === ResourceType.Texture) {
                const texture = shaderUniforms && shaderUniforms[name] || (mesh.getUniform(name) || mesh.material && mesh.material.getUniform(name)) as Texture2D;
                let graphicsTexture = texture;
                if (graphicsTexture instanceof AbstractTexture) {
                    graphicsTexture = (texture as AbstractTexture).getREGLTexture(device);
                }
                if (graphicsTexture instanceof GraphicsFramebuffer) {
                    graphicsTexture = graphicsTexture.colorTexture;
                }
                textures.push(graphicsTexture);
                entries.push({
                    binding: group.binding,
                    resource: (graphicsTexture as GraphicsTexture).getView()
                });
            } else {
                const allocation = group.isGlobal ? shaderBuffer.allocation : meshBuffer.allocation;
                entries.push({
                    binding: group.binding,
                    resource: {
                        buffer: allocation.gpuBuffer,
                        // offset 永远设为0，在setBindGroup中设置dynamicOffsets
                        // offset: 0,
                        size: roundUp(group.size, this.alignment)
                    }
                });
            }
        }
        const bindGroup = device.wgpu.createBindGroup({
            layout,
            label,
            entries
        });
        for (let i = 0; i < textures.length; i++) {
            textures[i].addBindGroup(bindGroup);
        }
        return bindGroup;
    }

    dispose() {
        delete this._shaderUniforms;
        delete this._meshUniforms;
        delete this.groups;
    }
}
