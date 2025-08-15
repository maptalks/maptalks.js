import { reshader, mat4 } from '@maptalks/gl';
import vert from './glsl/crosscut.vert';
import frag from './glsl/crosscut.frag';
import { Util } from 'maptalks';
import AnalysisPass from './AnalysisPass';

export default class CrossCutPass extends AnalysisPass {

    _init() {
        this._shader = new reshader.MeshShader({
            vert,
            frag,
            uniforms: [
                {
                    name: 'modelViewMatrix',
                    type: 'function',
                    fn: function (context, props) {
                        return mat4.multiply([], props['viewMatrix'], props['modelMatrix']);
                    }
                }
            ],
            extraCommandProps: {
                viewport: this._viewport
            }
        });
        this._fbo = this.renderer.device.framebuffer({
            color: this.renderer.device.texture({
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
        const scene = new reshader.Scene(meshes);
        this._renderScene(scene, config);
        return this._fbo;
    }

    _renderScene(scene, uniforms) {
        this.renderer.clear({
            color : [0, 0, 0, 1],
            depth : 1,
            framebuffer : this._fbo
        });
        this.renderer.render(
            this._shader,
            uniforms,
            scene,
            this._fbo
        );
    }

    dispose() {
        if (this._fbo) {
            this._fbo.destroy();
        }
        if (this._shader) {
            this._shader.dispose();
        }
    }

    _resize() {
        const width = Util.isFunction(this._viewport.width.data) ? this._viewport.width.data() : this._viewport.width;
        const height = Util.isFunction(this._viewport.height.data) ? this._viewport.height.data() : this._viewport.height;
        if (this._fbo && (this._fbo.width !== width || this._fbo.height !== height)) {
            this._fbo.resize(width, height);
        }
    }
}
