import { GraphicsDevice } from '@maptalks/reshader.gl';
import { Layer, Map, renderer } from 'maptalks';

let gpuDevice;

async function initGPUDevice() {
    if (gpuDevice) {
        return gpuDevice;
    }
    const adapter = await navigator.gpu?.requestAdapter();
    gpuDevice = await adapter?.requestDevice();
    return gpuDevice;
}

export default class MapGPURenderer extends renderer.MapAbstractRenderer {
    device: GraphicsDevice;
    gpuDevice: GPUDevice;

    drawLayers(layers: Layer[], framestamp: number) {
        const updated = super.drawLayers(layers, framestamp);
        if (updated) {
            this.device.submit();
        }
        return updated;
    }

    clearCanvas() {
        if (!this.device) {
            return;
        }
        // depth and stencil will be cleared in clearLayerCanvasContext
        this.device.clear({
            color: [0, 0, 0, 0]
        });
    }

    clearLayerCanvasContext(layer) {
        if (!this.device) {
            return;
        }
        const renderer = layer.getRenderer();
        this.device.clear({
            depth: 1,
            stencil: 0
        });
        renderer.clearContext();
    }

    async createContext() {
        this.gpuDevice = await initGPUDevice();
        const context = this.canvas.getContext('webgpu');
        this.device = new GraphicsDevice(this.gpuDevice, context);

        this.context = {
            context,
            gpuDevice: this.gpuDevice,
            device: this.device,
            getImageData: (sx, sy, sw, sh) => {
                const pixels = new Uint8ClampedArray(sw * sh * 4);
                const canvas = this.canvas;
                this.device.read({
                    x: sx,
                    y: canvas.height - sy,
                    width: sw,
                    height: sh,
                    data: pixels
                });
                return new ImageData(pixels, sw, sh);
            }
        };
    }
}

Map.registerRenderer('gpu', MapGPURenderer);
