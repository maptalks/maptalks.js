import { reshader } from '@maptalks/gl';
import quadVert from './glsl/quad.vert';
import extentFrag from './glsl/extent.frag';
import outlineFrag from './glsl/outline.frag';
import sceneVert from './glsl/sceneVert.vert';
import { Util } from '@maptalks/map';
import AnalysisPass from './AnalysisPass';

export default class OutlinePass extends AnalysisPass {

    render(meshes, { projViewMatrix, lineColor, lineWidth }) {
        if (!meshes || !meshes.length) {
            return null;
        }
        this._clear();
        this._resize();
        this._scene.setMeshes(meshes)
        //绘制有outline的Meshes的范围
        this._drawExtent(this._scene, projViewMatrix);
        //绘制有outline的Meshes的边线，同时和targetFBO做混合，画到targetFBO
        this._drawOutline(lineColor, lineWidth, this._fbo);
        return this._fbo;
    }

    _init() {
        this.fboExtent = this._createFBO();
        const viewport = this._viewport;
        this.extentShader = new reshader.MeshShader({
            vert: sceneVert,
            frag: extentFrag,
            extraCommandProps: {
                viewport,
                cull: {
                    enable: false
                }
            },
        });

        this.outlineShader = new reshader.QuadShader({
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
        this._fbo = this.regl.framebuffer({
            color: this.regl.texture({
                width: viewport.width(),
                height: viewport.height(),
                wrap: 'clamp',
                mag : 'linear',
                min : 'linear'
            }),
            depth: true
        });
        this._scene = new reshader.Scene();
    }

    _drawExtent(scene, matrix) {
        this.renderer.render(this.extentShader, {
            'projViewMatrix': matrix,
            'minAltitude': 0
        }, scene, this.fboExtent);
    }

    _drawOutline(lineColor, lineWidth, targetFBO) {
        this.renderer.render(this.outlineShader, {
            'texSize' : [targetFBO.width, targetFBO.height],
            'visibleEdgeColor' : lineColor || [1, 0, 0],
            'maskTexture' : this.fboExtent,
            'lineWidth': lineWidth || 1,
            'minAltitude': 0
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

    getRenderMeshes() {
        return this._scene.getMeshes();
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
        if (this._fbo) {
            this._fbo.destroy();
            delete this._fbo;
        }
    }

    _resize() {
        const width = Util.isFunction(this._viewport.width.data) ? this._viewport.width.data() : this._viewport.width;
        const height = Util.isFunction(this._viewport.height.data) ? this._viewport.height.data() : this._viewport.height;
        if (this._fbo.width !== width || this.fboExtent.height !== height) {
            this._fbo.resize(width, height);
        }
        if (this.fboExtent.width !== width || this.fboExtent.height !== height) {
            this.fboExtent.resize(width, height);
        }
    }
}
