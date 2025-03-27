import { getSupportedFormats, isNumber } from "../common/Util";
import Geometry from "../Geometry";
import DynamicBufferPool from "./DynamicBufferPool";
import GraphicsFramebuffer from "./GraphicsFramebuffer";
import GraphicsTexture from "./GraphicsTexture";

export default class GraphicsDevice {
    wgpu: GPUDevice;
    context: GPUCanvasContext;
    adapter: GPUAdapter;
    gltfManager?: any;
    //@internal
    commandBuffers: GPUCommandBuffer[] = [];
    //@internal
    dynamicBufferPool: DynamicBufferPool;
    //@internal
    commandEncoder: GPUCommandEncoder;
    //@internal
    _defaultFramebuffer: GraphicsFramebuffer;
    //@internal
    _readTargets: Record<number, GPUBuffer> = {};
    _supportedFormats: any;

    constructor(device: GPUDevice, context: GPUCanvasContext, adapter: GPUAdapter) {
        this.wgpu = device;
        this.adapter = adapter;
        const presentationFormat = navigator.gpu.getPreferredCanvasFormat();
        context.configure({
            device,
            format: presentationFormat,
            alphaMode: 'premultiplied'
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

    // mock of regl's hasExtension
    hasExtension(extension) {
        if (!this._supportedFormats) {
            this._supportedFormats = getSupportedFormats(this.wgpu);
        }
        if (this._supportedFormats[extension]) {
            return true;
        }
        //TODO 这里可能存在webgl支持，但webgpu不支持的扩展
        return true;
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
            const cb = commandEncoder.finish();
            this.addCommandBuffer(cb, false);
            this.commandEncoder = null;
        }
    }

    _getDefaultFramebuffer() {
        let fbo = this._defaultFramebuffer;
        if (!fbo) {
            const canvas = this.context.canvas;
            fbo = this._defaultFramebuffer = new GraphicsFramebuffer(this, {
                width: canvas.width,
                height: canvas.height,
                depthStencil: true
            });
        }
        return fbo;
    }

    getRenderPassEncoder(fbo: GraphicsFramebuffer) {
        fbo = fbo || this._getDefaultFramebuffer();
        const desc = fbo.getRenderPassDescriptor();
        if (fbo === this._defaultFramebuffer) {
            desc.colorAttachments[0].view = this.context
                .getCurrentTexture()
                .createView();
            desc.colorAttachments[0].view.label = 'default canvas view';
        }
        const commandEncoder = this.getCommandEncoder();
        return commandEncoder.beginRenderPass(desc);
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

    // implementation of regl.buffer
    buffer(options) {
        return Geometry.createBuffer(this, options, options.name);
    }

    // implementation of regl.framebuffer
    framebuffer(width, height) {
        let reglFBODescriptor;
        if (!isNumber(width)) {
            reglFBODescriptor = width;
        } else {
            if (height === undefined) {
                height = width;
            }
            reglFBODescriptor = { color: true, depthStencil: true, width, height };
        }
        return new GraphicsFramebuffer(this, reglFBODescriptor);
    }

    // implementation of regl.texture
    texture(config) {
        if (isNumber(config)) {
            config = {
                width: config,
                height: config
            };
        }
        return new GraphicsTexture(this, config);
    }

    // implementation of regl.clear
    clear(options) {
        const fbo = options.fbo || this._getDefaultFramebuffer();
        fbo.setClearOptions(options);
    }


    // implementation of regl.read
    read(options) {
        // https://github.com/tensorflow/tfjs/pull/7576/files
        // 可以参考tf.js实现同步读取数据。
        // 1. 将数据绘制到一个OffscreenCanvas
        // 2. 将OffscreenCanvas绘制到一个canvas 2d上
        // 3. 从canvas 2d上读取数据
        const framebuffer = options.framebuffer || this._defaultFramebuffer;
        let { width, height } = options;
        if (!width) {
            width = framebuffer.width;
        }
        if (!height) {
            height = framebuffer.height;
        }
        const device = this.wgpu;
        const colorTexture = framebuffer.colorTexture;
        if (!colorTexture) {
            return;
        }
        const { bytesPerTexel } = colorTexture.gpuFormat;
        let bytesPerRow = options.width * bytesPerTexel;
		bytesPerRow = Math.ceil( bytesPerRow / 256 ) * 256; // Align to 256 bytes
        const encoder = device.createCommandEncoder();

        const bufferSize = width * height * bytesPerTexel;
        let readBuffer = this._readTargets[bufferSize];
        if (!readBuffer) {
            readBuffer = device.createBuffer(
                {
                    size: width * height * bytesPerTexel,
                    usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ
                }
            );
        }

		encoder.copyTextureToBuffer(
			{
				texture: colorTexture.texture,
				origin: { x: options.x, y: options.y, z: 0 },
			},
			{
				buffer: readBuffer,
				bytesPerRow: bytesPerRow
			},
			{
				width,
				height
			}
		);

		// const typedArrayType = options.data.constructor;
		// device.queue.submit([encoder.finish()]);
		// await readBuffer.mapAsync(GPUMapMode.READ);
		// const buffer = readBuffer.getMappedRange();
		// const result = new typedArrayType(buffer);
        // options.data.set(result);
        // readBuffer.unmap();
    }

    destroy() {
        if (this._defaultFramebuffer) {
            this._defaultFramebuffer.destroy();
            delete this._defaultFramebuffer;
        }
        for (const p in this._readTargets) {
            const buffer = this._readTargets[p];
            if (buffer) {
                buffer.destroy();
            }
        }
        this._readTargets = {};
    }
}
