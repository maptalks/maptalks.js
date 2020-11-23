import TaaShader from './TaaShader.js';
import { vec2, mat4 } from 'gl-matrix';

const normalizedToClip = [
    2,  0,  0, 0,
    0,  2,  0, 0,
    0,  0,  -2, 0,
    -1, -1, 1, 1,
];

// const sampleOffsets = [
//     [-1.0, -1.0], [0.0, -1.0], [1.0, -1.0],
//     [-1.0,  0.0], [0.0,  0.0], [1.0,  0.0],
//     [-1.0,  1.0], [0.0,  1.0], [1.0,  1.0],
// ];

class TaaPass {
    constructor(renderer, jitter) {
        this._jitter = jitter;
        this._renderer = renderer;
        this._halton = [];
        this._counter = 0;
    }

    needToRedraw() {
        return this._counter < this._jitter.getSampleCount();
    }

    render(sourceTex, depthTex, projMatrix, needClear) {
        const jitter = this._jitter;
        this._initShaders();
        this._createTextures(sourceTex);
        if (needClear) {
            this._counter = 0;
        }
        this._counter++;
        const sampleCount = jitter.getSampleCount();
        if (this._counter >= sampleCount) {
            return this._prevTex;
        }
        if (this._fbo.width !== sourceTex.width || this._fbo.height !== sourceTex.height) {
            this._fbo.resize(sourceTex.width, sourceTex.height);
        }
        // console.log(this._counter, jitter.getJitter([]));
        const output = this._outputTex;
        const prevTex = this._prevTex;
        const uniforms = this._uniforms || {
            'materialParams_history_size': [prevTex.width, prevTex.height],
            'textureOutputSize': [],
            'materialParams': {
                alpha: 1,
                reprojection: [],
                filterWeights: []
            }
        };
        uniforms['materialParams']['alpha'] = 1 / this._counter;

        const reprojection = uniforms['materialParams']['reprojection'];
        mat4.multiply(reprojection, this._prevProjMatrix || projMatrix, mat4.invert(reprojection, projMatrix));
        mat4.multiply(reprojection, reprojection, normalizedToClip);

        vec2.set(uniforms['materialParams_history_size'], prevTex.width, prevTex.height);
        vec2.set(uniforms['textureOutputSize'], sourceTex.width, sourceTex.height);

        // const weights = uniforms['materialParams']['filterWeights'];
        // const filterWidth = 0.2;
        // let sum = 0;
        // for (let i = 0; i < 9; i++) {
        //     const d = vec2.sub([], sampleOffsets[i], currentJitter);
        //     d[0] *= 1.0 / filterWidth;
        //     d[1] *= 1.0 / filterWidth;
        //     // this is a gaussian fit of a 3.3 Blackman Harris window
        //     // see: "High Quality Temporal Supersampling" by Bruan Karis
        //     // weights[i] = std::exp2(-3.3 * (d.x * d.x + d.y * d.y));
        //     weights[i] = Math.pow(2, -3.3 * (d[0] * d[0] + d[0] * d[0]));

        //     sum += weights[i];
        // }
        // for (let i = 0; i < 9; i++) {
        //     weights[i] /= sum;
        // }

        uniforms['materialParams_depth'] = depthTex;
        uniforms['materialParams_color'] = sourceTex;
        uniforms['materialParams_history'] = prevTex;

        this._renderer.render(this._shader, uniforms, null, this._fbo);

        //pingpong pass
        const tempTex = this._outputTex;
        const tempFBO = this._fbo;
        this._outputTex = this._prevTex;
        this._fbo = this._prevFbo;
        this._prevTex = tempTex;
        this._prevFbo = tempFBO;
        this._prevProjMatrix = mat4.copy(this._prevProjMatrix || [], projMatrix);
        return output;
    }

    dispose() {
        if (this._shader) {
            this._shader.dispose();
            delete this._shader;
        }
        if (this._fbo) {
            this._fbo.destroy();
        }
        if (this._prevFbo) {
            this._prevFbo.destroy();
        }
        delete this._uniforms;
    }


    _createTextures(tex) {
        if (this._outputTex) {
            return;
        }
        const regl = this._renderer.regl;
        this._outputTex = this._createColorTex(tex);
        this._fbo = regl.framebuffer({
            width: tex.width,
            height: tex.height,
            colors: [this._outputTex],
            depth: false,
            stencil: false
        });
        this._prevTex = this._createColorTex(tex);
        this._prevFbo = regl.framebuffer({
            width: tex.width,
            height: tex.height,
            colors: [this._prevTex],
            depth: false,
            stencil: false
        });
    }

    _createColorTex(curTex) {
        const regl = this._renderer.regl;
        const type = 'uint8';
        const width = curTex.width, height = curTex.height;
        const color = regl.texture({
            min: 'linear',
            mag: 'linear',
            type,
            width,
            height
        });
        return color;
    }

    _initShaders() {
        if (!this._shader) {
            this._shader = new TaaShader();
        }
    }

    /*_clearTex() {
        const regl = this._renderer.regl;
        const color = [0, 0, 0, 0];
        regl.clear({
            color,
            framebuffer: this._fbo
        });
        regl.clear({
            color,
            framebuffer: this._prevFbo
        });
    }*/
}

export default TaaPass;
