import { ResourceType } from "wgsl_reflect";
import { ShaderUniformValue } from "../types/typings";
import DynamicBufferPool, { DynamicBufferAllocation } from "./DynamicBufferPool";
import { isArray, isFunction } from "../common/Util";
import DynamicOffsets from "./DynamicOffsets";
import { roundUp } from "./common/math";
import { isPaddingType } from "./common/Types";

export default class DynamicBuffer {
    bindgroupMapping: any;
    dynamicOffsets: number[];
    pool: DynamicBufferPool;
    allocation: DynamicBufferAllocation;
    version = 0;

    constructor(bindgroupMapping, pool: DynamicBufferPool) {
        this.bindgroupMapping = bindgroupMapping;
        this.pool = pool;
        this.allocation = {};
    }

    writeBuffer(uniformValues: Record<string, ShaderUniformValue>, dynamicOffsets: DynamicOffsets) {
        const mapping = this.bindgroupMapping;
        const totalSize = mapping.totalSize;
        const gpuBuffer = this.allocation.gpuBuffer;
        const bufferAlignment = this.pool.bufferAlignment;
        this.pool.alloc(this.allocation, totalSize);
        if (gpuBuffer !== this.allocation.gpuBuffer) {
            this.version++;
        }

        let dynamicOffset = this.allocation.offset;

        const storage = this.allocation.storage;

        for (let i = 0; i < mapping.length; i++) {
            const uniform = mapping[i];
            const binding = uniform.binding;
            // if (mesh) {
            //     const key = uniform.group + '-' + binding;
            //     const format = mesh && mesh.getGPUUniformFormat(commandID, key);
            //     if (format) {
            //         // mesh 中已经缓存过该uniform结构体的 arraybuffer
            //         dynamicOffsets.addItem(binding, dynamicOffset);

            //         // format中的值和dynamicBuffer中的值是一致的，因此不再需要整体更新
            //         const needFlush = format.dynamicOffset !== dynamicOffset || format.bufferVersion !== bufferVersion;
            //         const { buffer, outsideUniforms } = format;
            //         if (needFlush) {
            //             const array = new Float32Array(storage, dynamicOffset, buffer.byteLength / 4);
            //             array.set(new Float32Array(buffer));
            //         }

            //         if (outsideUniforms.length) {
            //             for (let j = 0; j < outsideUniforms.length; j++) {
            //                 const offset = outsideUniforms[j].offset + dynamicOffset;
            //                 const value = uniformValues[outsideUniforms[j].name] as number | number[];
            //                 if (value === undefined) {
            //                     console.warn(`Uniform value ${outsideUniforms[j].name} is not provided`);
            //                 }
            //                 this._fillValue(outsideUniforms[j].type, storage, offset, outsideUniforms[j].size, value);
            //             }
            //         }

            //         format.bufferVersion = bufferVersion;
            //         format.dynamicOffset = dynamicOffset;
            //         const uniformSize = isFunction(uniform.size) ? uniform.size() : uniform.size;
            //         dynamicOffset += roundUp(uniformSize, bufferAlignment);
            //         continue;
            //     }
            // }

            const members = uniform.members;
            if (members) {
                dynamicOffsets.addItem(binding, dynamicOffset);
                for (let j = 0; j < members.length; j++) {
                    const member = members[j];
                    const value = uniformValues[member.name] as number | number[];
                    if (value === undefined) {
                        console.warn(`Uniform value ${member.name} is not provided`);
                    }
                    const offset = dynamicOffset + member.offset;
                    const size = member.size;
                    this._fillValue(member.type, storage, offset, size, value);
                }
                dynamicOffset += roundUp(uniform.size, bufferAlignment);
            } else if (uniform.resourceType === ResourceType.Uniform) {
                dynamicOffsets.addItem(binding, dynamicOffset);
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
            const padding = isPaddingType(type);
            if (!padding) {
                view.set(value);
                return;
            }
            // 需要padding的类型参考:
            // https://github.com/greggman/webgpu-utils/blob/dev/src/wgsl-types.ts
            // wgsl 1.0中只会隔3个字节，pad一个字节
            for (let i = 0; i < value.length; i++) {
                const col = Math.floor(i / 3);
                const row = i % 3;
                view[col * 4 + row] = value[i];
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

