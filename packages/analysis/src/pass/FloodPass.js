import { reshader } from '@maptalks/gl';
import vert from './glsl/flood.vert';
import frag from './glsl/flood.frag';
import wgslVert from './wgsl/flood_vert.wgsl';
import wgslFrag from './wgsl/flood_frag.wgsl';
import AnalysisPass from './AnalysisPass';

export default class FloodPass extends AnalysisPass {

    _init() {
        this._shader = new reshader.MeshShader({
            name: 'flood',
            vert,
            frag,
            wgslVert,
            wgslFrag,
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

    //渲染深度贴图
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
        const { width, height } = this.getViewportSize();
        if (this._fbo && (this._fbo.width !== width || this._fbo.height !== height)) {
            this._fbo.resize(width, height);
        }
    }
}
