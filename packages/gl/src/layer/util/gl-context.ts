import { GLContext } from '@maptalks/fusiongl';
import createREGL from '@maptalks/regl';

export function createWebGLContext(canvas: HTMLCanvasElement, preserveDrawingBuffer: boolean, onlyWebGL1: boolean, extensions: string[], optionalExtensions: string[]) {
    const attributes = {
        alpha: true,
        depth: true,
        stencil: true,
        preserveDrawingBuffer: preserveDrawingBuffer
    };
    const gl = createGLContext(canvas, attributes, onlyWebGL1);
    initGL(gl, extensions, optionalExtensions);

    gl.wrap = () => {
        const ctx = new GLContext(gl);
        return ctx;
    };

    const reglGL = gl.wrap();
    const regl = createREGL({
        gl: reglGL,
        attributes,
        extensions: extensions,
        optionalExtensions: optionalExtensions
    });
    const context = {
        gl: gl,
        reglGL: reglGL,
        regl,
        getImageData: (sx, sy, sw, sh) => {
            const pixels = new Uint8Array(sw * sh * 4);
            (regl as any).read({
                x: sx,
                y: canvas.height - sy,
                width: sw,
                height: sh,
                data: pixels
            });
            return new ImageData(new Uint8ClampedArray(pixels.buffer), sw, sh);
        }
    };
    return {
        gl, reglGL, regl, context
    };
}

function initGL(gl, extensions, optionalExtensions) {


    if (extensions) {
        extensions.forEach(ext => {
            gl.getExtension(ext);
        });
    }

    if (optionalExtensions) {
        optionalExtensions.forEach(ext => {
            gl.getExtension(ext);
        });
    }
}



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
