import Renderer from '../Renderer';
import MeshShader from './MeshShader';
import Scene from '../Scene';
import { mat4 } from 'gl-matrix';
import vert from './glsl/extent.vert';
import maskColorExtent from './glsl/maskColorExtent.frag';
import maskModeExtent from './glsl/maskModeExtent.frag';
import { isFunction } from '../common/Util';

const CLEAR_COLOR = [0, 0, 0, 1];
class ExtentPass {
    constructor(regl, viewport) {
        this.regl = regl;
        this._viewport = viewport;
        this.renderer = new Renderer(regl);
        this._init();
    }

    _init() {
        this._maskColorFbo = this.renderer.device.framebuffer({
            color: this.renderer.device.texture({
                width: 1,
                height: 1,
                wrap: 'clamp',
                mag : 'linear',
                min : 'linear'
            }),
            depth: true
        });
        this._maskModeFbo = this.renderer.device.framebuffer({
            color: this.renderer.device.texture({
                width: 1,
                height: 1,
                wrap: 'clamp',
                mag : 'nearest', //采用nearest采样，避免因linear造成的边界附近产生空隙
                min : 'nearest'
            }),
            depth: true
        });
        const uniforms = [
            {
                name: 'projViewModelMatrix',
                type: 'function',
                fn: (context, props) => {
                    return mat4.multiply([], props['projViewMatrix'], props['modelMatrix']);
                }
            }
        ];
        this._maskColorShader = new MeshShader({
            vert,
            frag: maskColorExtent,
            uniforms,
            extraCommandProps: {
                viewport: this._viewport,
                depth : {
                    enable : true,
                    func : 'lequal'
                }
            }
        });
        this._maskModeShader = new MeshShader({
            vert,
            frag: maskModeExtent,
            uniforms,
            extraCommandProps: {
                viewport: this._viewport,
            }
        });
        this._scene = new Scene();
    }

    render(meshes, projViewMatrix) {
        this._resize();
        this.renderer.clear({
            color : CLEAR_COLOR,
            depth : 1,
            framebuffer : this._maskColorFbo
        });
        this.renderer.clear({
            color : CLEAR_COLOR,
            depth : 1,
            framebuffer : this._maskModeFbo
        });
        this._scene.setMeshes(meshes);
        const uniforms = {
            projViewMatrix
        };
        this.renderer.render(
            this._maskColorShader,
            uniforms,
            this._scene,
            this._maskColorFbo
        );
        this.renderer.render(
            this._maskModeShader,
            uniforms,
            this._scene,
            this._maskModeFbo
        );
        return { colorExtent: this._maskColorFbo, modeExtent: this._maskModeFbo };
    }

    _resize() {
        const width = isFunction(this._viewport.width) ? this._viewport.width() : this._viewport.width.data();
        const height = isFunction(this._viewport.height) ? this._viewport.height() : this._viewport.height.data();
        if (this._maskColorFbo && (this._maskColorFbo.width !== width || this._maskColorFbo.height !== height)) {
            this._maskColorFbo.resize(width, height);
            this._maskModeFbo.resize(width, height);
        }
    }

    dispose() {
        if (this._maskColorFbo) {
            this._maskColorFbo.destroy();
            delete this._maskColorFbo;
        }
        if (this._maskModeFbo) {
            this._maskModeFbo.destroy();
            delete this._maskModeFbo;
        }
        if (this._maskColorShader) {
            this._maskColorShader.dispose();
            delete this._maskColorShader;
        }
        if (this._maskModeShader) {
            this._maskModeShader.dispose();
            delete this._maskModeShader;
        }
    }
}

export default ExtentPass;
