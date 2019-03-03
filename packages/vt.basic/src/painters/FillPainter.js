import BasicPainter from './BasicPainter';
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

class FillPainter extends BasicPainter {

    createMesh(geometry, transform) {
        const symbol = this.getSymbol();
        const uniforms = {};
        if (symbol['polygonFill']) {
            const color = Color(symbol['polygonFill']);
            uniforms.polygonFill = color.unitArray();
            if (uniforms.polygonFill.length === 3) {
                uniforms.polygonFill.push(1);
            }
        }
        if (symbol['polygonOpacity'] || symbol['polygonOpacity'] === 0) {
            uniforms.polygonOpacity = symbol['polygonOpacity'];
        }
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
        const regl = this.regl;
        const canvas = this.canvas;

        this.renderer = new reshader.Renderer(regl);

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
                viewport,
                stencil: {
                    enable: true,
                    mask : 0xFF,
                    func: {
                        cmp: '<',
                        ref: (context, props) => {
                            return props.level;
                        },
                        mask: 0xFF
                    },
                    opFront: {
                        fail: 'keep',
                        zfail: 'keep',
                        zpass: 'replace'
                    },
                    opBack: {
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
                    equation: 'add'
                },
            }
        });
        if (this.pickingFBO) {
            this.picking = new reshader.FBORayPicking(
                this.renderer,
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
