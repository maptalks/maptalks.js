import { ResourceType } from "wgsl_reflect";
import { ShaderUniformValue } from "../types/typings";
import DynamicBufferPool, { DynamicBufferAllocation } from "./DynamicBufferPool";
import { isArray, isFunction } from "../common/Util";
import DynamicOffsets from "./DynamicOffsets";
import { roundUp } from "./common/math";

export default class DynamicBuffer {
    bindgroupMapping: any;
    dynamicOffsets: number[];
    pool: DynamicBufferPool;
    allocation: DynamicBufferAllocation;
    version: number = 0;

    constructor(bindgroupMapping, pool: DynamicBufferPool) {
        this.bindgroupMapping = bindgroupMapping;
        this.pool = pool;
        this.allocation = {};
    }

    writeBuffer(uniformValues: Record<string, ShaderUniformValue>, dynamicOffsets: DynamicOffsets) {
        const totalSize = this.bindgroupMapping.totalSize;
        const gpuBuffer = this.allocation.gpuBuffer;
        const bufferAlignment = this.pool.bufferAlignment;
        this.pool.alloc(this.allocation, totalSize);
        if (gpuBuffer !== this.allocation.gpuBuffer) {
            this.version++;
        }

        let dynamicOffset = this.allocation.offset;

        const mapping = this.bindgroupMapping;
        const storage = this.allocation.storage;

        for (let i = 0; i < mapping.length; i++) {
            const uniform = mapping[i];
            if (uniform.members) {
                dynamicOffsets.addItem({ binding: uniform.binding, offset: dynamicOffset });
                for (let j = 0; j < uniform.members.length; j++) {
                    const member = uniform.members[j];
                    const value = uniformValues[member.name] as number | number[];
                    if (value === undefined) {
                        console.warn(`Uniform value ${member.name} is not provided`);
                    }
                    const offset = dynamicOffset + member.offset;
                    const size = member.size;
                    this._fillValue(member.type, storage, offset, size, value);
                }
                dynamicOffset += roundUp(mapping[i].size, bufferAlignment);
            } else if (uniform.resourceType === ResourceType.Uniform) {
                dynamicOffsets.addItem({ binding: uniform.binding, offset: dynamicOffset });
                const value = uniformValues[uniform.name];
                const size = isFunction(uniform.size) ? uniform.size() : uniform.size;
                this._fillValue(uniform.type, storage, dynamicOffset, size, value);
                dynamicOffset += roundUp(size, bufferAlignment);
            }
        }

        // console.log(debugInfo.join());
    }

    _fillValue(type, buffer, offset, size, value) {
        // we always use f32 in WGSL
        const view = new Float32Array(buffer, offset, size / 4);
        if (isArray(value)) {
            const padding = isPadding(type);
            // 需要padding的类型参考:
            // https://github.com/greggman/webgpu-utils/blob/dev/src/wgsl-types.ts
            // wgsl 1.0中只会隔3个字节，pad一个字节
            for (let i = 0; i < value.length; i++) {
                if (padding) {
                    const col = Math.floor(i / 3);
                    const row = i % 3;
                    view[col * 4 + row] = value[i];
                } else {
                    view[i] = value[i];
                }
            }
        } else {
            view[0] = value;
        }
    }

    dispose() {
        delete this.pool;
        delete this.allocation;
    }
}

const PADDING_TYPES = {
    mat2x3f: { pad: [3, 1] },
    mat2x3h: { pad: [3, 1] },
    mat3x3f: { pad: [3, 1] },
    mat3x3h: { pad: [3, 1] },
    mat4x3f: { pad: [3, 1] },
    mat4x3h: { pad: [3, 1] },
    mat3x4f: { pad: [3, 1] },
    mat3x4h: { pad: [3, 1] },
};

function isPadding(type) {
    return PADDING_TYPES[type.name];
}
