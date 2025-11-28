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
    gpuDevice = await gpuAdapter?.requestDevice({
        // requiredLimits: {
        //     maxVertexBuffers: 16
        // }
    });
    return { gpuDevice, gpuAdapter };
}

export default class MapGPURenderer extends MapGLRenderer {
    device: any;

    drawLayers(layers: Layer[], framestamp: number) {
        const updated = super.drawLayers(layers, framestamp);
        if (updated) {
            this.device.submit();
        }
        return updated;
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
