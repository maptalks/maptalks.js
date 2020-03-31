import { mat4 } from 'gl-matrix';
import MeshShader from '../shader/MeshShader';
import { isFunction } from '../common/Util';
import depthVert from './glsl/depth.vert';
import depthFrag from './glsl/depth.frag';

export default class ViewshedPass {
    constructor(renderer, viewport) {
        this.renderer = renderer;
        this._viewport = viewport;
        this._width = 1;
        this._height = 1;
        this._init();
    }

    _init() {
        this._depthFBOViewport = this._viewport;
        this._depthShader = new MeshShader({
            vert: depthVert,
            frag: depthFrag,
            uniforms: ['projViewMatrix'],
            extraCommandProps: {
                viewport: this._depthFBOViewport
            }
        });
        this._depthFBO = this.renderer.regl.framebuffer({
            color: this.renderer.regl.texture({
                width: this._width,
                height: this._height,
                wrap: 'clamp',
                mag : 'linear',
                min : 'linear'
            }),
            depth: true
        });
    }

    render(scene, { projViewMatrixFromViewpoint, visibleColor, invisibleColor }) {
        this._resize();
        this.renderer.clear({
            color : [1, 0, 0, 1],
            depth : 1,
            framebuffer : this._depthFBO
        });
        this._renderDepth(scene, projViewMatrixFromViewpoint, visibleColor, invisibleColor);
        return {
            depthMap: this._depthFBO,
            projViewMatrixFromViewpoint
        };
    }

    //渲染深度贴图
    _renderDepth(scene, projViewMatrix, visibleColor, invisibleColor) {
        const uniforms = {
            projViewMatrix,
            visibleColor,
            invisibleColor
        };
        this.renderer.render(
            this._depthShader,
            uniforms,
            scene,
            this._depthFBO
        );
    }

    //根据视点位置，方向，垂直角，水平角构建矩阵
    _createProjViewMatrix(eyePos, lookPoint, verticalAngle, horizonAngle) {
        const aspect = horizonAngle / verticalAngle;
        const distance = Math.sqrt(Math.pow(eyePos[0] - lookPoint[0], 2) + Math.pow(eyePos[1] - lookPoint[1], 2) + Math.pow(eyePos[2] - lookPoint[2], 2));
        const projMatrix = mat4.perspective([], verticalAngle * Math.PI / 180, aspect, 1.0, distance);
        const viewMatrix = mat4.lookAt([], eyePos, lookPoint, [0, 1, 0]);
        const projViewMatrix = mat4.multiply([], projMatrix, viewMatrix);
        return projViewMatrix;
    }

    dispose() {
        if (this._depthFBO) {
            this._depthFBO.destroy();
        }
    }

    _resize() {
        this._width = isFunction(this._viewport.width.data) ? this._viewport.width.data() : this._viewport.width;
        this._height = isFunction(this._viewport.height.data) ? this._viewport.height.data() : this._viewport.height;
        if (this._depthFBO && (this._depthFBO.width !== this._width || this._depthFBO.height !== this._height)) {
            this._depthFBO.resize(this._width, this._height);
        }
    }
}
