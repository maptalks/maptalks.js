import * as maptalks from 'maptalks';
import Renderer from '../Renderer';
import MeshShader from './MeshShader';
import Scene from '../Scene';
import Mesh from '../Mesh';
import Geometry from '../Geometry';
import { mat4, quat } from 'gl-matrix';
import vert from './glsl/extent.vert';
import maskColorExtent from './glsl/maskColorExtent.frag';
import maskModeExtent from './glsl/maskModeExtent.frag';
import earcut from 'earcut';

const MAT = [], QUAT = [];
const SCALE = [1, 1, 1];
const CLEAR_COLOR = [0, 0, 0, 1];
class ExtentPass {
    constructor(regl, viewport) {
        this.regl = regl;
        this._viewport = viewport;
        this.renderer = new Renderer(regl);
        this._init();
    }

    _init() {
        this._maskColorFbo = this.renderer.regl.framebuffer({
            color: this.renderer.regl.texture({
                width: 1,
                height: 1,
                wrap: 'clamp',
                mag : 'linear',
                min : 'linear'
            }),
            depth: true
        });
        this._maskModeFbo = this.renderer.regl.framebuffer({
            color: this.renderer.regl.texture({
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

    setExtentPositions(positions) {
        this._disposeMeshes();
        const extent = this._calExtent(positions);
        const centerPos = [(extent[0] + extent[2]) / 2, (extent[1] + extent[3]) / 2, 0];
        const meshes = [];
        for (let i  = 0; i < positions.length; i++) {
            const mesh = this._createMesh(positions[i], centerPos);
            meshes.push(mesh);
        }
        this._meshes = meshes;
    }

    _createMesh(positionObject, centerPos) {
        const pos = [];
        const { position, maskColor, maskMode, flatHeight, heightRange } = positionObject;
        for (let i = 0; i < position.length; i++) {
            const point = position[i];
            pos.push(point[0] - centerPos[0]);
            pos.push(point[1] - centerPos[1]);
            pos.push(point[2]);
        }
        const triangles = earcut(pos, null, 3);
        const geometry = new Geometry({
            POSITION: pos
        },
        triangles,
        0,
        {
            positionAttribute: 'POSITION'
        });
        geometry.generateBuffers(this.regl);
        const mesh = new Mesh(geometry);
        mesh.setUniform('maskColor', maskColor);
        mesh.setUniform('maskMode', maskMode);
        mesh.setUniform('flatHeight', flatHeight);
        mesh.setUniform('heightRange', heightRange);
        const mMatrix = mat4.fromRotationTranslationScale(MAT, quat.identity(QUAT), centerPos, SCALE);
        mesh.localTransform = mMatrix;
        return mesh;
    }

    render(projViewMatrix) {
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
        this._scene.setMeshes(this._meshes);
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

    _calExtent(positions) {
        let xmin = Infinity, ymin = Infinity, xmax = -Infinity, ymax = -Infinity;
        for (let i = 0; i < positions.length; i++) {
            const { position } = positions[i];
            for (let j = 0; j < position.length; j++) {
                if (position[j][0] < xmin) {
                    xmin = position[j][0];
                }
                if (position[j][1] < ymin) {
                    ymin = position[j][1];
                }
                if (position[j][0] > xmax) {
                    xmax = position[j][0];
                }
                if (position[j][1] > ymax) {
                    ymax = position[j][1];
                }
            }
        }
        return [xmin, ymin, xmax, ymax];
    }

    _resize() {
        const width = maptalks.Util.isFunction(this._viewport.width) ? this._viewport.width() : this._viewport.width.data();
        const height = maptalks.Util.isFunction(this._viewport.height) ? this._viewport.height() : this._viewport.height.data();
        if (this._maskColorFbo && (this._maskColorFbo.width !== width || this._maskColorFbo.height !== height)) {
            this._maskColorFbo.resize(width, height);
            this._maskModeFbo.resize(width, height);
        }
    }

    _disposeMeshes() {
        if (this._meshes) {
            this._meshes.forEach(mesh => {
                mesh.geometry.dispose();
                mesh.dispose();
            });
            delete this._meshes;
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
        this._disposeMeshes();
    }
}

export default ExtentPass;
