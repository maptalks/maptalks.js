import Painter from './Painter';
import { reshader } from '@maptalks/gl';
import { mat4 } from '@maptalks/gl';
import Color from 'color';
import vert from './glsl/line.vert';
import frag from './glsl/line.frag';
import pickingVert from './glsl/line.picking.vert';

const defaultUniforms = {
    'lineColor' : [0, 0, 0, 1],
    'lineOpacity' : 1,
    'lineWidth' : 1,
    'lineGapWidth' : 0,
    'lineDx'   : 0,
    'lineDy'   : 0
};


class LinePainter extends Painter {
    needToRedraw() {
        return this._redraw;
    }

    createMesh(geometries, transform) {
        if (!geometries || !geometries.length) {
            return null;
        }

        // const mapUniforms = this.getUniformValues(this.layer.getMap());

        const meshes = [];
        for (let i = 0; i < geometries.length; i++) {
            const symbol = geometries[i].properties.symbol;
            const uniforms = {};
            if (symbol['lineColor']) {
                const color = Color(symbol['lineColor']);
                uniforms.lineColor = color.unitArray();
                if (uniforms.lineColor.length === 3) {
                    uniforms.lineColor.push(1);
                }
            }
            let transparent = false;
            if (symbol['lineOpacity'] || symbol['lineOpacity'] === 0) {
                uniforms.lineOpacity = symbol['lineOpacity'];
                if (symbol['lineOpacity'] < 1) {
                    transparent = true;
                }
            }

            if (symbol['lineWidth'] || symbol['lineWidth'] === 0) {
                uniforms.lineWidth = symbol['lineWidth'];
            }

            if (symbol['lineGapWidth']) {
                uniforms.lineGapWidth = symbol['lineGapWidth'];
            }

            //TODO lineDx, lineDy
            // const indices = geometries[i].elements;
            // const projViewMatrix = mat4.multiply([], mapUniforms.projMatrix, mapUniforms.viewMatrix);
            // const projViewModelMatrix = mat4.multiply(new Float32Array(16), projViewMatrix, transform);
            // console.log('projViewModelMatrix', projViewModelMatrix);
            // const pos = geometries[i].data.aPosition;
            // for (let ii = 0; ii < indices.length; ii++) {
            //     const idx = indices[ii] * 3;
            //     // if (ii === 2) {
            //     //     pos[idx + 2] = 8192;
            //     // }
            //     const vector = [pos[idx], pos[idx + 1], pos[idx + 2], 1];
            //     const glPos = vec4.transformMat4([], vector, projViewModelMatrix);
            //     const tilePos = vec4.transformMat4([], vector, transform);
            //     const ndc = [glPos[0] / glPos[3], glPos[1] / glPos[3], glPos[2] / glPos[3]];
            //     console.log(vector, tilePos, glPos, ndc);
            // }

            const material = new reshader.Material(uniforms, defaultUniforms);
            const mesh = new reshader.Mesh(geometries[i], material, {
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
                'cameraToCenterDistance',
                'canvasSize',
                // 'uColor',
                'lineWidth',
                'lineGapWidth',

                'blur',
                'lineOpacity',
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
                'uMatrix'
                /* {
                    name : 'uMatrix',
                    type : 'function',
                    fn : function (context, props) {
                        return mat4.multiply([], props['projMatrix'], props['viewMatrix2']);
                    }
                }, */
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
                        'canvasSize',
                        'lineWidth',
                        'lineGapWidth',
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
                        'uMatrix'
                    ]
                },
                this.pickingFBO
            );
        }
    }

    getUniformValues(map) {
        const viewMatrix = map.viewMatrix,
            projMatrix = map.projMatrix,
            uMatrix = mat4.translate([], viewMatrix, map.cameraPosition),
            cameraToCenterDistance = map.cameraToCenterDistance,
            canvasSize = [this.canvas.width, this.canvas.height];
        return {
            viewMatrix, uMatrix, projMatrix, cameraToCenterDistance, canvasSize, blur : 0
        };
    }
}

export default LinePainter;
