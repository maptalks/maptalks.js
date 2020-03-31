import { reshader, mat4 } from '@maptalks/gl';
import { extend } from '../Util';
import Painter from './Painter';
import vert from './glsl/native-point.vert';
import frag from './glsl/native-point.frag';
import pickingVert from './glsl/native-point.picking.vert';
import { setUniformFromSymbol, createColorSetter } from '../Util';

const DEFAULT_UNIFORMS = {
    markerFill: [0, 0, 0],
    markerOpacity: 1,
    markerSize: 10
};

class NativePointPainter extends Painter {

    createGeometry(glData) {
        const data = extend({}, glData.data);
        const geometry = new reshader.Geometry(data, null, 0, { primitive: 'points', positionSize: glData.positionSize });
        return geometry;
    }

    createMesh(geometry, transform) {
        const symbol = this.getSymbol();
        geometry.generateBuffers(this.regl);
        this._colorCache = this._colorCache || {};
        const uniforms = {};
        setUniformFromSymbol(uniforms, 'markerOpacity', symbol, 'markerOpacity', 1);
        setUniformFromSymbol(uniforms, 'markerSize', symbol, 'markerSize', 10);
        setUniformFromSymbol(uniforms, 'markerFill', symbol, 'markerFill', '#000', createColorSetter(this._colorCache, 3));
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
        if (geometry.desc.positionSize === 2) {
            mesh.setDefines({
                'IS_2D_POSITION': 1
            });
        }
        mesh.setLocalTransform(transform);
        return mesh;
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
                    range: this.sceneConfig.depthRange || [0, 1],
                    func: this.sceneConfig.depthFunc || 'always'
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
