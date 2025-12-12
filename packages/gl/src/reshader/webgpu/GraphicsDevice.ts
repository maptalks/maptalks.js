import { getSupportedFormats, isNumber } from "../common/Util";
import Geometry from "../Geometry";
import DynamicBufferPool from "./DynamicBufferPool";
import GraphicsFramebuffer from "./GraphicsFramebuffer";
import GraphicsTexture from "./GraphicsTexture";

let uid = 0;

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
    //@internal
    _supportedFormats: any;
    //@internal
    _drawCount: 0;

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

    getDefaultFramebuffer() {
        let fbo = this._defaultFramebuffer;
        if (!fbo) {
            const canvas = this.context.canvas;
            fbo = this._defaultFramebuffer = new GraphicsFramebuffer(this, {
                width: canvas.width,
                height: canvas.height,
                depthStencil: true
            });
            (fbo as any).uid = uid++;
        }
        return fbo;
    }

    getRenderPassEncoder(fbo: GraphicsFramebuffer) {
        fbo = fbo || this.getDefaultFramebuffer();
        const desc = fbo.getRenderPassDescriptor();
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

    preserveDrawingBuffer(canvas) {
        canvas.width = this.context.canvas.width;
        canvas.height = this.context.canvas.height;
        canvas.getContext('2d').drawImage(this.context.canvas, 0, 0);
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
    texture(width, height?) {
        let config = width;
        if (isNumber(width)) {
            config = {
                width,
                height: isNumber(height) ? height : width
            };
        }
        return new GraphicsTexture(this, config);
    }

    // implementation of regl.clear
    clear(options) {
        const fbo = (options.framebuffer || this.getDefaultFramebuffer()) as GraphicsFramebuffer;
        fbo.setClearOptions(options);
    }


    // implementation of regl.read
    read(options) {
        // https://github.com/tensorflow/tfjs/pull/7576/files
        // https://github.com/tensorflow/tfjs/blob/master/tfjs-backend-webgpu/src/backend_webgpu.ts#L379
        // 可以参考tf.js实现同步读取数据。
        // 1. 将数据绘制到一个OffscreenCanvas
        // 2. 将OffscreenCanvas绘制到一个canvas 2d上
        // 3. 从canvas 2d上读取数据
        const framebuffer = options.framebuffer || this._defaultFramebuffer;
        const fboWidth = framebuffer.width;
        const fboHeight = framebuffer.height;
        let { width, height } = options;
        if (!width) {
            width = fboWidth;
        }
        if (!height) {
            height = fboHeight;
        }
        const device = this.wgpu;
        this.submit();
        // regl.read 参数y从左上角开始，但读取的结果垂直翻转（webgpu不会垂直翻转）
        // 因此为了和webgl保持一致，webgpu 原点的 y 是距离底部 y + height 像素处，并将结果图像上下翻转
        const origin = { x: options.x, y: fboHeight - options.y - height, z: 0 };
        // if (origin.x + width > fboWidth) {
        //     origin.x = fboWidth - width;
        // }
        // if (origin.y + height > fboHeight) {
        //     origin.y = fboHeight - height;
        // }
        const data = options.pixels || new Uint8Array(width * height * 4);
        if (framebuffer === this._defaultFramebuffer) {
            // read default framebuffer
            const stagingHostStorage = new OffscreenCanvas(width, height);
            const ctx = stagingHostStorage.getContext('2d', {
                willReadFrequently: true,
            });
            ctx.drawImage(this.context.canvas, origin.x, origin.y, width, height, 0, 0, width, height);
            const stagingValues = ctx.getImageData(0, 0, width, height).data;
            for (let k = 0; k < data.length; k += 4) {
                data[k] = stagingValues[k];
                data[k + 1] = stagingValues[k + 1];
                data[k + 2] = stagingValues[k + 2];
                data[k + 3] = stagingValues[k + 3];
            }
            return data;
        }
        const alphaModes: GPUCanvasAlphaMode[] = ['opaque', 'premultiplied'];
        const stagingDeviceStorage: OffscreenCanvas[] =
            alphaModes.map(() => new OffscreenCanvas(width, height));
          // TODO: use rgba8unorm format when this format is supported on Mac.
          // https://bugs.chromium.org/p/chromium/issues/detail?id=1298618
        stagingDeviceStorage.map((storage, index) => {
            const context = storage.getContext('webgpu');
            context.configure({
                device,
                format: 'rgba8unorm',
                usage: GPUTextureUsage.COPY_DST,
                alphaMode: alphaModes[index]
            });
            return context.getCurrentTexture();
        }).map((storageTexture, index) => {
            const encoder = device.createCommandEncoder();
            encoder.copyTextureToTexture({ texture: framebuffer.colorTexture.texture, origin }, { texture: storageTexture }, { width, height });
            this.wgpu.queue.submit([encoder.finish()]);
            const stagingHostStorage = new OffscreenCanvas(width, height);
            const ctx = stagingHostStorage.getContext('2d', {
                willReadFrequently: true,
            });
            // 为了和webgl保持一致，垂直翻转图像
            ctx.scale(1, -1);
            ctx.drawImage(stagingDeviceStorage[index], 0, -height);

            const stagingValues = ctx.getImageData(0, 0, width, height).data;
            const alphaMode = alphaModes[index];
            for (let k = 0; k < data.length; k += 4) {
                if (alphaMode === 'premultiplied') {
                    // premultiplied 模式获取 a
                    data[k + 3] = stagingValues[k + 3];
                } else {
                    // opaque模式获取rgb
                    data[k] = stagingValues[k];
                    data[k + 1] = stagingValues[k + 1];
                    data[k + 2] = stagingValues[k + 2];
                }
            }
        });
        return data;


        // const { bytesPerTexel } = colorTexture.gpuFormat;
        // let bytesPerRow = options.width * bytesPerTexel;
		// bytesPerRow = Math.ceil( bytesPerRow / 256 ) * 256; // Align to 256 bytes
        // const encoder = device.createCommandEncoder();

        // const bufferSize = width * height * bytesPerTexel;
        // let readBuffer = this._readTargets[bufferSize];
        // if (!readBuffer) {
        //     readBuffer = device.createBuffer(
        //         {
        //             size: width * height * bytesPerTexel,
        //             usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ
        //         }
        //     );
        // }

		// encoder.copyTextureToBuffer(
		// 	{
		// 		texture: colorTexture.texture,
		// 		origin: { x: options.x, y: options.y, z: 0 },
		// 	},
		// 	{
		// 		buffer: readBuffer,
		// 		bytesPerRow: bytesPerRow
		// 	},
		// 	{
		// 		width,
		// 		height
		// 	}
		// );

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
        if (this.dynamicBufferPool) {
            this.dynamicBufferPool.destroy();
            delete this.dynamicBufferPool;
        }
        for (const p in this._readTargets) {
            const buffer = this._readTargets[p];
            if (buffer) {
                buffer.destroy();
            }
        }
        this._readTargets = {};
    }

    incrDrawCall() {
        this._drawCount++;
    }

    resetDrawCalls() {
        this._drawCount = 0;
    }

    getDrawCalls() {
        return this._drawCount;
    }
}
