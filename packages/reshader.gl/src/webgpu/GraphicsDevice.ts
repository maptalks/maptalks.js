import DynamicBufferPool from "./DynamicBufferPool";

export default class GraphicsDevice {
    wgpu: GPUDevice;
    commandBuffers: GPUCommandBuffer[];
    dynamicBufferPool: DynamicBufferPool;

    constructor(device: GPUDevice) {
        this.wgpu = device;
        // 1M for each buffer
        const bufferSize = 1024 * 1024;
        const limits = device.limits;
        this.dynamicBufferPool = new DynamicBufferPool(device, bufferSize, limits.minUniformBufferOffsetAlignment);
    }

    addCommandBuffer(commandBuffer: GPUCommandBuffer, front: boolean) {
        if (front) {
            this.commandBuffers.unshift(commandBuffer);
        } else {
            this.commandBuffers.push(commandBuffer);
        }
    }

    submit() {
        // copy dynamic buffers data to the GPU (this schedules the copy CB to run before all other CBs)
        this.dynamicBufferPool.submit();
        if (this.commandBuffers.length > 0) {
            this.wgpu.queue.submit(this.commandBuffers);
            this.commandBuffers.length = 0;
        }
    }
}
