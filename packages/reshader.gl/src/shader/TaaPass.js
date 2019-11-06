import TaaShader from './TaaShader.js';
import { vec2, vec4, mat4 } from 'gl-matrix';

class TaaPass {
    constructor(renderer, viewport, jitter) {
        this._jitter = jitter;
        this._renderer = renderer;
        this._viewport = viewport;
        this._halton = [];
        this._nearfar = [];
        this._counter = 0;
        this._taaCounter = 0;
        this._ssCounter = 0;
        this._sampleCount = 15;
    }

    needToRedraw() {
        return this._counter < this._sampleCount;
    }

    render(sourceTex, depthTex, pvMatrix, invViewMatrix, prevPvMatrix, fov, jitter, near, far, needClear) {
        prevPvMatrix = prevPvMatrix || pvMatrix;
        this._initShaders();
        this._createTextures(sourceTex);
        if (this._fbo.width !== sourceTex.width || this._fbo.height !== sourceTex.height) {
            this._fbo.resize(sourceTex.width, sourceTex.height);
        }
        const viewChanged = this._viewChanged(pvMatrix, prevPvMatrix);
        // console.log(viewChanged);
        if (viewChanged) {
            this._jitter.reset();
            this._counter = 0;
            this._clearTex();
        }
        // if (needClear) {
        // this._jitter.reset();
        // }
        this._counter++;
        const sampleCount = this._sampleCount;
        // if (!viewChanged && needClear && this._counter === sampleCount) {
        //     this._counter = 0;
        //     // this._jitter.reset();
        // }
        // if (isLowSampling) {
        //     sampleCount = 4;
        // }
        if (this._counter >= sampleCount && !needClear) {
            // console.log('ended');
            return this._prevTex;
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
            'uTaaEnabled': 0,
        };
        uniforms['uClipAABBEnabled'] = needClear && !viewChanged ? 1 : 0;
        uniforms['fov'] = fov;
        uniforms['uTaaCurrentFramePVLeft'] = pvMatrix;
        uniforms['uTaaInvViewMatrixLeft'] = invViewMatrix;
        uniforms['uTaaLastFramePVLeft'] = prevPvMatrix;
        uniforms['TextureDepth'] = depthTex;
        uniforms['TextureInput'] = sourceTex;
        uniforms['TexturePrevious'] = prevTex;
        uniforms['uHalton'] = vec4.set(this._halton, jitter[0], jitter[1], 2.0, this._counter);
        uniforms['uNearFar'] = vec2.set(this._nearfar, near, far);
        vec2.set(uniforms['uTextureDepthSize'], depthTex.width, depthTex.height);
        vec2.set(uniforms['uTextureInputSize'], sourceTex.width, sourceTex.height);
        vec2.set(uniforms['uTextureOutputSize'], output.width, output.height);
        vec2.set(uniforms['uTexturePreviousSize'], prevTex.width, prevTex.height);

        this._renderer.render(this._shader, uniforms, null, this._fbo);

        const temp = this._outputTex;
        const tempFBO = this._fbo;
        this._outputTex = this._prevTex;
        this._fbo = this._prevFbo;
        this._prevTex = temp;
        this._prevFbo = tempFBO;
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
        if (this._outputTex) {
            this._outputTex.destroy();
        }
        if (this._prevTex) {
            this._prevTex.destroy();
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
        const type = 'uint8';//regl.hasExtension('OES_texture_half_float') ? 'float16' : 'float';
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
            this._shader = new TaaShader(this._viewport);
        }
    }

    _viewChanged(mat0, mat1) {
        if (mat0 === mat1) {
            return false;
        }
        return !mat4.equals(mat0, mat1);
    }

    _clearTex() {
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
    }
}

export default TaaPass;
