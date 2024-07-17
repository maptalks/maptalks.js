import { Map, renderer } from 'maptalks';
import createREGL from '@maptalks/regl';
import PostProcess from '../layer/postprocess/PostProcess';

let postCanvas;
let regl;
let texture;
let emptyLutTexture;
let postProcess;
const CLEAR_COLOR = {
    color: [0, 0, 0, 0]
};
const DEFAULT_CONFIG = { enable: false };

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
    const config = renderer.map.getPostProcessConfig();
    if (!config || !config.enable) {
        return;
    }
    if (!postCanvas) {
        createContext(canvas.width, canvas.height);
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
    const lutConfig = config.colorLUT || DEFAULT_CONFIG;
    if (lutConfig.enable === undefined) {
        lutConfig.enable = true;
    }
    if (!renderer._postProcessContext) {
        renderer._postProcessContext = {};
    }
    const context = renderer._postProcessContext;
    if (lutConfig.enable) {
        const url = lutConfig.lut;
        if (!context['lutTexture'] || context['lutTexture'].url !== url) {
            const image = new Image();
            image.onload = function () {
                const texInfo = {
                    data: image,
                    min: 'linear',
                    mag: 'linear'
                };
                const texture = context['lutTexture'] ? context['lutTexture'].texture(texInfo) : regl.texture(texInfo);
                context['lutTexture'] = {
                    url,
                    texture
                };
                renderer.setLayerCanvasUpdated();
            };
            image.src = url;
        }
    }
    const uniforms = {
        'enableGrain': +!!grainConfig.enable,
        'grainFactor': grainConfig.factor === undefined ? 0.15 : grainConfig.factor,
        'timeGrain': performance.now(),

        'enableVignette': +!!vignetteConfig.enable,
        'lensRadius': vignetteConfig.lensRadius || [0.8, 0.25],
        'frameMod': 1,

        'enableLut': +!!lutConfig.enable,
        'lookupTable': context['lutTexture'] ? context['lutTexture'].texture : emptyLutTexture
    };
    if (!postProcess) {
        postProcess = new PostProcess(regl);
    }
    postProcess.postprocess(null, uniforms, texture({
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
    // const viewport = {
    //     x: 0,
    //     y: 0,
    //     width: () => {
    //         return postCanvas.width;
    //     },
    //     height: () => {
    //         return postCanvas.height;
    //     }
    // };
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
    emptyLutTexture = regl.texture();
}
