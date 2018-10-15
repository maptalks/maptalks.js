import Painter from './Painter';
import { reshader } from '@maptalks/gl';
import { mat4 } from '@maptalks/gl';
import Color from 'color';
import vert from './glsl/fill.vert';
import frag from './glsl/fill.frag';
import pickingVert from './glsl/fill.picking.vert';

const defaultUniforms = {
    'polygonFill' : [255, 255, 255],
    'polygonOpacity' : 1
};

class FillPainter extends Painter {
    needToRedraw() {
        return this._redraw;
    }

    createMesh(geometries, transform, tileData) {
        if (!geometries || !geometries.length) {
            return null;
        }
        const packMeshes = tileData.meshes;
        const meshes = [];
        for (let i = 0; i < packMeshes.length; i++) {
            const geometry = geometries[packMeshes[i].pack];
            const symbol = packMeshes[i].symbol;
            const uniforms = {};
            if (symbol['polygonFill']) {
                const color = Color(symbol['polygonFill']);
                uniforms.polygonFill = color.unitArray();
                if (uniforms.polygonFill.length === 3) {
                    uniforms.polygonFill.push(1);
                }
            }
            let transparent = false;
            if (symbol['polygonOpacity'] || symbol['polygonOpacity'] === 0) {
                uniforms.polygonOpacity = symbol['polygonOpacity'];
                if (symbol['polygonOpacity'] < 1) {
                    transparent = true;
                }
            }

            const material = new reshader.Material(uniforms, defaultUniforms);
            const mesh = new reshader.Mesh(geometry, material, {
                transparent,
                castShadow : false,
                picking : true
            });
            mesh.setLocalTransform(transform);
            meshes.push(mesh);
        }
        return meshes;
    }

    remove() {
        this._shader.dispose();
    }

    init() {
        const regl = this.regl;
        const canvas = this.canvas;

        this._renderer = new reshader.Renderer(regl);

        const viewport = {
            x : 0,
            y : 0,
            width : () => {
                return canvas ? canvas.width : 1;
            },
            height : () => {
                return canvas ? canvas.height : 1;
            }
        };
        const scissor = {
            enable: true,
            box: {
                x : 0,
                y : 0,
                width : () => {
                    return canvas ? canvas.width : 1;
                },
                height : () => {
                    return canvas ? canvas.height : 1;
                }
            }
        };

        this._shader = new reshader.MeshShader({
            vert, frag,
            uniforms : [
                'polygonFill', 'polygonOpacity',
                {
                    name : 'projViewModelMatrix',
                    type : 'function',
                    fn : function (context, props) {
                        const projViewModelMatrix = [];
                        mat4.multiply(projViewModelMatrix, props['viewMatrix'], props['modelMatrix']);
                        mat4.multiply(projViewModelMatrix, props['projMatrix'], projViewModelMatrix);
                        return projViewModelMatrix;
                    }
                },
            ],
            extraCommandProps : {
                viewport, scissor
            }
        });
        if (this.pickingFBO) {
            this.picking = new reshader.FBORayPicking(
                this._renderer,
                {
                    vert : pickingVert,
                    uniforms : [
                        {
                            name : 'projViewModelMatrix',
                            type : 'function',
                            fn : function (context, props) {
                                const projViewModelMatrix = [];
                                mat4.multiply(projViewModelMatrix, props['viewMatrix'], props['modelMatrix']);
                                mat4.multiply(projViewModelMatrix, props['projMatrix'], projViewModelMatrix);
                                return projViewModelMatrix;
                            }
                        }
                    ]
                },
                this.pickingFBO
            );
        }
    }

    getUniformValues(map) {
        const viewMatrix = map.viewMatrix,
            projMatrix = map.projMatrix;
        return {
            viewMatrix, projMatrix
        };
    }
}

export default FillPainter;
