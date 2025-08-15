import { reshader, mat4 } from '@maptalks/gl';
import * as maptalks from 'maptalks';
import vert from './glsl/heightmap.vert';
import frag from './glsl/heightmap.frag';
import AnalysisPass from './AnalysisPass';

const EMPTY_COLOR = [0, 0, 0, 1], modelViewMatrix = [], projViewModelMatrix = [];

export default class HeightmapPass extends AnalysisPass {

    _init() {
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
        this._shader = new reshader.MeshShader({
            vert,
            frag,
            uniforms: [
                {
                    name: 'modelViewMatrix',
                    type: 'function',
                    fn: (_, props) => {
                        return mat4.multiply(modelViewMatrix, props['viewMatrix'], props['modelMatrix']);
                    }
                },
                {
                    name: 'projViewModelMatrix',
                    type: 'function',
                    fn: (context, props) => {
                        return mat4.multiply(projViewModelMatrix, props['projViewMatrix'], props['modelMatrix']);
                    }
                }
            ],
            extraCommandProps: {
                viewport: this._viewport,
                cull: {
                    enable: true
                },
                frontFace: 'ccw'
            }
        });
        this._scene = new reshader.Scene();
    }

    render(meshes, projViewMatrix) {
        this._resize();
        this.renderer.clear({
            color : EMPTY_COLOR,
            depth : 1,
            framebuffer : this._fbo
        });
        this._scene.setMeshes(meshes);
        const uniforms = {
            projViewMatrix
        };
        this.renderer.render(
            this._shader,
            uniforms,
            this._scene,
            this._fbo
        );
        return this._fbo;
    }

    _resize() {
        const width = maptalks.Util.isFunction(this._viewport.width) ? this._viewport.width() : this._viewport.width;
        const height = maptalks.Util.isFunction(this._viewport.height) ? this._viewport.height() : this._viewport.height;
        if (this._fbo && (this._fbo.width !== width || this._fbo.height !== height)) {
            this._fbo.resize(width, height);
        }
    }

    dispose() {
        if (this._fbo) {
            this._fbo.destroy();
            delete this._fbo;
        }
        if (this._shader) {
            this._shader.dispose();
            delete this._shader;
        }
    }
}
