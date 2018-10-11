import Painter from './Painter';
import { reshader } from '@maptalks/gl';
import { mat4 } from '@maptalks/gl';
import Color from 'color';
import vert from './glsl/text.vert';
import frag from './glsl/text.frag';
import pickingVert from './glsl/text.picking.vert';

const defaultUniforms = {
    'textFill' : [0, 0, 0, 1],
    'textOpacity' : 1,
    'pitchWithMap' : 0,
    'textHaloRadius' : 0,
    'textHaloFill' : [1, 1, 1, 1],
    'textHaloOpacity' : 1
};

class TextPainter extends Painter {
    needToRedraw() {
        return this._redraw;
    }

    createMesh(geometries, transform) {
        if (!geometries || !geometries.length) {
            return null;
        }

        const meshes = [];
        for (let i = 0; i < geometries.length; i++) {
            const symbol = geometries[i].properties.symbol;
            const uniforms = {};

            let transparent = false;
            if (symbol['textOpacity'] || symbol['textOpacity'] === 0) {
                uniforms.textOpacity = symbol['textOpacity'];
                if (symbol['textOpacity'] < 1) {
                    transparent = true;
                }
            }

            if (symbol['textFill']) {
                const color = Color(symbol['textFill']);
                uniforms.textFill = color.unitArray();
                if (uniforms.textFill.length === 3) {
                    uniforms.textFill.push(1);
                }
            }

            if (symbol['textHaloFill']) {
                const color = Color(symbol['textHaloFill']);
                uniforms.textHaloFill = color.unitArray();
                if (uniforms.textHaloFill.length === 3) {
                    uniforms.textHaloFill.push(1);
                }
            }

            if (symbol['textHaloRadius']) {
                uniforms.textHaloRadius = symbol['textHaloRadius'];
            }

            if (symbol['textHaloOpacity']) {
                uniforms.textHaloOpacity = symbol['textHaloOpacity'];
            }

            const glyphAtlas = geometries[i].properties.glyphAtlas;
            uniforms['texture'] = glyphAtlas;
            uniforms['texSize'] = [glyphAtlas.width, glyphAtlas.height];

            if (symbol['textPitchAlignment'] === 'map') {
                uniforms['pitchWithMap'] = 1;
            }

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
                'viewMatrix',
                'textSize',
                'canvasSize',
                'glyphSize',
                'pitchWithMap',
                'texture',
                'gammaScale',
                'textFill'
            ],
            extraCommandProps : {
                viewport, scissor,
                blend: {
                    enable: true,
                    func: {
                        src: 'src alpha',
                        dst: 'one minus src alpha'
                    },
                    equation: 'add'
                },
                depth: {
                    enable: false
                },
            }
        });
        if (this.pickingFBO) {
            this.picking = new reshader.FBORayPicking(
                this._renderer,
                {
                    vert : pickingVert,
                    uniforms : [
                        'cameraToCenterDistance',
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
                        'viewMatrix',
                        'canvasSize',
                        'glyphSize',
                        'pitchWithMap'
                    ]
                },
                this.pickingFBO
            );
        }
    }

    getUniformValues(map) {
        const viewMatrix = map.viewMatrix,
            projMatrix = map.projMatrix,
            // uMatrix = mat4.translate([], viewMatrix, map.cameraPosition),
            cameraToCenterDistance = map.cameraToCenterDistance,
            canvasSize = [this.canvas.width, this.canvas.height];
        // uMatrix[12] = uMatrix[13] = uMatrix[14] = 0;
        return {
            viewMatrix, projMatrix,
            cameraToCenterDistance, canvasSize,
            glyphSize : 24,
            gammaScale : 2
        };
    }
}

export default TextPainter;
