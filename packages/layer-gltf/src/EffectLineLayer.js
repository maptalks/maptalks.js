import AbstractGLTFLayer from './common/AbstractGLTFLayer';
import EffectLayerRenderer from './EffectLayerRenderer';
import { reshader } from '@maptalks/gl';

const options = {
    markerTypes: ['effectmarker']
};

export default class EffectLineLayer extends AbstractGLTFLayer {
    static initDefaultShader() {
        const effectShader = getShader();
        EffectLineLayer.registerShader('effectline', 'MeshShader', effectShader.shader);
    }
}

EffectLineLayer.initDefaultShader();

EffectLineLayer.mergeOptions(options);

EffectLineLayer.registerJSONType('EffectLineLayer');

EffectLineLayer.registerRenderer('gl', EffectLayerRenderer);
EffectLineLayer.registerRenderer('gpu', EffectLayerRenderer);

function getShader() {
    const vert = `
        attribute vec3 aPosition;
        attribute vec2 aTexCoord;
        uniform mat4 projViewMatrix;
        uniform mat4 modelMatrix;
        uniform vec2 uvOffset;
        uniform float width;
        uniform float height;
        varying vec2 vTexCoords;
        varying float vHeight;
        void main()
        {
            vec4 worldPosition = modelMatrix * vec4(aPosition, 1.0);
            gl_Position = projViewMatrix * worldPosition;
            vHeight = worldPosition.z;
            vTexCoords = (uvOffset + aTexCoord) * vec2(1.0 / width, 1.0 / height);
        }
    `;
    const frag = `
        precision mediump float;
        uniform sampler2D texture;
        uniform float modelHeight;
        uniform float startOpacity;
        uniform float endOpacity;
        varying float vHeight;
        varying vec2 vTexCoords;
        void main() {
            vec4 color = texture2D(texture, vTexCoords);
            float opacity = (endOpacity - startOpacity) * (1.0 - vHeight / modelHeight);
            gl_FragColor = vec4(color.rgb, color.a) * color.a * opacity;
        }
    `;
    const shader = {
        vert: vert,
        frag: frag,
        positionAttribute: 'POSITION',
        extraCommandProps: {
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
