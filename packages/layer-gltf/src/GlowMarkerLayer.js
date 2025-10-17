import { reshader, mat4 } from '@maptalks/gl';
import GLTFLayerRenderer from './GLTFLayerRenderer';
import AbstractGLTFLayer from './common/AbstractGLTFLayer';

const options = {
    markerTypes: ['glowmarker']
};

export default class GlowMarkerLayer extends AbstractGLTFLayer {
    static initDefaultShader() {
        const GlowMarkerShader = getGlowMarkerShader();
        GlowMarkerLayer.registerShader('glowmarker', 'MeshShader', GlowMarkerShader.shader, GlowMarkerShader.material.getUniforms());
    }
}

GlowMarkerLayer.initDefaultShader();

GlowMarkerLayer.mergeOptions(options);

GlowMarkerLayer.registerJSONType('GlowMarkerLayer');

GlowMarkerLayer.registerRenderer('gl', GLTFLayerRenderer);
GlowMarkerLayer.registerRenderer('gpu', GLTFLayerRenderer);

function getGlowMarkerShader() {
    const vert = `
        #ifdef GL_ES
            precision highp float;
        #endif
        attribute vec3 aPosition;
        uniform mat4 projViewModelMatrix;
        uniform mat4 modelMatrix;
        uniform mat4 positionMatrix;
        varying vec3 v_FragPos;
        varying vec3 v_center;
        #include <get_output>
        void main(){
            mat4 localPositionMatrix = getPositionMatrix();
            vec4 localVertex = getPosition(aPosition);
            vec4 position = localPositionMatrix * localVertex;
            gl_Position = projViewModelMatrix * position;
            vec4 worldPos = modelMatrix * position;
            v_FragPos = worldPos.xyz;
            v_center = (modelMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
        }
    `;
    const frag = `
        #ifdef GL_ES
            precision highp float;
        #endif
        #define pi 3.14159
        const float dotsnb = 30.0; // Number of dots

        varying vec3 v_FragPos;
        varying vec3 v_center;
        uniform float time;
        uniform float radius;
        uniform vec3 color;
        uniform float speed;
        vec3 hsb2rgb(in vec3 c)
        {
            vec3 rgb = clamp(abs(mod(c.x*6.0+vec3(0.0,4.0,2.0),6.0)-3.0)-1.0,0.0,1.0 );
            rgb = rgb*rgb*(4.0-2.0*rgb);
            return c.z * mix( vec3(1.0), rgb, c.y);
        }

        void main()
        {
            float r = length(v_FragPos - v_center);
            r = r*2.-1.;
            if(r>radius) {
                gl_FragColor = vec4(1.0,1.0,1.0, 0.0);
            } else {
                //vec3 color = hsb2rgb(vec3(fract(time*.1),.7,.4));
                vec3 color = color;
                float s = abs(sin(pow(r+5.0, 1.5)-time*speed+sin(r*0.9))*sin(r+.99));
                color *= (abs(1./(s*10.8))-.01);
                gl_FragColor = vec4(color, (color.x + color.y + color.z) / 1.0);
            }
        }
    `;
    const shader = {
        vert,
        frag,
        uniforms: [
            {
                name : 'projViewModelMatrix',
                type : 'function',
                fn : function (context, props) {
                    return mat4.multiply([], props['projViewMatrix'], props['modelMatrix']);
                }
            }
        ],
        positionAttribute: 'POSITION',
        extraCommandProps: {
            blend: {
                enable: true,
                func: {
                    srcRGB: 'src alpha',
                    srcAlpha: 1,
                    dstRGB:'one',
                    dstAlpha: 1
                },
                equation: {
                    rgb: 'add',
                    alpha: 'add'
                },
                color: [0, 0, 0, 0]
            }
        }
    };
    const material = new reshader.Material();
    return { shader, material };
}
