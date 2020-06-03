import QuadShader from '../shader/QuadShader.js';
import vert from '../shader/glsl/quad.vert';
import frag from './glsl/ssr_mipmap.frag';

class SsrMipmapShader extends QuadShader {
    constructor() {
        super({
            vert, frag,
            uniforms : [
                'inputRGBM',
                'uRGBMRange',
                'TextureRefractionBlur0',
                'TextureRefractionBlur1',
                'TextureRefractionBlur2',
                'TextureRefractionBlur3',
                'TextureRefractionBlur4',
                'TextureRefractionBlur5',
                'TextureRefractionBlur6',
                'TextureRefractionBlur7',
                'uTextureOutputRatio',
                'uTextureOutputSize',
                'uTextureRefractionBlur0Ratio',
                'uTextureRefractionBlur0Size',
                'uTextureRefractionBlur1Ratio',
                'uTextureRefractionBlur1Size',
                'uTextureRefractionBlur2Ratio',
                'uTextureRefractionBlur2Size',
                'uTextureRefractionBlur3Ratio',
                'uTextureRefractionBlur3Size',
                'uTextureRefractionBlur4Ratio',
                'uTextureRefractionBlur4Size',
                'uTextureRefractionBlur5Ratio',
                'uTextureRefractionBlur5Size',
                'uTextureRefractionBlur6Ratio',
                'uTextureRefractionBlur6Size',
                'uTextureRefractionBlur7Ratio',
                'uTextureRefractionBlur7Size'
            ],
            extraCommandProps: {
                viewport: {
                    x: 0,
                    y: 0,
                    width: (context, props) => {
                        return props['uTextureOutputSize'][0];
                    },
                    height: (context, props) => {
                        return props['uTextureOutputSize'][1];
                    }
                }
            }
        });
    }

    getMeshCommand(regl, mesh) {
        if (!this.commands['ssr_mimap']) {
            this.commands['ssr_mimap'] = this.createREGLCommand(
                regl,
                null,
                null,
                mesh.getElements()
            );
        }
        return this.commands['ssr_mimap'];
    }
}

export default SsrMipmapShader;
