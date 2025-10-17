import { createWebGLContext } from '../layer/util/gl-context';
import { Map, renderer } from 'maptalks';

export default class MapGLRenderer extends renderer.MapAbstractRenderer {
    // createCanvas, createContext, getContextInstance, clearLayerCanvasContext 和 clearCanvas 方法都应该动态注入

    clearCanvas() {
        if (!this.regl) {
            return;
        }
        // depth and stencil will be cleared in clearLayerCanvasContext
        this.regl.clear({
            color: [0, 0, 0, 0]
        });
    }

    clearLayerCanvasContext() {
        if (!this.regl) {
            return;
        }
        // const renderer = layer.getRenderer();
        this.regl.clear({
            depth: 1,
            stencil: 0
        });
        // renderer.clearContext();
    }

    createContext() {
        const map = this.map;
        const { preserveDrawingBuffer, onlyWebGL1, extensions, optionalExtensions } = map.options;
        const canvas = map.getRenderer().canvas;
        const { gl, regl, reglGL, context } = createWebGLContext(canvas, preserveDrawingBuffer, onlyWebGL1, extensions, optionalExtensions);
        this.gl = gl;
        this.regl = regl;
        this.reglGL = reglGL;
        this.device = regl;
        this.context = context;
        return Promise.resolve();
    }

    _initGL() {
        const map = this.map;
        const gl = this.gl;
        const extensions = map.options['extensions'];
        if (extensions) {
            extensions.forEach(ext => {
                gl.getExtension(ext);
            });
        }
        const optionalExtensions = map.options['optionalExtensions'];
        if (optionalExtensions) {
            optionalExtensions.forEach(ext => {
                gl.getExtension(ext);
            });
        }
    }

    getContextInstance() {
        return this.gl.wrap();
    }

    isWebGL() {
        return true;
    }

    isWebGPU() {
        return false;
    }
}

Map.registerRenderer('gl', MapGLRenderer);

// Map.mergeOptions({
//     renderer: ['gl', 'gpu']
// });
