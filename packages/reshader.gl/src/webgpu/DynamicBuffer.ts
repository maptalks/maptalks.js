import { ResourceType } from "wgsl_reflect";
import { ShaderUniformValue } from "../types/typings";
import DynamicBufferPool, { DynamicBufferAllocation } from "./DynamicBufferPool";
import { isArray } from "../common/Util";

export default class DynamicBuffer {
    bindgroupMapping: any;
    dynamicOffsets: number[];
    pool: DynamicBufferPool;
    allocation: DynamicBufferAllocation;
    version: number = 0;

    constructor(bindgroupMapping, pool: DynamicBufferPool) {
        this.bindgroupMapping = bindgroupMapping;
        this.pool = pool;
        this.dynamicOffsets = new Array(bindgroupMapping.length);
        this.allocation = {};
    }

    writeBuffer(uniformValues: Record<string, ShaderUniformValue>) {
        this.dynamicOffsets.fill(0);
        const totalSize = this.bindgroupMapping.totalSize;
        const gpuBuffer = this.allocation.gpuBuffer;
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
                for (let j = 0; j < uniform.members.length; j++) {
                    const member = uniform.members[j];
                    const value = uniformValues[member.name] as number | number[];
                    const offset = dynamicOffset + member.offset;
                    const size = member.size;
                    this._fillValue(storage, offset, size, value);
                }
                // size() 返回的值已经考虑过 bufferAlignment
                dynamicOffset += mapping[i].size;
                this.dynamicOffsets[i] = dynamicOffset;
            } else if (uniform.resourceType === ResourceType.Uniform) {
                const value = uniformValues[uniform.name];
                this._fillValue(storage, dynamicOffset, uniform.size(), value);
                dynamicOffset += mapping[i].size();
                this.dynamicOffsets[i] = dynamicOffset;
            }
        }
    }

    _fillValue(buffer, offset, size, value) {
        // we always use f32 in WGSL
        const view = new Float32Array(buffer, offset, size / 4);
        if (isArray(value)) {
            for (let i = 0; i < value.length; i++) {
                view[i] = value[i];
            }
        } else {
            view[0] = value;
        }
    }

    dispose() {
        delete this.pool;
        delete this.allocation;
        delete this.dynamicOffsets;
    }
}
