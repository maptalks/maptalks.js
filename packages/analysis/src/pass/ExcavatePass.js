import { mat4 } from '@maptalks/gl';
import { reshader } from '@maptalks/gl';
import vert from './glsl/excavate.vert';
import frag from './glsl/excavate.frag';
import { Util } from '@maptalks/map';
import AnalysisPass from './AnalysisPass';

const clearColor = [1.0, 0.0, 0.0, 1];

export default class ExcavatePass extends AnalysisPass {

    _init() {
        this._shader = new reshader.MeshShader({
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
                viewport: this._viewport,
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
        this._scene = new reshader.Scene();
    }

    render(meshes, uniforms) {
        this.resize();
        this.renderer.clear({
            color : clearColor,
            depth : 1,
            framebuffer : this._fbo
        });
        this._scene.setMeshes(meshes);
        this.renderer.render(
            this._shader,
            uniforms,
            this._scene,
            this._fbo
        );
        return this._fbo;
    }

    dispose() {
        if (this._fbo) {
            this._fbo.destroy();
        }
        if (this._shader) {
            this._shader.dispose();
        }
    }

    resize() {
        const width = Util.isFunction(this._viewport.width.data) ? this._viewport.width.data() : this._viewport.width;
        const height = Util.isFunction(this._viewport.height.data) ? this._viewport.height.data() : this._viewport.height;
        if (this._fbo && (this._fbo.width !== width || this._fbo.height !== height)) {
            this._fbo.resize(width, height);
        }
    }
}
