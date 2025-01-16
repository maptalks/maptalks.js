import DynamicBufferPool from "./DynamicBufferPool";

export default class GraphicsDevice {
    wgpu: GPUDevice;
    commandBuffers: GPUCommandBuffer[];
    dynamicBufferPool: DynamicBufferPool;
    context: GPUCanvasContext;
    _defaultRenderTarget: GPURenderPassDescriptor;
    commandEncoder: GPUCommandEncoder;
    _currentRenderPass: GPURenderPassEncoder;

    constructor(device: GPUDevice, context: GPUCanvasContext) {
        this.wgpu = device;
        const presentationFormat = navigator.gpu.getPreferredCanvasFormat();
        context.configure({
            device,
            format: presentationFormat,
        });
        this.context = context;
        // 1M for each buffer
        const bufferSize = 1024 * 1024;
        const limits = device.limits;
        this.dynamicBufferPool = new DynamicBufferPool(
            device,
            bufferSize,
            limits.minUniformBufferOffsetAlignment,
        );
    }

    getCommandEncoder(): GPUCommandEncoder {
        // use existing or create new encoder
        let commandEncoder = this.commandEncoder;
        if (!commandEncoder) {
            commandEncoder = this.wgpu.createCommandEncoder();
            this.commandEncoder = commandEncoder;
        }

        return commandEncoder;
    }

    endCommandEncoder() {
        const { commandEncoder } = this;
        if (commandEncoder) {
            commandEncoder.finish();
            // this.addCommandBuffer(cb);
            this.commandEncoder = null;
        }
    }

    getDefaultRenderPassEncoder() {
        let rendrTarget = this._defaultRenderTarget
        if (!rendrTarget) {
            const canvas = this.context.canvas;
            const depthTexture = this.wgpu.createTexture({
                size: [canvas.width, canvas.height],
                format: 'depth24plus',
                usage: GPUTextureUsage.RENDER_ATTACHMENT,
            });
            rendrTarget = this._defaultRenderTarget = {
                colorAttachments: [
                    {
                        view: undefined, // Assigned later
                        clearValue: [0, 0, 0, 0],
                        loadOp: "clear",
                        storeOp: "store",
                    },
                ],
                depthStencilAttachment: {
                    view: depthTexture.createView(),
                    depthClearValue: 1.0,
                    depthLoadOp: "clear",
                    depthStoreOp: "store",
                },
            };
        }
        rendrTarget.colorAttachments[0].view = this.context
            .getCurrentTexture()
            .createView();
        const commandEncoder = this.getCommandEncoder();
        return commandEncoder.beginRenderPass(rendrTarget);
    }

    addCommandBuffer(commandBuffer: GPUCommandBuffer, front: boolean) {
        if (front) {
            this.commandBuffers.unshift(commandBuffer);
        } else {
            this.commandBuffers.push(commandBuffer);
        }
    }

    submit() {
        // end the current encoder
        this.endCommandEncoder();
        // copy dynamic buffers data to the GPU (this schedules the copy CB to run before all other CBs)
        this.dynamicBufferPool.submit();
        if (this.commandBuffers.length > 0) {
            this.wgpu.queue.submit(this.commandBuffers);
            this.commandBuffers.length = 0;
        }
    }

    framebuffer(reglFBODescriptor) {
        // reglDesciprtor => gpu renderPassEncoder
    }

    texture(reglTextureDescriptor) {
        // regl texture descriptor => GPUTexture
    }
}
