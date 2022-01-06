import MeshShader from '../shader/MeshShader';
import QuadShader from '../shader/QuadShader';
import Scene from '../Scene';
import quadVert from '../shader/glsl/quad.vert';
import extentFrag from './glsl/extent.frag';
import outlineFrag from './glsl/outline.frag';
import sceneVert from './glsl/sceneVert.vert';

export default class OutlinePass {
    constructor(renderer)  {
        this._renderer = renderer;
        this.regl = renderer.regl;
        this._init();
    }

    render(meshes, targetFBO, { projViewMatrix, lineColor, lineWidth }) {
        if (!meshes || !meshes.length) {
            return;
        }
        this._clear();
        this._resize(targetFBO);
        const renderScene = new Scene(meshes);
        //绘制有outline的Meshes的范围
        this._drawExtent(renderScene, projViewMatrix);
        //绘制有outline的Meshes的边线，同时和targetFBO做混合，画到targetFBO
        this._drawOutline(lineColor, lineWidth, targetFBO);
    }

    _init() {
        this.fboExtent = this._createFBO();
        const viewport = {
            x: 0,
            y: 0,
            width: () => {
                return this.fboExtent.width;
            },
            height: () => {
                return this.fboExtent.height;
            }
        };
        this.extentShader = new MeshShader({
            vert: sceneVert,
            frag: extentFrag,
            extraCommandProps: {
                viewport,
                cull: {
                    enable: false
                }
            },
        });

        this.outlineShader = new QuadShader({
            vert : quadVert,
            frag : outlineFrag,
            extraCommandProps: {
                viewport,
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

    _drawExtent(scene, matrix) {
        this._renderer.render(this.extentShader, {
            'projViewMatrix': matrix
        }, scene, this.fboExtent);
    }

    _drawOutline(lineColor, lineWidth, targetFBO) {
        this._renderer.render(this.outlineShader, {
            'texSize' : [targetFBO.width, targetFBO.height],
            'visibleEdgeColor' : lineColor || [1, 0, 0],
            'maskTexture' : this.fboExtent,
            'lineWidth': lineWidth || 1
        }, null, targetFBO);
    }

    _createFBO() {
        return this.regl.framebuffer({
            color: this.regl.texture({
                width: 2,
                height: 2,
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
            this.extentShader.dispose();
            this.outlineShader.dispose();
            delete this.fboExtent;
        }
    }

    _resize(sourceTex) {
        const { width, height } = sourceTex;
        if (this.fboExtent.width !== width || this.fboExtent.height !== height) {
            this.fboExtent.resize(width, height);
        }
    }
}
