import { mat4, vec3, quat } from 'gl-matrix';
import Renderer from '../../Renderer.js';
import MeshShader from '../../shader/MeshShader';
import Scene from '../../Scene';
import Geometry from '../../Geometry';
import Material from '../../Material';
import Mesh from '../../Mesh';
import ripplesVert from './glsl/ripples.vert';
import ripplesFrag from './glsl/ripples.frag';
import { isFunction } from '../../common/Util';

const modelViewMatrix = [];
const DEFALUT_SCALE = [0.03, 0.03, 0.03];
const TEMP_ROTATE = [], TEMP_SCALE = [], TEMP_MAT = [], DEFAULT_ZOOM = 16.685648411389433;
const Y_UP_TO_Z_UP = mat4.fromRotationTranslation([], quat.fromEuler([], 90, 0, 0), [0, 0, 0]);
export default class RainRipplePass {
    constructor(regl, viewport) {
        this._regl = regl;
        this._viewport = viewport;
        this._init();
    }

    _init() {
        this._shader = new MeshShader({
            vert: ripplesVert,
            frag: ripplesFrag,
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
            },
        });
        this._shader.version = 300;
        this._fbo = this._regl.framebuffer({
            color: this._regl.texture({
                width: this._viewport.width(),
                height: this._viewport.height(),
                wrap: 'clamp',
                mag : 'linear',
                min : 'linear'
            }),
            depth: true
        });
        this._scene = new Scene();
        this.renderer = new Renderer(this._regl);
    }

    _transformRipples(map) {
        const center = map.coordinateToPointAtRes(map.getCenter(), map.getGLRes());
        const ratio = map.getGLScale() / map.getGLScale(this._fixZoom);
        const v3 = vec3.set(TEMP_SCALE, ratio, ratio, ratio);
        const scale = vec3.multiply(v3, DEFALUT_SCALE, v3);
        const transformat = mat4.identity(TEMP_MAT);
        mat4.fromRotationTranslationScale(transformat, quat.fromEuler(TEMP_ROTATE, 0, 0, 0), [center.x, center.y, 0], scale);
        mat4.multiply(transformat, transformat, Y_UP_TO_Z_UP);
        this._mesh.setLocalTransform(transformat);
    }

    _createRipplesMask(map) {
        this._fixZoom = map.getZoom();
        const pos = Math.pow(2, DEFAULT_ZOOM - this._fixZoom) * 800;
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
        const geometry = new Geometry(
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
        const material = new Material();
        const mesh = new Mesh(geometry, material);
        return mesh;
    }


    render(map, options) {
        this._resize();
        this.renderer.clear({
            color : [0, 0, 0, 1],
            depth : 1,
            framebuffer : this._fbo
        });
        this._mesh = this._mesh || this._createRipplesMask(map);
        this._scene.setMeshes(this._mesh);
        this._transformRipples(map);
        const uniforms = {
            projMatrix: options.projMatrix,
            viewMatrix: options.viewMatrix,
            time: options.time,
            rippleRadius: options.rippleRadius,
            density: options.density
        };
        this.renderer.render(
            this._shader,
            uniforms,
            this._scene,
            this._fbo
        );
        return this._fbo;
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


