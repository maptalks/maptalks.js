import { GraphicsDevice } from '../reshader';
import MapGLRenderer from './MapGLRenderer';
import { Layer, Map } from 'maptalks';

let gpuAdapter;
let gpuDevice;

async function initGPUDevice() {
    if (gpuDevice) {
        return { gpuDevice, gpuAdapter };
    }
    gpuAdapter = await navigator.gpu?.requestAdapter();
    // WebGPU 默认每个 pipeline 最多 8 个 vertex buffer，而 vector 渲染路径中
    // 同一条线的多 symbol 合并进同一 geometry（含逐feature深度偏置 aLineDepthBias 等）
    // 可能同时需要 9 个以上的顶点属性，超限会导致 limit_defines.js 按 maxVertexBuffers
    // 把 HAS_LINE_DEPTH_BIAS 等 defines 裁剪掉（表现为 GPU 后端失效）。
    // 因此把设备上限提高到适配器支持范围以内的 16。
    let requestOptions: any;
    if (gpuAdapter && gpuAdapter.limits && gpuAdapter.limits.maxVertexBuffers > 8) {
        requestOptions = {
            requiredLimits: {
                maxVertexBuffers: Math.min(16, gpuAdapter.limits.maxVertexBuffers)
            }
        };
    }
    gpuDevice = await gpuAdapter?.requestDevice(requestOptions);
    return { gpuDevice, gpuAdapter };
}

export default class MapGPURenderer extends MapGLRenderer {
    device: any;

    drawLayers(layers: Layer[], framestamp: number) {
        const updated = super.drawLayers(layers, framestamp);
        if (updated) {
            this.device.submit();
            if (this.map.options['preserveGpuDrawingBuffer']) {
                const mapCanvas = this.canvas as any;
                const canvas = mapCanvas.readbackCanvas =  mapCanvas.readbackCanvas || document.createElement('canvas');
                this.device.preserveDrawingBuffer(canvas);
            }
        }
        return updated;
    }

    toDataURL(mimeType: string, quality?: number) {
        if (!this.canvas) {
            return null;
        }
        const mapCanvas = this.canvas as any;
        const canvas = mapCanvas.readbackCanvas =  mapCanvas.readbackCanvas || document.createElement('canvas');
        if (!this.map.options['preserveGpuDrawingBuffer']) {
            this.setForceRedraw();
            const timestamp = this.getFrameTimestamp();
            this.renderFrame(timestamp);
            this.device.preserveDrawingBuffer(canvas);
        }
        return canvas.toDataURL(mimeType, quality);
    }

    createContext() {
        return initGPUDevice().then(({ gpuDevice, gpuAdapter }) => {
            const context = this.canvas.getContext('webgpu');
            this.device = new GraphicsDevice(gpuDevice, context, gpuAdapter);

            this.context = {
                context,
                device: this.device,
                getImageData: (sx, sy, sw, sh) => {
                    const pixels = new Uint8Array(sw * sh * 4);
                    const canvas = this.canvas;
                    this.device.read({
                        x: sx,
                        y: canvas.height - sy,
                        width: sw,
                        height: sh,
                        data: pixels
                    });
                    return new ImageData(new Uint8ClampedArray(pixels.buffer), sw, sh);
                }
            };
        });
    }

    isWebGL() {
        return false;
    }

    isWebGPU() {
        return true;
    }
}

Map.registerRenderer('gpu', MapGPURenderer);
