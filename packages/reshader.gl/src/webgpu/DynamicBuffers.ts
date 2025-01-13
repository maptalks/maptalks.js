import * as math from './common/math';

export default class DynamicBuffers {

    /**
     * Allocation size of the underlying buffers.
     *
     * @type {number}
     */
    bufferSize;

    /**
     * Internally allocated gpu buffers.
     *
     * @type {DynamicBuffer[]}
     */
    gpuBuffers = [];

    /**
     * Internally allocated staging buffers (CPU writable)
     *
     * @type {DynamicBuffer[]}
     */
    stagingBuffers = [];

    /**
     * @type {UsedBuffer[]}
     */
    usedBuffers = [];

    /**
     * @type {UsedBuffer|null}
     */
    activeBuffer = null;
    device: GPUDevice;
    bufferAlignment: any;

    /**
     * Create the system of dynamic buffers.
     *
     * @param {GraphicsDevice} device - The graphics device.
     * @param {number} bufferSize - The size of the underlying large buffers.
     * @param {number} bufferAlignment - Alignment of each allocation.
     */
    constructor(device, bufferSize, bufferAlignment) {
        this.device = device;
        this.bufferSize = bufferSize;
        this.bufferAlignment = bufferAlignment;
    }

    /**
     * Destroy the system of dynamic buffers.
     */
    destroy() {

        this.gpuBuffers.forEach((gpuBuffer) => {
            gpuBuffer.destroy(this.device);
        });
        this.gpuBuffers = null;

        this.stagingBuffers.forEach((stagingBuffer) => {
            stagingBuffer.destroy(this.device);
        });
        this.stagingBuffers = null;

        this.usedBuffers = null;
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
            let gpuBuffer = this.gpuBuffers.pop();
            if (!gpuBuffer) {
                gpuBuffer = this.createBuffer(this.device, this.bufferSize, false);
            }

            // staging buffer
            let stagingBuffer = this.stagingBuffers.pop();
            if (!stagingBuffer) {
                stagingBuffer = this.createBuffer(this.device, this.bufferSize, true);
            }

            this.activeBuffer = new UsedBuffer();
            this.activeBuffer.stagingBuffer = stagingBuffer;
            this.activeBuffer.gpuBuffer = gpuBuffer;
            this.activeBuffer.offset = 0;
            this.activeBuffer.size = 0;
        }

        // allocate from active buffer
        const activeBuffer = this.activeBuffer;
        const alignedStart = math.roundUp(activeBuffer.size, this.bufferAlignment);
        Debug.assert(alignedStart + size <= this.bufferSize, `The allocation size of ${size} is larger than the buffer size of ${this.bufferSize}`);

        allocation.gpuBuffer = activeBuffer.gpuBuffer;
        allocation.offset = alignedStart;
        allocation.storage = activeBuffer.stagingBuffer.alloc(alignedStart, size);

        // take the allocation from the buffer
        activeBuffer.size = alignedStart + size;
    }

    createBuffer(device, size, isStaging) {
        return new WebgpuDynamicBuffer(device, size, isStaging);
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
    }
}

export { DynamicBuffers, DynamicBufferAllocation };
