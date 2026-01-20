import { mat4, quat, vec3 } from '@maptalks/gl';
import { reshader } from '@maptalks/gl';
import vert from './glsl/viewshed.vert';
import frag from './glsl/viewshed.frag';
import wgslVert from './wgsl/viewshed_vert.wgsl';
import wgslFrag from './wgsl/viewshed_frag.wgsl';
import { Point } from 'maptalks';
import AnalysisPass from './AnalysisPass';

const helperPos = [
    0, 0, 0,
    1, 1, -1,
    1, -1, -1,
    1, -1, 1,
    1, 1, 1,
    1, 0, 0
]
const helperIndices = [
    0, 1,
    0, 2,
    0, 3,
    0, 4,
    1, 2,
    2, 3,
    3, 4,
    4, 1,
    0,5
];
const MAT = [], QUAT1 = quat.identity([]), QUAT2 = quat.identity([]),  VEC3 = [], v1 = [1, 0, 0], VEC31 = [], VEC32 = [], TEMP_POS = [], TEMP_POINT = new Point(0, 0);
const clearColor = [0, 0, 0, 1];
let near = 0.01;

export default class ViewshedPass extends AnalysisPass {

    _init() {
        super._init();
        this._viewshedShader = new reshader.MeshShader({
            name: 'viewshed',
            vert,
            frag,
            wgslVert,
            wgslFrag,
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
        const device = this.renderer.device;
        this._fbo = device.framebuffer({
            color: device.texture({
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
        helperGeometry.generateBuffers(device);
        this._helperMesh = new reshader.Mesh(helperGeometry, new reshader.Material({ lineColor: [0.8, 0.8, 0.1]}));
        const defines = this._helperMesh.getDefines();
        defines.HAS_HELPERLINE = 1;
        this._helperMesh.setDefines(defines);
        this._scene = new reshader.Scene();
    }

    render(meshes, config) {
        const { eyePos, lookPoint, horizontalAngle, verticalAngle } = config;
        if (!this._validViewport(horizontalAngle, verticalAngle) || !eyePos || !lookPoint) {
            return this._fbo;
        }
        if (!this._depthShader) {
            this._createDepthShader(horizontalAngle, verticalAngle);
        }
        this._resize(horizontalAngle, verticalAngle);
        this.renderer.clear({
            color : clearColor,
            depth : 1,
            framebuffer : this._fbo
        });
        this._helperMesh.localTransform = this._getHelperMeshMatrix(eyePos, lookPoint, horizontalAngle, verticalAngle);
        meshes.push(this._helperMesh);
        this._scene.setMeshes(meshes);
        const { projViewMatrixFromViewpoint, far } = this._createProjViewMatrix(eyePos, lookPoint, verticalAngle, horizontalAngle);
        this._renderDepth(this._scene, projViewMatrixFromViewpoint, far);
        this._renderViewshedMap(this._scene, projViewMatrixFromViewpoint, config.projViewMatrix, far);
        return this._fbo;
    }

    //计算辅助线框的矩阵
    _getHelperMeshMatrix(eyePos, lookPoint, horizontalAngle, verticalAngle) {
        const distance = Math.sqrt(Math.pow(eyePos[0] - lookPoint[0], 2) + Math.pow(eyePos[1] - lookPoint[1], 2) + Math.pow(eyePos[2] - lookPoint[2], 2));
        if (distance <= 0) {
            console.warn('both lookpoint and eyePos are in the same position');
        }
        const modelMatrix = mat4.identity(MAT);
        const vector = vec3.set(VEC3, lookPoint[0] - eyePos[0], lookPoint[1] - eyePos[1], lookPoint[2] - eyePos[2]);
        const halfHorizontalAngle = (horizontalAngle * Math.PI) / (2 * 180);
        const halfVerticalAngle = (verticalAngle * Math.PI) / (2 * 180);
        let angleX_Z = vec3.angle(v1, vec3.set(VEC31, vector[0], vector[1], 0));
        angleX_Z = vector[1] >= 0 ? angleX_Z : Math.PI * 2 - angleX_Z;
        const rotation = quat.rotateZ(QUAT1, QUAT2, angleX_Z);
        let angleY_Z = vec3.angle(vec3.set(VEC32, vector[0], vector[1], 0), vector);
        angleY_Z = vector[0] >= 0 ? -angleY_Z : Math.PI * 2 - angleY_Z;
        quat.rotateY(rotation, rotation, angleY_Z);
        mat4.fromRotationTranslationScale(modelMatrix, rotation, eyePos, [distance, distance * Math.tan(halfHorizontalAngle), distance * Math.tan(halfVerticalAngle)]);
        return modelMatrix;
    }

    _getVertexCoordinates(map) {
        const matrix = this._helperMesh.localTransform;
        const coordinates = [];
        const glRes = map.getGLRes();
        for (let i = 1; i < (helperPos.length - 3) / 3; i++) {
            TEMP_POS[0] = helperPos[i * 3];
            TEMP_POS[1] = helperPos[i * 3 + 1];
            TEMP_POS[2] = helperPos[i * 3 + 2];
            const point = vec3.transformMat4([], TEMP_POS, matrix);
            TEMP_POINT.set(point[0], point[1]);
            const coordinate = map.pointAtResToCoord(TEMP_POINT, glRes)
            const altitude = map.pointAtResToAltitude(point[2], glRes);
            coordinate.z = altitude;
            coordinates.push(coordinate);
        }
        return coordinates;
    }

    //渲染viewshed贴图
    _renderViewshedMap(scene, projViewMatrixFromViewpoint, projViewMatrix, far) {
        const uniforms = {
            viewshed_projViewMatrixFromViewpoint: projViewMatrixFromViewpoint,
            projViewMatrix,
            near,
            far,
            depthMap: this._depthFBO,
            minAltitude: 0
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
        near = distance / 100;
        let projMatrix;
        const isWebGPU = !!this.renderer.device.wgpu;
        if (isWebGPU) {
            projMatrix = mat4.perspectiveZO([], horizontalAngle * Math.PI / 180, aspect, near, distance);
        } else {
            projMatrix = mat4.perspective([], horizontalAngle * Math.PI / 180, aspect, near, distance);
        }
        const viewMatrix = mat4.lookAt([], eyePos, lookPoint, [0, 1, 0]);
        const projViewMatrix = mat4.multiply([], projMatrix, viewMatrix);
        return { projViewMatrixFromViewpoint: projViewMatrix, far: distance };
    }

    dispose() {
        super.dispose();
        if (this._fbo) {
            this._fbo.destroy();
        }
        if (this._viewshedShader) {
            this._viewshedShader.dispose();
        }
        if (this._helperMesh) {
            this._helperMesh.geometry.dispose();
            this._helperMesh.dispose();
        }
    }

    _resize(horizontalAngle, verticalAngle) {
        const { width, height } = this.getViewportSize();
        if (this._fbo && (this._fbo.width !== width || this._fbo.height !== height)) {
            this._fbo.resize(width, height);
        }
        if (this._depthFBO && (this._depthFBO.width / this._depthFBO.height !== horizontalAngle / verticalAngle)) {
            const size = this._getDepthMapSize(horizontalAngle, verticalAngle);
            if (size) {
                this._depthFBO.resize(size.width, size.height);
            }
        }
    }
}
