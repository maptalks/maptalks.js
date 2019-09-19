import { Map, renderer } from 'maptalks';
import createREGL from '@maptalks/regl';
import PostProcess from '../layer/postprocess/PostProcess.js';

let postCanvas;
let regl;
let texture;
let postProcess;
const CLEAR_COLOR = {
    color: [0, 0, 0, 0]
};
const DEFAULT_CONFIG = { enable: true };

Map.include({
    setPostProcessConfig(config) {
        this.options['postProcessConfig'] = config;
        return this;
    },

    getPostProcessConfig() {
        return this.options['postProcessConfig'];
    }
});

const drawLayerCanvas = renderer.MapCanvasRenderer.prototype.drawLayerCanvas;
renderer.MapCanvasRenderer.prototype.drawLayerCanvas = function () {
    const updated = drawLayerCanvas.apply(this, arguments);
    if (updated) {
        doPostProcess(this, this.canvas);
    }
    return updated;
};

const renderFrame = renderer.MapCanvasRenderer.prototype.renderFrame;
renderer.MapCanvasRenderer.prototype.renderFrame = function () {
    const rendered = renderFrame.apply(this, arguments);
    const config = this.map.getPostProcessConfig();
    //filmicGrain animation
    const grainConfig = config && config.filmicGrain;
    if (grainConfig && (grainConfig.enable === undefined || grainConfig.enable === true)) {
        this.setLayerCanvasUpdated();
    }
    return rendered;
};

function doPostProcess(renderer, canvas) {
    if (!postCanvas) {
        createContext(canvas.width, canvas.height);
    }
    const config = renderer.map.getPostProcessConfig();
    if (!config || !config.enable) {
        return;
    }
    if (postCanvas.width !== canvas.width || postCanvas.height !== canvas.height) {
        postCanvas.width = canvas.width;
        postCanvas.height = canvas.height;
    }
    regl.clear(CLEAR_COLOR);
    const grainConfig = config.filmicGrain || DEFAULT_CONFIG;
    if (grainConfig.enable === undefined) {
        grainConfig.enable = true;
    }
    const vignetteConfig = config.vignette || DEFAULT_CONFIG;
    if (vignetteConfig.enable === undefined) {
        vignetteConfig.enable = true;
    }
    const uniforms = {
        'enableGrain': +!!grainConfig.enable,
        'enableVignette': +!!vignetteConfig.enable,
        'grainFactor': grainConfig.factor === undefined ? 0.15 : grainConfig.factor,
        'timeGrain': performance.now(),
        'lensRadius': vignetteConfig.lensRadius || [0.8, 0.25],
        'frameMod': 1
    };
    postProcess.run(uniforms, texture({
        width: postCanvas.width,
        height: postCanvas.height,
        data: canvas,
        flipY: true,
        mag: 'linear',
        min: 'linear',
        mipmap: false
    }));
    if (grainConfig.enable) {
        renderer.setLayerCanvasUpdated();
    }
    renderer.context.drawImage(postCanvas, 0, 0, postCanvas.width, postCanvas.height);
}

function createContext(width, height) {
    postCanvas = document.createElement('canvas', width, height);
    const viewport = {
        x: 0,
        y: 0,
        width: () => {
            return postCanvas.width;
        },
        height: () => {
            return postCanvas.height;
        }
    };
    regl = createREGL({
        canvas: postCanvas,
        attributes: {
            depth: false,
            stencil: false,
            alpha: true,
            antialias: false,
            premultipliedAlpha: false
        }
    });
    texture = regl.texture({
        mag: 'linear',
        min: 'linear',
        mipmap: false,
        flipY: true,
        width,
        height
    });
    postProcess = new PostProcess(regl, viewport);
}
