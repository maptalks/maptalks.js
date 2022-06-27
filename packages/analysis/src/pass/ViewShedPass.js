import { mat4, quat, vec3 } from 'gl-matrix';
import { reshader } from '@maptalks/gl';
import depthVert from './glsl/depth.vert';
import depthFrag from './glsl/depth.frag';
import vert from './glsl/viewshed.vert';
import frag from './glsl/viewshed.frag';
import { Util } from 'maptalks';

const helperPos = [
    0, 0, 0,
    1, 1, -1,
    1, -1, -1,
    1, -1, 1,
    1, 1, 1
]
const helperIndices = [
    0, 1,
    0, 2,
    0, 3,
    0, 4,
    1, 2,
    2, 3,
    3, 4,
    4, 1
];
const MAT = [], QUAT = [], VEC3 = [];
const clearColor = [0, 0, 0, 1];
export default class ViewshedPass {
    constructor(renderer, viewport) {
        this.renderer = renderer;
        this._viewport = viewport;
        this._init();
    }

    _init() {
        this._depthShader = new reshader.MeshShader({
            vert: depthVert,
            frag: depthFrag,
            uniforms: [
                {
                    name: 'projViewModelMatrix',
                    type: 'function',
                    fn: (context, props) => {
                        return mat4.multiply([], props['projViewMatrix'], props['modelMatrix']);
                    }
                }
            ],
            extraCommandProps: {
                viewport: this._viewport
            }
        });
        this._depthFBO = this.renderer.regl.framebuffer({
            color: this.renderer.regl.texture({
                width: 1,
                height: 1,
                wrap: 'clamp',
                mag : 'linear',
                min : 'linear'
            }),
            depth: true
        });
        this._viewshedShader = new reshader.MeshShader({
            vert,
            frag,
            uniforms: [
                {
                    name: 'projViewModelMatrix',
                    type: 'function',
                    fn: (context, props) => {
                        return mat4.multiply([], props['projViewMatrix'], props['modelMatrix']);
                    }
                }
            ],
            extraCommandProps: {
                viewport: this._viewport
            }
        });
        this._fbo = this.renderer.regl.framebuffer({
            color: this.renderer.regl.texture({
                width: 1,
                height: 1,
                wrap: 'clamp',
                mag : 'linear',
                min : 'linear'
            }),
            depth: true
        });
        const helperGeometry = new reshader.Geometry({
            POSITION: helperPos
        },
        helperIndices,
        0,
        {
            //绘制类型，例如 triangle strip, line等，根据gltf中primitive的mode来判断，默认是triangles
            primitive : 'lines',
            positionAttribute: 'POSITION'
        });
        this._helperMesh = new reshader.Mesh(helperGeometry, new reshader.Material({ lineColor: [0.8, 0.8, 0.1]}));
        const defines = this._helperMesh.getDefines();
        defines.HAS_HELPERLINE = 1;
        this._helperMesh.setDefines(defines);
        this._scene = new reshader.Scene();
    }

    render(meshes, config) {
        this._resize();
        this.renderer.clear({
            color : clearColor,
            depth : 1,
            framebuffer : this._fbo
        });
        const eyePos = config.eyePos;
        const lookPoint = config.lookPoint;
        if (!eyePos || !lookPoint) {
            return this._fbo;
        }
        const verticalAngle = config.verticalAngle || 90;
        const horizontalAngle = config.horizontalAngle || 90;
        const distance = Math.sqrt(Math.pow(eyePos[0] - lookPoint[0], 2) + Math.pow(eyePos[1] - lookPoint[1], 2) + Math.pow(eyePos[2] - lookPoint[2], 2));
        if (distance <= 0) {
            console.warn('both lookpoint and eyePos are in the same position');
        }
        //计算辅助线框的矩阵
        const modelMatrix = mat4.identity(MAT);
        const vector = vec3.set(VEC3, lookPoint[0] - eyePos[0], lookPoint[1] - eyePos[1], lookPoint[2] - eyePos[2]);
        const angle =  Math.acos(vector[0] / distance);
        const angleZ = this._getRotateZAngle(angle, vector[1]);
        const angleY = this._getRotateYAngle(angle, vector[2]);
        const rotation = quat.fromEuler(QUAT, 0, (angleY / Math.PI) * 180, (angleZ / Math.PI) * 180);
        const halfHorizontalAngle = (horizontalAngle * Math.PI) / (2 * 180);
        const halfVerticalAngle = (verticalAngle * Math.PI) / (2 * 180);
        mat4.fromRotationTranslationScale(modelMatrix, rotation, eyePos, [distance, distance * Math.tan(halfHorizontalAngle), distance * Math.tan(halfVerticalAngle)]);
        this._helperMesh.localTransform = modelMatrix;
        meshes.push(this._helperMesh);
        this._scene.setMeshes(meshes);
        const projViewMatrixFromViewpoint = this._createProjViewMatrix(eyePos, lookPoint, verticalAngle, horizontalAngle);
        this._renderDepth(this._scene, projViewMatrixFromViewpoint);
        this._renderViewshedMap(this._scene, projViewMatrixFromViewpoint, config.projViewMatrix);
        return this._fbo;
    }

    //渲染深度贴图
    _renderDepth(scene, projViewMatrix) {
        const uniforms = {
            projViewMatrix
        };
        this.renderer.clear({
            color : [0, 0, 0, 1],
            depth : 1,
            framebuffer : this._depthFBO
        });
        this.renderer.render(
            this._depthShader,
            uniforms,
            scene,
            this._depthFBO
        );
    }

    //渲染viewshed贴图
    _renderViewshedMap(scene, projViewMatrixFromViewpoint, projViewMatrix) {
        const uniforms = {
            viewshed_projViewMatrixFromViewpoint: projViewMatrixFromViewpoint,
            projViewMatrix,
            depthMap: this._depthFBO
        };
        this.renderer.render(
            this._viewshedShader,
            uniforms,
            scene,
            this._fbo
        );
    }

    //根据视点位置，方向，垂直角，水平角构建矩阵
    _createProjViewMatrix(eyePos, lookPoint, verticalAngle, horizontalAngle) {
        const aspect =  verticalAngle / horizontalAngle;
        const distance = Math.sqrt(Math.pow(eyePos[0] - lookPoint[0], 2) + Math.pow(eyePos[1] - lookPoint[1], 2) + Math.pow(eyePos[2] - lookPoint[2], 2));
        const projMatrix = mat4.perspective([], horizontalAngle * Math.PI / 180, aspect, 1.0, distance);
        const viewMatrix = mat4.lookAt([], eyePos, lookPoint, [0, 1, 0]);
        const projViewMatrix = mat4.multiply([], projMatrix, viewMatrix);
        return projViewMatrix;
    }

    dispose() {
        if (this._fbo) {
            this._fbo.destroy();
        }
        if (this._depthFBO) {
            this._depthFBO.destroy();
        }
        if (this._depthShader) {
            this._depthShader.dispose();
        }
        if (this._viewshedShader) {
            this._viewshedShader.dispose();
        }
        if (this._helperMesh) {
            this._helperMesh.geometry.dispose();
            this._helperMesh.dispose();
        }
    }

    _resize() {
        const width = Util.isFunction(this._viewport.width.data) ? this._viewport.width.data() : this._viewport.width;
        const height = Util.isFunction(this._viewport.height.data) ? this._viewport.height.data() : this._viewport.height;
        if (this._fbo && (this._fbo.width !== width || this._fbo.height !== height)) {
            this._fbo.resize(width, height);
        }
        if (this._depthFBO && (this._depthFBO.width !== width || this._depthFBO.height !== height)) {
            this._depthFBO.resize(width, height);
        }
    }

    _getRotateZAngle(angle, vec) {
      if (vec === 0) {
        return Math.PI;
      } else if (vec > 0) {
        return angle;
      } else {
        return -angle;
      }
    }

    _getRotateYAngle(angle, vec) {
      if (vec === 0) {
        return 0;
      } else if (vec > 0) {
        return angle + Math.PI;
      } else {
        return -angle + Math.PI;
      }
    }
}
