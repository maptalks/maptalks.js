import { mat4 } from 'gl-matrix';
import Renderer from '../../Renderer.js';
import MeshShader from '../../shader/MeshShader';
import Scene from '../../Scene';
import { isFunction } from '../../common/Util';
import mixVert from './glsl/fog_mixFactor.vert';
import mixFrag from './glsl/fog_mixFactor.frag';
const modelViewMatrix = [];
class FogPass{
    constructor(regl, viewport, layer) {
        this._regl = regl;
        this._layer = layer;
        this._viewport = viewport;
        this._init();
    }

    _init() {
        this._shader = new MeshShader({
            vert: mixVert,
            frag: mixFrag,
            uniforms: [
                {
                    name: 'modelViewMatrix',
                    type: 'function',
                    fn: function (context, props) {
                        return mat4.multiply(modelViewMatrix, props['viewMatrix'], props['modelMatrix']);
                    }
                }
            ],
            extraCommandProps: {
                viewport: this._viewport
            }
        });
        const layerRenderer = this._layer.getRenderer();
        const info = layerRenderer.createFBOInfo();
        this._fbo = this._regl.framebuffer(info);
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
            fogDist: options.fogDist,
            rainDepth: options.rainDepth
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
