import { mat4, vec3, quat } from '@maptalks/reshader.gl';
import * as reshader from '@maptalks/reshader.gl';
import snowVert from './glsl/snow.vert';
import snowFrag from './glsl/snow.frag';
const modelViewMatrix = [];
const DEFALUT_SCALE = [0.03, 0.03, 0.03];
const TEMP_ROTATE = [], TEMP_SCALE = [], TEMP_MAT = [], DEFAULT_ZOOM = 16.685648411389433;
const Y_UP_TO_Z_UP = mat4.fromRotationTranslation([], quat.fromEuler([], 90, 0, 0), [0, 0, 0]);

class SnowPainter {
    constructor(regl, layer) {
        this._regl = regl;
        this._layer = layer;
        this._init();
    }

    _init() {
        const canvas = this._layer.getRenderer().canvas;
        const viewport = {
            x : 0,
            y : 0,
            width : () => {
                return canvas.width;
            },
            height : () => {
                return canvas.height;
            }
        };
        this._shader = new reshader.MeshShader({
            vert: snowVert,
            frag: snowFrag,
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
                viewport
            }
        });
        this._shader.version = 300;
        this._scene = new reshader.Scene();
        this._groundMask = this._createGroundMask();
        this._scene.setMeshes(this._groundMask);
        this.renderer = new reshader.Renderer(this._regl);
        const snowConfig = this._getSnowConfig();
        if (!snowConfig) {
            return;
        }
        if (!snowConfig.snowGroundTexture) {
            this._groundNormal = this._regl.texture({width: 2, height: 2});
            console.warn('should set snow ground texture.');
        } else {
            this._createSnowTexture(snowConfig.snowGroundTexture);
        }
    }

    render(context) {
        if (this._groundNormal) {
            this._groundMask.material.set('perlinTexture', this._groundNormal);
        }
        const map = this._layer.getMap();
        this._transformMask(map);
        const uniforms = {
            projMatrix: map.projMatrix,
            viewMatrix: map.viewMatrix,
            cameraPosition: map.cameraPosition
        };
        const fbo = context && context.renderTarget && context.renderTarget.fbo;
        this.renderer.render(
            this._shader,
            uniforms,
            this._scene,
            fbo
        );
        this._layer.getRenderer().setCanvasUpdated();
    }

    _transformMask(map) {
        const center = map.coordinateToPointAtRes(map.getCenter(), map.getGLRes());
        const ratio = map.getGLScale() / map.getGLScale(this._fixZoom);
        const v3 = vec3.set(TEMP_SCALE, ratio, ratio, ratio);
        const scale = vec3.multiply(v3, DEFALUT_SCALE, v3);
        const transformat = mat4.identity(TEMP_MAT);
        mat4.fromRotationTranslationScale(transformat, quat.fromEuler(TEMP_ROTATE, 0, 0, 0), [center.x, center.y, 0.005], scale);
        mat4.multiply(transformat, transformat, Y_UP_TO_Z_UP);
        this._groundMask.setLocalTransform(transformat);
    }

    _createSnowTexture(snowGroundTexture) {
        const image = new Image();
        image.onload = () => {
            this._groundNormal = this._regl.texture({
                mag: 'linear',
                min: 'linear mipmap nearest',
                wrapS: 'repeat',
                wrapT: 'repeat',
                data: image
            });
        };
        image.onerror = (err) => {
            console.log(err);
        };
        image.src = this._snowGroundTexture = snowGroundTexture;
    }

    _createGroundMask() {
        const map = this._layer.getMap();
        this._fixZoom = map.getZoom();
        const pos = Math.pow(2, DEFAULT_ZOOM - this._fixZoom) * 16000;
        const vertices = [
            -pos, 0, -pos,
            pos, 0, -pos,
            -pos, 0, pos,
            pos, 0, pos,
        ];
        const normals = [
            0, 1, 0,
            0, 1, 0,
            0, 1, 0,
            0, 1, 0
        ];
        const uvs = [
            0.0, 0.0,
            1.0, 0.0,
            0.0, 1.0,
            1.0, 1.0
        ];
        const indices = [
            3, 1, 0, 0, 2, 3
        ];

        const attributes = {};
        attributes['POSITION'] = vertices;
        attributes['NORMAL'] = normals;
        attributes['TEXCOORD_0'] = uvs;
        const geometry = new reshader.Geometry(
            attributes,
            indices,
            0,
            {
                positionAttribute: 'POSITION',
                normalAttribute: 'NORMAL',
                uv0Attribute: 'TEXCOORD_0'
            }
        );
        geometry.generateBuffers(this._regl);
        const material = new reshader.Material({
            perlinTexture: this._regl.texture({ width: 2, height: 2 })
        });
        const mesh = new reshader.Mesh(geometry, material);
        return mesh;
    }

    getMeshes() {
        return this._groundMask;
    }

    dispose() {
        if (this._groundMask) {
            this._groundMask.geometry.dispose();
            if (this._groundMask.material) {
                this._groundMask.material.dispose();
            }
            this._groundMask.dispose();
            delete this._groundMask;
        }
        if (this._shader) {
            this._shader.dispose();
            delete this._shader;
        }
    }

    update() {
        const snowConfig = this._getSnowConfig();
        if (!snowConfig) {
            return;
        }
        if (snowConfig.snowGroundTexture === !this._snowGroundTexture) {
            this._createSnowTexture(snowConfig.snowGroundTexture);
        }
    }

    isEnable() {
        const config = this._getSnowConfig();
        return config && config.enable;
    }

    _getSnowConfig() {
        const weatherConfig = this._layer.getWeatherConfig();
        return weatherConfig && weatherConfig.snow;
    }

}

export default SnowPainter;
