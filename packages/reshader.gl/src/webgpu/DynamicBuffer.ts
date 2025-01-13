import { ShaderUniformValue } from "../types/typings";

let uid = 1;

export default class DynamicBuffer {
    device: GPUDevice;
    bindgroupMapping: any;

    dynamicOffset: number;
    gpuBuffer: GPUBuffer;
    stagingBuffer: GPUBuffer;
    dirty: boolean;
    size: number;
    bindGroup: GPUBindGroup;
    uid: number;

    constructor(device: GPUDevice, bindgroupMapping) {
        this.device = device;
        this.bindgroupMapping = bindgroupMapping;
        this.dirty = true;
        this.uid = uid++;
    }

    writeBuffer(uniformValues: Record<string, ShaderUniformValue>) {
        //TODO 从对象池中申请stagingBuffer
        //按照mapping中的顺序将uniform值写入stagingBuffer，写入完成后，记录dynamicOffsets
    }


}
