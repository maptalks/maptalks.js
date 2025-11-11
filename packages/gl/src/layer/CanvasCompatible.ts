import * as maptalks from 'maptalks';
import { createWebGLContext } from './util/gl-context';

const canvasCompatible = function <T extends maptalks.MixinConstructor>(Base: T) {
    const compatible = class extends Base {
        [x: string]: any;
        // create context in MapCanvasRenderer
        createContext() {
            this.createCanvas();
            const map = this.getMap();
            const { preserveDrawingBuffer, onlyWebGL1, extensions, optionalExtensions } = map.options;
            const { gl, regl, reglGL, context } = createWebGLContext(this.canvas, preserveDrawingBuffer, onlyWebGL1, extensions, optionalExtensions);
            this.gl = gl;
            this.regl = regl;
            this.reglGL = reglGL;
            this.context = context;
            this.context.device = regl;
            this.device = this.regl;
        }
    }
    return compatible;
};

export default canvasCompatible;
