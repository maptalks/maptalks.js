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

    render(meshes, { projViewMatrix, lineColor, hiddenEdgeColor }) {
        this._clear();
        this._resize();
        const renderScene = new Scene(meshes);
        //绘制Meshes的范围
        this._drawExtentFBO(renderScene, projViewMatrix);
        //
        this._drawOutlineFBO(lineColor, hiddenEdgeColor);
        return this.fboEdge;
    }

    _init() {
        this.fboEdge = this._createFBO();
        this.fboExtent = this._createFBO();
        this.extentShader = new MeshShader({
            vert: sceneVert,
            frag: extentFrag,
            uniforms: [
                'projViewMatrix',
                'positionMatrix'
            ],
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
                'hiddenEdgeColor',
                'maskTexture'
            ],
            positionAttribute : 'POSITION',
            extraCommandProps: { viewport: this._viewport
            },
        });
    }

    _drawExtentFBO(scene, matrix) {
        this._renderer.render(this.extentShader, {
            'projViewMatrix': matrix
        }, scene, this.fboExtent);
    }

    _drawOutlineFBO(lineColor, hiddenEdgeColor) {
        this._renderer.render(this.outlineShader, {
            'texSize' : [this._width / 2, this._height / 2],
            'visibleEdgeColor' : lineColor,
            'hiddenEdgeColor' : hiddenEdgeColor,
            'maskTexture' : this.fboExtent
        }, null, this.fboEdge);
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
        this.regl.clear({
            color: [0, 0, 0, 0],
            depth: 1,
            framebuffer: this.fboEdge
        });
    }

    dispose() {
        if (this.fboExtent) {
            this.fboExtent.destroy();
        }
        if (this.fboEdge) {
            this.fboEdge.destroy();
        }
    }

    _resize() {
        this._width = isFunction(this._viewport.width.data) ? this._viewport.width.data() : this._viewport.width;
        this._height = isFunction(this._viewport.height.data) ? this._viewport.height.data() : this._viewport.height;
        if (this.fboExtent && (this.fboExtent.width !== this._width || this.fboExtent.height !== this._height)) {
            this.fboExtent.resize(this._width, this._height);
        }
        if (this.fboEdge && (this.fboEdge.width !== this._width || this.fboEdge.height !== this._height)) {
            this.fboEdge.resize(this._width, this._height);
        }
    }
}
