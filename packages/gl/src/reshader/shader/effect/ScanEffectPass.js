import { mat4 } from 'gl-matrix';
import Renderer from '../../Renderer.js';
import MeshShader from '../../shader/MeshShader';
import Scene from '../../Scene';
import { isFunction } from '../../common/Util';
// import vert from './scaneffect.vert';
// import frag from './scaneffect.frag';
const vert = `#include <gl2_vert>
#define SHADER_NAME SCANEFFECT
precision highp float;
attribute vec3 aPosition;
uniform mat4 projMatrix;
uniform mat4 modelMatrix;
uniform mat4 modelViewMatrix;
uniform mat4 positionMatrix;
#include <line_extrusion_vert>
#include <get_output>
varying vec4 vWorldPosition;
void main()
{
    mat4 localPositionMatrix = getPositionMatrix();
    #ifdef IS_LINE_EXTRUSION
        vec3 linePosition = getLineExtrudePosition(aPosition);
        //linePixelScale = tileRatio * resolution / tileResolution
        vec4 localVertex = getPosition(linePosition);
    #else
        vec4 localVertex = getPosition(aPosition);
    #endif
    vec4 worldPosition = modelMatrix * localPositionMatrix * localVertex;
    vWorldPosition = worldPosition;
    gl_Position = projMatrix * modelViewMatrix * localPositionMatrix * localVertex;
}
`;
const frag = `
#ifdef GL_ES
  precision highp float;
#endif
uniform mat3 ring;

uniform float effectTime;
varying vec4 vWorldPosition;

vec3 hsb2rgb(in vec3 c) {
    vec3 rgb = clamp(abs(mod(c.x * 6.0 + vec3(0.0,4.0,2.0), 6.0)-3.0)-1.0, 0.0, 1.0 );
    rgb = rgb*rgb*(3.0-2.0*rgb);
    return c.z * mix( vec3(1.0), rgb, c.y);
}

vec4 glowring(vec4 worldPos, vec2 center, float radius, float speed, vec3 effectColor, float direction, float height) {
  vec2 dir = vec2(worldPos.xy) - center;
  float len = length(dir);
  if (len > radius) {
    return vec4(0.0);
  } else {
    vec2 uv = vec2(0.0);
    if (direction == 0.0) {
      vec2 lefttop = vec2(center.x - radius, center.y + radius);
      vec2 rightbottom = vec2(center.x + radius, center.y - radius);
      uv = vec2(abs(worldPos.x - lefttop.x) / (2.0 * radius), abs(worldPos.y - rightbottom.y) / (2.0 * radius));
      uv.x -= 0.5;
      uv.y -= 0.5;
    } else {
      if (worldPos.z < 0.1) {
        return vec4(0.0);
      }
      uv = vec2(0.0, worldPos.z / height);
    }
    float itime = (effectTime / 2.0) * speed;
    float r = length(uv) * 3.0;
    vec3 color = hsb2rgb(effectColor);

    float a = pow(r, 2.0);
    float b = sin(r * 0.8 - 1.6);
    float c = sin(r - 0.010);
    float s = sin(a - itime * 3.0 + b) * c;
    float t = abs(1.0 / (s * 10.8)) - 0.01;
    color *= t;
    vec4 newColor = vec4(color, t);
    return newColor;
  }
}

void main() {
    vec4 color = vec4(0.0);
    gl_FragColor = color;
}
`;
const modelViewMatrix = [];
class ScanEffectPass {
    constructor(regl, viewport, layer) {
        this._regl = regl;
        this._layer = layer;
        this._viewport = viewport;
        this._init();
        this._effectsLength = 0;
    }

    _init() {
        const layerRenderer = this._layer.getRenderer();
        const info = layerRenderer.createFBOInfo();
        this._fbo = this._regl.framebuffer(info);
        this._scene = new Scene();
        this.renderer = new Renderer(this._regl);
    }

    render(meshes, options) {
        this._resize();
        this.renderer.clear({
            color : [0, 0, 0, 1],
            depth : 1,
            framebuffer : this._fbo
        });
        this._scene.setMeshes(meshes);
        const effectInfos = options.effectInfos;
        if (!this._shader || effectInfos.length !== this._effectsLength) { //数量发生变化
            if (this._shader) {
                this._shader.dispose();
            }
            const fragStr = this._createFragSource(effectInfos);
            this._shader = new MeshShader({
                vert,
                frag: fragStr,
                uniforms: [
                    {
                        name: 'modelViewMatrix',
                        type: 'function',
                        fn: function (context, props) {
                            return mat4.multiply(modelViewMatrix, props['viewMatrix'], props['modelMatrix']);
                        }
                    }
                ],
                extraCommandProps: {
                    viewport: this._viewport
                }
            });
            this._effectsLength = effectInfos.length;
        }
        const uniforms = {
            projMatrix: options.projMatrix,
            viewMatrix: options.viewMatrix,
            effectTime: options.effectTime,
            minAltitude: 0
        };
        this._updateUniforms(uniforms, effectInfos);
        this.renderer.render(
            this._shader,
            uniforms,
            this._scene,
            this._fbo
        );
        return this._fbo;
    }

    _createFragSource(effectInfos) {
        let fragStr = ``;
        for (let i = 0; i < effectInfos.length; i++) {
            fragStr += `uniform mat3 ring${i};\n`;
        }
        fragStr = frag.replace('uniform mat3 ring;', fragStr);
        let colorStr =``;
        for (let i = 0; i < effectInfos.length; i++) {
            colorStr += `
                vec2 center${i} = vec2(ring${i}[0][0], ring${i}[0][1]);
                float radius${i} = ring${i}[0][2];
                float speed${i} = ring${i}[1][0];
                vec3 color${i} = vec3(ring${i}[1][1], ring${i}[1][2], ring${i}[2][0]);
                float direction${i} = ring${i}[2][1];
                float height${i} = ring${i}[2][2];
                vec4 ringColor${i} = glowring(vWorldPosition, center${i}, radius${i}, speed${i}, color${i}, direction${i}, height${i});
                color += ringColor${i};
            `;
        }
        colorStr += 'gl_FragColor = color;';
        fragStr = fragStr.replace('gl_FragColor = color;', colorStr);
        return fragStr;
    }

    _updateUniforms(uniforms, effectInfos) {
        for (let i = 0; i < effectInfos.length; i++) {
            uniforms[`ring${i}`] = effectInfos[i]
        }
    }

    dispose() {
        if (this._fbo) {
            this._fbo.destroy();
        }
        if (this._shader) {
            this._shader.dispose();
        }
    }

    _resize() {
        const width = isFunction(this._viewport.width.data) ? this._viewport.width.data() : this._viewport.width;
        const height = isFunction(this._viewport.height.data) ? this._viewport.height.data() : this._viewport.height;
        if (this._fbo && (this._fbo.width !== width || this._fbo.height !== height)) {
            this._fbo.resize(width, height);
        }
    }

}

export default ScanEffectPass;
