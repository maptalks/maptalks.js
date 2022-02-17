import { mat4 } from 'gl-matrix';
import Renderer from '../../Renderer.js';
import MeshShader from '../../shader/MeshShader';
import Scene from '../../Scene';
import { isFunction } from '../../common/Util';
import mixVert from './glsl/fog_mixFactor.vert';
import mixFrag from './glsl/fog_mixFactor.frag';
const viewModelMatrix = [];
class FogPass{
    constructor(regl, viewport) {
        this._regl = regl;
        this._viewport = viewport;
        this._init();
    }

    _init() {
        this._shader = new MeshShader({
            vert: mixVert,
            frag: mixFrag,
            uniforms: [
                {
                    name: 'viewModelMatrix',
                    type: 'function',
                    fn: function (context, props) {
                        return mat4.multiply(viewModelMatrix, props['viewMatrix'], props['modelMatrix']);
                    }
                }
            ],
            extraCommandProps: {
                viewport: this._viewport
            }
        });
        this._fbo = this._regl.framebuffer({
            color: this._regl.texture({
                width: this._viewport.width(),
                height: this._viewport.height(),
                wrap: 'clamp',
                mag : 'linear',
                min : 'linear'
            }),
            depth: true
        });
        this._scene = new Scene();
        this.renderer = new Renderer(this._regl);
    }

    render(meshes, options) {
        this._resize();
        this.renderer.clear({
            color : [0, 0, 0, 1],
            depth : 1,
            framebuffer : this._fbo
        });
        this._scene.setMeshes(meshes)
        const uniforms = {
            projMatrix: options.projMatrix,
            viewMatrix: options.viewMatrix,
            cameraPosition: options.cameraPosition,
            fogDist: options.fogDist
        };
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

    _resize() {
        const width = isFunction(this._viewport.width.data) ? this._viewport.width.data() : this._viewport.width;
        const height = isFunction(this._viewport.height.data) ? this._viewport.height.data() : this._viewport.height;
        if (this._fbo && (this._fbo.width !== width || this._fbo.height !== height)) {
            this._fbo.resize(width, height);
        }
    }

}

export default FogPass;
