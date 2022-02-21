import { mat4 } from 'gl-matrix';
import MeshShader from '../shader/MeshShader';
import Scene from '../Scene';
import depthVert from './glsl/depth.vert';
import depthFrag from './glsl/depth.frag';
import vert from './glsl/viewshed.vert';
import frag from './glsl/viewshed.frag';
import { isFunction } from '../common/Util';

export default class ViewshedPass {
    constructor(renderer, viewport) {
        this.renderer = renderer;
        this._viewport = viewport;
        this._init();
    }

    _init() {
        this._depthShader = new MeshShader({
            vert: depthVert,
            frag: depthFrag,
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
        this._viewshedShader = new MeshShader({
            vert,
            frag,
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
    }

    render(meshes, config) {
        this._resize();
        this.renderer.clear({
            color : [0, 0, 0, 1],
            depth : 1,
            framebuffer : this._fbo
        });
        const scene = new Scene(meshes);
        const eyePos = config.eyePos;
        const lookPoint = config.lookPoint;
        const verticalAngle = config.verticalAngle || 90;
        const horizontalAngle = config.horizontalAngle || 90;
        const projViewMatrixFromViewpoint = this._createProjViewMatrix(eyePos, lookPoint, verticalAngle, horizontalAngle);
        this._renderDepth(scene, projViewMatrixFromViewpoint);
        this._renderViewshedMap(scene, projViewMatrixFromViewpoint, config.projViewMatrix);
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
}
