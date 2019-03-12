import Color from 'color';
import { reshader, mat4 } from '@maptalks/gl';
import { extend } from '../Util';
import Painter from './Painter';
import vert from './glsl/native-point.vert';
import frag from './glsl/native-point.frag';
import pickingVert from './glsl/native-point.picking.vert';

const DEFAULT_UNIFORMS = {
    markerFill: [0, 0, 0],
    markerOpacity: 1,
    markerSize: 10
};

class NativePointPainter extends Painter {

    createGeometry(glData) {
        const data = extend({}, glData.data);
        data.aPickingId = data.featureIndexes;
        delete data.featureIndexes;
        const geometry = new reshader.Geometry(data, null, 0, { primitive: 'points' });
        return geometry;
    }

    createMesh(geometry, transform) {
        const symbol = this.getSymbol();
        const uniforms = this.getMeshUniforms(geometry, symbol);
        geometry.generateBuffers(this.regl);

        const material = new reshader.Material(uniforms, DEFAULT_UNIFORMS);
        material.createDefines = () => {
            if (symbol.markerType !== 'square') {
                return {
                    'USE_CIRCLE': 1
                };
            }
            return null;
        };

        const mesh = new reshader.Mesh(geometry, material, {
            castShadow: false,
            picking: true
        });

        mesh.setLocalTransform(transform);
        return mesh;
    }

    getMeshUniforms(geometry, symbol) {
        const uniforms = {};
        if (symbol['markerOpacity'] || symbol['markerOpacity'] === 0) {
            uniforms.markerOpacity = symbol['markerOpacity'];
        }
        if (symbol['markerFill']) {
            uniforms.markerFill = Color(symbol['markerFill']).array();
        }
        if (symbol['markerSize']) {
            uniforms.markerSize = symbol['markerSize'];
        }
        return uniforms;
    }

    init() {
        const regl = this.regl;

        this.renderer = new reshader.Renderer(regl);

        const viewport = {
            x: 0,
            y: 0,
            width: () => {
                return this.canvas ? this.canvas.width : 1;
            },
            height: () => {
                return this.canvas ? this.canvas.height : 1;
            }
        };

        const config = {
            vert,
            frag,
            uniforms: [
                {
                    name: 'projViewModelMatrix',
                    type: 'function',
                    fn: function (context, props) {
                        const projViewModelMatrix = [];
                        mat4.multiply(projViewModelMatrix, props['projViewMatrix'], props['modelMatrix']);
                        return projViewModelMatrix;
                    }
                }
            ],
            defines: null,
            extraCommandProps: {
                viewport,
                stencil: {
                    enable: true,
                    func: {
                        cmp: '<=',
                        ref: (context, props) => {
                            return props.level;
                        }
                    },
                    op: {
                        fail: 'keep',
                        zfail: 'keep',
                        zpass: 'replace'
                    }
                },
                depth: {
                    enable: true,
                    func: this.sceneConfig.depthFunc || '<='
                },
                blend: {
                    enable: true,
                    func: {
                        src: 'src alpha',
                        dst: 'one minus src alpha'
                    },
                    equation: 'add'
                }
            }
        };

        this.shader = new reshader.MeshShader(config);

        if (this.pickingFBO) {
            this.picking = new reshader.FBORayPicking(
                this.renderer,
                {
                    vert: pickingVert,
                    uniforms: [
                        {
                            name: 'projViewModelMatrix',
                            type: 'function',
                            fn: function (context, props) {
                                const projViewModelMatrix = [];
                                mat4.multiply(projViewModelMatrix, props['projViewMatrix'], props['modelMatrix']);
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
        const projViewMatrix = map.projViewMatrix;
        return {
            projViewMatrix
        };
    }
}

export default NativePointPainter;
