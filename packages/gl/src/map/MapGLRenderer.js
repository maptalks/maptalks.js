import { GLContext } from '@maptalks/fusiongl';
import createREGL from '@maptalks/regl';
import { Map, renderer } from '@maptalks/map';

export default class MapGLRenderer extends renderer.MapCanvasRenderer {
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

    clearLayerCanvasContext(layer) {
        if (!this.regl) {
            return;
        }
        const renderer = layer.getRenderer();
        this.regl.clear({
            depth: 1,
            stencil: 0
        });
        renderer.clearContext();
    }

    createContext() {
        const map = this.map;
        const attributes = {
            alpha: true,
            depth: true,
            stencil: true,
            preserveDrawingBuffer: map.options['preserveDrawingBuffer']
        };
        const gl = this.gl = createGLContext(this.canvas, attributes, map.options['onlyWebGL1']);
        this._initGL();

        gl.wrap = () => {
            const ctx = new GLContext(this.gl);
            return ctx;
        };

        this.reglGL = gl.wrap();
        const regl = this.regl = createREGL({
            gl: this.reglGL,
            attributes,
            extensions: map.options['extensions'],
            optionalExtensions: map.options['optionalExtensions']
        });
        this.context = {
            gl: this.gl,
            reglGL: this.reglGL,
            regl,
            getImageData: (sx, sy, sw, sh) => {
                const pixels = new Uint8ClampedArray(sw * sh * 4);
                const canvas = this.canvas;
                regl.read({
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
}

Map.registerRenderer('gl', MapGLRenderer);

function createGLContext(canvas, options, onlyWebGL1) {
    const names = onlyWebGL1 ? ['webgl', 'experimental-webgl'] : ['webgl2', 'webgl', 'experimental-webgl'];
    let gl = null;
    /* eslint-disable no-empty */
    for (let i = 0; i < names.length; ++i) {
        try {
            gl = canvas.getContext(names[i], options);
        } catch (e) {}
        if (gl) {
            break;
        }
    }
    if (!gl) {
        console.error('Browser doesn\'t support WebGL.');
    }
    return gl;
    /* eslint-enable no-empty */
}
