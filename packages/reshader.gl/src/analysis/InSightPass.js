import { mat4 } from 'gl-matrix';
import MeshShader from '../shader/MeshShader';
import Scene from '../Scene';
import Geometry from '../Geometry';
import Mesh from '../Mesh';
import Material from '../Material';
import depthVert from './glsl/depth.vert';
import depthFrag from './glsl/depth.frag';
import vert from './glsl/insight.vert';
import frag from './glsl/insight.frag';
import { isFunction } from '../common/Util';

const helperPos = [
    0, 0, 0,
    1, 0, 0
]
const helperIndices = [
    0, 1
];
const MAT = [];
const clearColor = [0, 0, 0, 1];
export default class InSightPass {
    constructor(renderer, viewport) {
        this.renderer = renderer;
        this._viewport = viewport;
        this._init();
    }

    _init() {
        this._depthShader = new MeshShader({
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
        this._insightShader = new MeshShader({
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
        const helperGeometry = new Geometry({
            POSITION: helperPos
        },
        helperIndices,
        0,
        {
            //绘制类型，例如 triangle strip, line等，根据gltf中primitive的mode来判断，默认是triangles
            primitive : 'lines',
            positionAttribute: 'POSITION'
        });
        this._helperGeometry = helperGeometry;
        this._helperMesh = new Mesh(helperGeometry, new Material({ lineColor: [0.8, 0.8, 0.1]}));
        this._scene = new Scene();
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
        const modelMatrix = mat4.identity(MAT);
        this._helperMesh.localTransform = modelMatrix;
        this._scene.setMeshes(meshes);
        const projViewMatrixFromViewpoint = this._createProjViewMatrix(eyePos, lookPoint, 45, 45);
        this._renderDepth(this._scene, projViewMatrixFromViewpoint);
        this._updateHelperGeometry(eyePos, lookPoint);
        this._scene.setMeshes(this._helperMesh);
        this._renderInsightMap(this._scene, projViewMatrixFromViewpoint, config.projViewMatrix);
        return this._fbo;
    }

    _updateHelperGeometry(eyePos, lookPoint) {
        if(this._helperGeometry) {
            helperPos[0] = eyePos[0];
            helperPos[1] = eyePos[1];
            helperPos[2] = eyePos[2];
            helperPos[3] = lookPoint[0];
            helperPos[4] = lookPoint[1];
            helperPos[5] = lookPoint[2];
            this._helperGeometry.updateData('POSITION', helperPos);
        }
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

    //渲染insight贴图
    _renderInsightMap(scene, projViewMatrixFromViewpoint, projViewMatrix) {
        const uniforms = {
            insight_projViewMatrixFromViewpoint: projViewMatrixFromViewpoint,
            projViewMatrix,
            depthMap: this._depthFBO
        };
        this.renderer.render(
            this._insightShader,
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
        if (this._insightShader) {
            this._insightShader.dispose();
        }
        if (this._helperMesh) {
            this._helperMesh.geometry.dispose();
            this._helperMesh.dispose();
        }
    }

    _resize() {
        const width = isFunction(this._viewport.width.data) ? this._viewport.width.data() : this._viewport.width;
        const height = isFunction(this._viewport.height.data) ? this._viewport.height.data() : this._viewport.height;
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
