import MeshShader from '../shader/MeshShader';
import QuadShader from '../shader/QuadShader';
import Scene from '../Scene';
import quadVert from '../shader/glsl/quad.vert';
import extentFrag from './glsl/extent.frag';
import outlineFrag from './glsl/outline.frag';
import sceneVert from './glsl/sceneVert.vert';
import { isFunction } from '../common/Util';

export default class OutlinePass {
    constructor(renderer, viewport)  {
        this._renderer = renderer;
        this.regl = renderer.regl;
        this._viewport = viewport;
        this._width = 1;
        this._height = 1;
        this._init();
    }

    render(meshes, targetFBO, { projViewMatrix, lineColor, lineWidth }) {
        if (!meshes || !meshes.length) {
            return;
        }
        this._clear();
        this._resize();
        if (!meshes || !meshes.length) {
            return;
        }
        const renderScene = new Scene(meshes);
        //绘制有outline的Meshes的范围
        this._drawExtentFBO(renderScene, projViewMatrix);
        //绘制有outline的Meshes的边线，同时和targetFBO做混合，画到targetFBO
        this._drawOutlineFBO(lineColor, lineWidth, targetFBO);
    }

    _init() {
        this.fboExtent = this._createFBO();
        this.extentShader = new MeshShader({
            vert: sceneVert,
            frag: extentFrag,
            positionAttribute: 'POSITION',
            extraCommandProps: {
                viewport: this._viewport,
                cull: {
                    enable: false
                }
            },
        });

        this.outlineShader = new QuadShader({
            vert : quadVert,
            frag : outlineFrag,
            uniforms : [
                'texSize',
                'visibleEdgeColor',
                'maskTexture',
                'lineWidth'
            ],
            positionAttribute : 'POSITION',
            extraCommandProps: { viewport: this._viewport,
                depth: {
                    enable: true,
                    mask: false,
                    func: 'always'
                },
                blend: {
                    enable: true,
                    func: {
                        src: 'one',
                        dst: 'one minus src alpha'
                    },
                    equation: 'add'
                }
            }
        });
    }

    _drawExtentFBO(scene, matrix) {
        this._renderer.render(this.extentShader, {
            'projViewMatrix': matrix
        }, scene, this.fboExtent);
    }

    _drawOutlineFBO(lineColor, lineWidth, targetFBO) {
        this._renderer.render(this.outlineShader, {
            'texSize' : [this._width / 2, this._height * 2 / 2],
            'visibleEdgeColor' : lineColor || [1, 0, 0],
            'maskTexture' : this.fboExtent,
            'lineWidth': lineWidth || 1
        }, null, targetFBO);
    }

    _createFBO() {
        return this.regl.framebuffer({
            color: this.regl.texture({
                width: this._width,
                height: this._height,
                wrap: 'clamp',
                mag: 'linear',
                min: 'linear'
            }),
            depth: true
        });
    }

    _clear() {
        this.regl.clear({
            color: [1, 1, 1, 1],
            depth: 1,
            framebuffer: this.fboExtent
        });
    }

    dispose() {
        if (this.fboExtent) {
            this.fboExtent.destroy();
        }
    }

    _resize() {
        this._width = isFunction(this._viewport.width.data) ? this._viewport.width.data() : this._viewport.width;
        this._height = isFunction(this._viewport.height.data) ? this._viewport.height.data() : this._viewport.height;
        if (this.fboExtent && (this.fboExtent.width !== this._width || this.fboExtent.height !== this._height)) {
            this.fboExtent.resize(this._width, this._height);
        }
    }
}
