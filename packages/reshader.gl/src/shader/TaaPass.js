
import TaaShader from './TaaShader.js';
import { vec2 } from 'gl-matrix';

class TaaPass {
    constructor(renderer, viewport) {
        this._renderer = renderer;
        this._viewport = viewport;
        this._halton = [];
        this._nearfar = [];
    }

    render(sourceTex, depthTex, pvMatrix, invViewMatrix, prevPvMatrix, fov, jitter, near, far) {
        this._initShaders();
        this._createTextures(sourceTex);
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
        };
        uniforms['fov'] = fov;
        uniforms['uTaaCurrentFramePVLeft'] = pvMatrix;
        uniforms['uTaaInvViewMatrixLeft'] = invViewMatrix;
        uniforms['uTaaLastFramePVLeft'] = prevPvMatrix;
        uniforms['TextureDepth'] = depthTex;
        uniforms['TextureInput'] = sourceTex;
        uniforms['TexturePrevious'] = prevTex;
        uniforms['uHalton'] = vec2.set(this._halton, jitter[0], jitter[1]);
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
}

export default TaaPass;
