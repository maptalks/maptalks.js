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
                    this._fillValue(storage, offset, size, value);
                }
                dynamicOffset += roundUp(mapping[i].size, bufferAlignment);
            } else if (uniform.resourceType === ResourceType.Uniform) {
                dynamicOffsets.addItem({ binding: uniform.binding, offset: dynamicOffset });
                const value = uniformValues[uniform.name];
                const size = isFunction(uniform.size) ? uniform.size() : uniform.size;
                this._fillValue(storage, dynamicOffset, size, value);
                dynamicOffset += roundUp(size, bufferAlignment);
            }
        }

        // console.log(debugInfo.join());
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
    }
}
