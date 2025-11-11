import AbstractGLTFLayer from './common/AbstractGLTFLayer';
import GLTFLayerRenderer from './GLTFLayerRenderer';
import { reshader, mat4 } from '@maptalks/gl';

const options = {
    markerTypes: ['effectring']
};

export default class EffectRingLayer extends AbstractGLTFLayer {
    static initDefaultShader() {
        const effectShader = getShader();
        EffectRingLayer.registerShader('effectring', 'MeshShader', effectShader.shader);
    }
}

EffectRingLayer.initDefaultShader();

EffectRingLayer.mergeOptions(options);

EffectRingLayer.registerJSONType('EffectRingLayer');

EffectRingLayer.registerRenderer('gl', GLTFLayerRenderer);
EffectRingLayer.registerRenderer('gpu', GLTFLayerRenderer);

function getShader() {
    const vert = `
        attribute vec3 aPosition;
        attribute vec2 aTexCoord;
        attribute vec3 aNormal;
        uniform mat4 projViewMatrix;
        uniform mat4 modelMatrix;
        uniform mat4 normalMatrix;
        uniform float offsetX;
        uniform float offsetY;
        varying vec2 uv;
        void main()
        {
            gl_Position = projViewMatrix * modelMatrix * vec4(aPosition, 1.0);
            uv = vec2(aTexCoord.x + offsetX, aTexCoord.y + offsetY);
        }
    `;
    const frag = `
        precision mediump float;
        uniform sampler2D effectTexture;
        uniform vec3 uCameraPosition;
        uniform mat4 viewMatrix;
        uniform float uReflectivity;
        uniform vec4 color;
        uniform float opacity;

        varying vec2 uv;

        vec3 inverseTransformDirection(in vec3 dir, in mat4 matrix) {
            return normalize((vec4(dir, 0.0) * matrix).xyz);
        }

        const float GAMMA_FACTOR = 2.0;
        vec4 GammaToLinear(in vec4 value, in float gammaFactor) {
            return vec4(pow(value.xyz, vec3(gammaFactor)), value.w);
        }

        vec4 mixTexelToLinear(vec4 value) {
            return GammaToLinear(value, float(GAMMA_FACTOR));
        }

        void main() {
            vec4 texColor = texture2D(effectTexture, uv);
            if (color.a == 0.0) {
                discard;
            }
            vec4 mixColor = mixTexelToLinear(color);
            texColor.rgb += mixColor.xyz * uReflectivity;
            texColor.a*= opacity;
            gl_FragColor = texColor;
        }
    `;
    const shader = {
        vert,
        frag,
        uniforms : [
            {
                name: 'normalMatrix',
                type: 'function',
                fn: function (context, props) {
                    const normalMatrix = [];
                    mat4.invert(normalMatrix, props['modelMatrix']);
                    mat4.transpose(normalMatrix, normalMatrix);
                    return normalMatrix;
                }
            }
        ],
        positionAttribute : 'POSITION',
        extraCommandProps : {
            depth: {
                enable: true,
                mask: false
            },
            blend: {
                enable: true,
                func: {
                    src: 'one',
                    dst: 'one minus src alpha'
                },
                equation: 'add'
            }
        }
    };
    const material = new reshader.Material();
    return { shader, material };
}
