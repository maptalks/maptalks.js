import TaaShader from './TaaShader.js';
import { vec2, vec4 } from 'gl-matrix';

const JITTER = [];

class TaaPass {
    constructor(renderer, jitter) {
        this._jitter = jitter;
        this._renderer = renderer;
        this._halton = [];
        this._nearfar = [];
        this._counter = 0;
    }

    needToRedraw() {
        return this._counter < this._jitter.getSampleCount();
    }

    render(sourceTex, depthTex, projMatrix, pvMatrix, invViewMatrix, fov, near, far, needClear) {
        const jitter = this._jitter;
        const currentJitter = jitter.getJitter(JITTER);
        this._initShaders();
        this._createTextures(sourceTex);
        if (needClear) {
            this._counter = 0;
        }
        this._counter++;
        const sampleCount = jitter.getSampleCount();
        if (this._counter >= sampleCount && !needClear) {
            return this._prevTex;
        }
        if (this._fbo.width !== sourceTex.width || this._fbo.height !== sourceTex.height) {
            this._fbo.resize(sourceTex.width, sourceTex.height);
        }
        const output = this._outputTex;
        const prevTex = this._prevTex;
        const uniforms = this._uniforms || {
            'uTextureDepthSize': [depthTex.width, depthTex.height],
            'uTextureDepthRatio': [1, 1],
            'uTextureInputRatio': [1, 1],
            'uTextureInputSize': [sourceTex.width, sourceTex.height],
            'uTextureOutputRatio': [1, 1],
            'uTextureOutputSize': [sourceTex.width, sourceTex.height],
            'uTexturePreviousRatio': [1, 1],
            'uTexturePreviousSize': [prevTex.width, prevTex.height],
            'uSSAARestart': 0,
            'uTaaEnabled': 1,
        };
        uniforms['uClipAABBEnabled'] = 0;
        uniforms['fov'] = fov;
        uniforms['uProjectionMatrix'] = projMatrix;
        uniforms['uTaaCurrentFramePVLeft'] = pvMatrix;
        uniforms['uTaaInvViewMatrixLeft'] = invViewMatrix;
        uniforms['uTaaLastFramePVLeft'] = this._prevPvMatrix || pvMatrix;
        uniforms['TextureDepth'] = depthTex;
        uniforms['TextureInput'] = sourceTex;
        uniforms['TexturePrevious'] = prevTex;
        uniforms['uHalton'] = vec4.set(this._halton, currentJitter[0], currentJitter[1], needClear ? 1.0 : 2.0, this._counter);
        uniforms['uNearFar'] = vec2.set(this._nearfar, near, far);
        vec2.set(uniforms['uTextureDepthSize'], depthTex.width, depthTex.height);
        vec2.set(uniforms['uTextureInputSize'], sourceTex.width, sourceTex.height);
        vec2.set(uniforms['uTextureOutputSize'], output.width, output.height);
        vec2.set(uniforms['uTexturePreviousSize'], prevTex.width, prevTex.height);

        this._renderer.render(this._shader, uniforms, null, this._fbo);

        //pingpong pass
        const tempTex = this._outputTex;
        const tempFBO = this._fbo;
        this._outputTex = this._prevTex;
        this._fbo = this._prevFbo;
        this._prevTex = tempTex;
        this._prevFbo = tempFBO;
        this._prevPvMatrix = pvMatrix;
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
