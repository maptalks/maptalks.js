import BasicPainter from './BasicPainter';
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
    'lineDy'   : 0,
    'lineBlur' : 1
};


class LinePainter extends BasicPainter {
    needToRedraw() {
        return this._redraw;
    }

    createMesh(geometry, transform) {
        //TODO 如果uniforms属性是动态symbol，则改为functin方式
        const symbol = this.getSymbol();
        const uniforms = {
            tileResolution : geometry.properties.tileResolution,
            tileRatio : geometry.properties.tileRatio
        };
        if (symbol['lineColor']) {
            const color = Color(symbol['lineColor']);
            uniforms.lineColor = color.unitArray();
            if (uniforms.lineColor.length === 3) {
                uniforms.lineColor.push(1);
            }
        }
        if (symbol['lineOpacity'] || symbol['lineOpacity'] === 0) {
            uniforms.lineOpacity = symbol['lineOpacity'];
        }

        if (symbol['lineWidth'] || symbol['lineWidth'] === 0) {
            uniforms.lineWidth = symbol['lineWidth'];
        }

        if (symbol['lineGapWidth']) {
            uniforms.lineGapWidth = symbol['lineGapWidth'];
        }

        if (symbol['lineBlur'] || symbol['lineBlur'] === 0) {
            uniforms.lineBlur = symbol['lineBlur'];
        }

        if (symbol['lineDx'] || symbol['lineDx'] === 0) {
            uniforms.lineDx = symbol['lineDx'];
        }

        if (symbol['lineDy'] || symbol['lineDy'] === 0) {
            uniforms.lineDy = symbol['lineDy'];
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

        geometry.generateBuffers(this.regl);

        const material = new reshader.Material(uniforms, defaultUniforms);
        const mesh = new reshader.Mesh(geometry, material, {
            castShadow : false,
            picking : true
        });
        mesh.setLocalTransform(transform);
        return mesh;
    }

    init() {
        //tell parent Painter to run stencil when painting
        // this.needStencil = true;

        const regl = this.regl;

        this.renderer = new reshader.Renderer(regl);

        this.createShader();

        if (this.pickingFBO) {
            this.picking = new reshader.FBORayPicking(
                this.renderer,
                {
                    vert : pickingVert,
                    uniforms : [
                        'cameraToCenterDistance',
                        'lineWidth',
                        'lineGapWidth',
                        {
                            name : 'projViewModelMatrix',
                            type : 'function',
                            fn : function (context, props) {
                                const projViewModelMatrix = [];
                                mat4.multiply(projViewModelMatrix, props['projViewMatrix'], props['modelMatrix']);
                                return projViewModelMatrix;
                            }
                        },
                        'tileRatio',
                        'resolution',
                        'tileResolution',
                        'lineDx',
                        'lineDy',
                        'canvasSize'
                    ]
                },
                this.pickingFBO
            );
        }
    }

    createShader() {
        const canvas = this.canvas;
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
        this.shader = new reshader.MeshShader({
            vert, frag,
            uniforms : [
                'cameraToCenterDistance',
                'lineWidth',
                'lineGapWidth',
                'lineBlur',
                'lineOpacity',
                {
                    name : 'projViewModelMatrix',
                    type : 'function',
                    fn : function (context, props) {
                        const projViewModelMatrix = [];
                        mat4.multiply(projViewModelMatrix, props['projViewMatrix'], props['modelMatrix']);
                        return projViewModelMatrix;
                    }
                },
                'tileRatio',
                'resolution',
                'tileResolution',
                'lineDx',
                'lineDy',
                'canvasSize'
            ],
            extraCommandProps : {
                viewport,
                stencil: {
                    enable: true,
                    mask : 0xFF,
                    func: {
                        cmp: '<=',
                        ref: (context, props) => {
                            return props.level;
                        },
                        mask: 0xFF
                    },
                    op: {
                        fail: 'keep',
                        zfail: 'keep',
                        zpass: 'replace'
                    }
                },
                depth : {
                    enable : true,
                    func : this.sceneConfig.depthFunc || 'always'
                },
                blend: {
                    enable: true,
                    func: {
                        src: 'src alpha',
                        dst: 'one minus src alpha'
                    },
                    // func : {
                    //     srcRGB: 'src alpha',
                    //     srcAlpha: 'src alpha',
                    //     dstRGB: 'one minus src alpha',
                    //     dstAlpha: 1
                    // },
                    equation: 'add'
                },
            }
        });
    }

    getUniformValues(map) {
        const viewMatrix = map.viewMatrix,
            projViewMatrix = map.projViewMatrix,
            uMatrix = mat4.translate([], viewMatrix, map.cameraPosition),
            cameraToCenterDistance = map.cameraToCenterDistance,
            resolution = map.getResolution(),
            canvasSize = [map.width, map.height];
        return {
            uMatrix, projViewMatrix, cameraToCenterDistance, resolution, canvasSize
        };
    }
}

export default LinePainter;
