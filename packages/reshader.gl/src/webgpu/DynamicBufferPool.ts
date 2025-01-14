// contains codes from playcanvas
// https://github.com/playcanvas/engine
// MIT License
import * as math from './common/math';

export type DynamicBufferAllocation = {
    storage: ArrayBuffer;
    gpuBuffer: GPUBuffer;
    offset: number;
    size: number;
}

export default class DynamicBufferPool {

    /**
     * Allocation size of the underlying buffers.
     *
     */
    bufferSize: number;
    /**
     * Internally allocated gpu buffers.
     *
     */
    poolBuffers: DynamicBufferAllocation[];

    usedBuffers: DynamicBufferAllocation[];

    /**
     * @type {DynamicBufferAllocation|null}
     */
    activeBuffer: DynamicBufferAllocation = null;
    device: GPUDevice;
    bufferAlignment: number;

    /**
     * Create the system of dynamic buffers.
     *
     * @param device - The graphics device.
     * @param bufferSize - The size of the underlying large buffers.
     * @param bufferAlignment - Alignment of each allocation.
     */
    constructor(device: GPUDevice, bufferSize: number, bufferAlignment: number) {
        this.device = device;
        this.usedBuffers = [];
        this.poolBuffers = [];
        this.bufferSize = bufferSize;
        this.bufferAlignment = bufferAlignment;
    }

    /**
     * Destroy the system of dynamic buffers.
     */
    destroy() {
        this.poolBuffers.forEach((poolBuffer) => {
            poolBuffer.gpuBuffer.destroy();
        });
        this.poolBuffers.length = 0;
        this.usedBuffers.length = 0;
        this.activeBuffer = null;
    }

    /**
     * Allocate an aligned space of the given size from a dynamic buffer.
     *
     * @param {DynamicBufferAllocation} allocation - The allocation info to fill.
     * @param {number} size - The size of the allocation.
     */
    alloc(allocation, size) {

        // if we have active buffer without enough space
        if (this.activeBuffer) {
            const alignedStart = math.roundUp(this.activeBuffer.size, this.bufferAlignment);
            const space = this.bufferSize - alignedStart;
            if (space < size) {

                // we're done with this buffer, schedule it for submit
                this.scheduleSubmit();
            }
        }

        // if we don't have an active buffer, allocate new one
        if (!this.activeBuffer) {

            // gpu buffer
            this.activeBuffer = this.poolBuffers.pop();
            if (!this.activeBuffer) {
                this.activeBuffer = {
                    gpuBuffer: this.createBuffer(this.device, this.bufferSize),
                    storage: new ArrayBuffer(this.bufferSize),
                    offset: 0,
                    size: 0
                };
            }
            this.activeBuffer.offset = 0;
            this.activeBuffer.size = 0;
        }

        // allocate from active buffer
        const activeBuffer = this.activeBuffer;
        const alignedStart = math.roundUp(activeBuffer.size, this.bufferAlignment);
        // Debug.assert(alignedStart + size <= this.bufferSize, `The allocation size of ${size} is larger than the buffer size of ${this.bufferSize}`);

        allocation.gpuBuffer = activeBuffer.gpuBuffer;
        allocation.offset = alignedStart;
        allocation.storage = activeBuffer.storage;

        // take the allocation from the buffer
        activeBuffer.size = alignedStart + size;
    }

    createBuffer(device: GPUDevice, size: number) {
        return device.createBuffer({
            size: size,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });
    }

    scheduleSubmit() {
        if (this.activeBuffer) {
            this.usedBuffers.push(this.activeBuffer);
            this.activeBuffer = null;
        }
    }

    submit() {

        // schedule currently active buffer for submit
        this.scheduleSubmit();

        // submit all used buffers
        const count = this.usedBuffers.length;
        if (count) {
            const device = this.device;
            const poolBuffers = this.poolBuffers;
            // run this loop backwards to preserve the order of buffers in gpuBuffers array
            for (let i = count - 1; i >= 0; i--) {
                const usedBuffer = this.usedBuffers[i];
                const { storage, gpuBuffer, offset, size } = usedBuffer;
                device.queue.writeBuffer(gpuBuffer, 0, storage, offset, size);
                poolBuffers.push(usedBuffer);
            }

            this.usedBuffers.length = 0;
        }
    }
}
