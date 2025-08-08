import { reshader, MaskLayerMixin } from '@maptalks/gl';
import EffectLayerRenderer from './EffectLayerRenderer';
import AbstractGLTFLayer from './common/AbstractGLTFLayer';

const options = {
    markerTypes: ['effectmarker']
};

export default class EffectLayer extends MaskLayerMixin(AbstractGLTFLayer) {

    static initDefaultShader() {
        const effectShader = getEffectShader();
        EffectLayer.registerShader('effect', 'MeshShader', effectShader.shader, effectShader.material.getUniforms());
    }

    onAddGeometry(marker) {
        super.onAddGeometry(marker);
        const textureUrl = marker.getTextureUrl();
        const layerRenderer = this.getRenderer();
        if (layerRenderer) {
            layerRenderer._linkTexture(textureUrl);
        } else {
            this.on('renderercreate', e => {
                e.renderer._linkTexture(textureUrl);
            });
        }
    }

    remove() {
        const layerRenderer = this.getRenderer();
        if (layerRenderer) {
            this['_geoList'].forEach(m => {
                const textureUrl = m.getTextureUrl();
                layerRenderer._removeTexture(textureUrl);
            });
        }
        super.remove();
    }

    clear() {
        const layerRenderer = this.getRenderer();
        if (layerRenderer) {
            this['_geoList'].forEach(m => {
                const textureUrl = m.getTextureUrl();
                layerRenderer._removeTexture(textureUrl);
            });
        }
        super.clear();
    }

    //单元测试方法
    getTextureMapTest() {
        const layerRenderer = this.getRenderer();
        if (layerRenderer) {
            return layerRenderer['_textureMap'];
        }
        return null;
    }
}

EffectLayer.initDefaultShader();

EffectLayer.mergeOptions(options);

EffectLayer.registerJSONType('EffectLayer');

EffectLayer.registerRenderer('gl', EffectLayerRenderer);

function getEffectShader() {
    const vert = `
        attribute vec3 aPosition;
        attribute vec2 aTexCoord;
        uniform mat4 projViewMatrix;
        uniform mat4 modelMatrix;
        uniform vec2 uvOffset;
        uniform float width;
        uniform float height;
        varying vec2 vTexCoords;
        void main()
        {
            gl_Position = projViewMatrix * modelMatrix * vec4(aPosition, 1.0);
            vTexCoords = (uvOffset + aTexCoord) * vec2(1.0 / width, 1.0 / height);
        }
    `;
    const frag = `
        precision mediump float;
        uniform sampler2D texture;

        varying vec2 vTexCoords;
        void main() {
            vec4 color = texture2D(texture, vTexCoords);
            gl_FragColor = vec4(color.rgb, color.a) * color.a;
        }
    `;
    const shader = {
        vert,
        frag,
        positionAttribute: 'POSITION',
        extraCommandProps: {
            blend: {
                enable: true,
                func: {
                    src: 'one',
                    dst: 'one minus src alpha'
                },
                equation: 'add'
            },
            depth: {
                enable: true,
                func: 'always',
                mask: true,
                range: [0, 0]
            }
        }
    };
    const material = new reshader.Material();
    return { shader, material };
}
