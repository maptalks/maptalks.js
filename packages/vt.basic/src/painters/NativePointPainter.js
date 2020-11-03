import { reshader, mat4 } from '@maptalks/gl';
import { extend } from '../Util';
import Painter from './Painter';
import vert from './glsl/native-point.vert';
import frag from './glsl/native-point.frag';
import pickingVert from './glsl/native-point.vert';
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

        material.appendDefines = (defines/*, geometry*/) => {
            if (symbol.markerType !== 'square') {
                defines['USE_CIRCLE'] = 1;
            }
            return defines;
        };
        const mesh = new reshader.Mesh(geometry, material, {
            castShadow: false,
            picking: true
        });
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
        const stencil = this.layer.getRenderer().isEnableTileStencil && this.layer.getRenderer().isEnableTileStencil();
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
                        cmp: () => {
                            return stencil ? '=' : '<=';
                        },
                        ref: (context, props) => {
                            return stencil ? props.stencilRef : props.level;
                        },
                        mask: 0xFF
                    },
                    op: {
                        fail: 'keep',
                        zfail: 'keep',
                        zpass: 'replace'
                    }
                },
                depth: {
                    enable: true,
                    mask: false,
                    range: this.sceneConfig.depthRange || [0, 1],
                    func: this.sceneConfig.depthFunc || 'always'
                },
                blend: {
                    enable: true,
                    func: this.getBlendFunc(),
                    equation: 'add'
                }
            }
        };

        this.shader = new reshader.MeshShader(config);
        this.shader.version = 300;

        if (this.pickingFBO) {
            this.picking = new reshader.FBORayPicking(
                this.renderer,
                {
                    vert: '#define PICKING_MODE 1\n' + pickingVert,
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
                    extraCommandProps: {
                        viewport: this.pickingViewport
                    }
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
