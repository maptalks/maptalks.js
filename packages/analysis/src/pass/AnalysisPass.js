import { reshader, mat4 } from '@maptalks/gl';
import depthVert from './glsl/depth.vert';
import depthFrag from './glsl/depth.frag';

const RESOLUTION = 2048;
export default class AnalysisPass {
    constructor(renderer, viewport) {
        this.renderer = renderer;
        this.regl = renderer.device;
        this._viewport = viewport;
        this._init();
    }

    _init() {
        this._depthFBO = this.renderer.device.framebuffer({
            color: this.renderer.device.texture({
                width: RESOLUTION,
                height: RESOLUTION,
                wrap: 'clamp',
                mag : 'nearest',
                min : 'nearest'
            }),
            depth: true
        });
    }

    //渲染深度贴图
    _renderDepth(scene, projViewMatrix, far) {
        const uniforms = {
            projViewMatrix,
            minAltitude: 0,
            logDepthBufFC: 2.0 / (Math.log(far + 1.0) / Math.LN2)
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

    _createDepthShader(horizontalAngle, verticalAngle) {
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
                viewport: {
                    x : 0,
                    y : 0,
                    width : () => {
                        const size = this._getDepthMapSize(horizontalAngle, verticalAngle);
                        return size ? size.width : 1;
                    },
                    height : () => {
                        const size = this._getDepthMapSize(horizontalAngle, verticalAngle);
                        return size ? size.height : 1;
                    }
                }
            }
        });
        this._depthShader.version = 300;
    }

    _getDepthMapSize(horizontalAngle, verticalAngle) {
        if (this._validViewport(horizontalAngle, verticalAngle)) {
            return { width: RESOLUTION, height: RESOLUTION};
        }
        return null;
    }

    _validViewport(horizontalAngle, verticalAngle) {
        return horizontalAngle && verticalAngle && horizontalAngle * verticalAngle > 0;
    }

    dispose() {
        if (this._depthFBO) {
            this._depthFBO.destroy();
        }
        if (this._depthShader) {
            this._depthShader.dispose();
        }
    }
}
