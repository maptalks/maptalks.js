import { reshader, mat4 } from '@maptalks/gl';
import { extend, setUniformFromSymbol, createColorSetter } from '../Util';
import Painter from './Painter';
import vert from './glsl/native-line.vert';
import frag from './glsl/native-line.frag';
import pickingVert from './glsl/native-line.picking.vert';

const defaultUniforms = {
    lineColor: [0, 0, 0],
    lineOpacity: 1
};

class NativeLinePainter extends Painter {
    constructor(regl, layer, sceneConfig, pluginIndex) {
        super(regl, layer, sceneConfig, pluginIndex);
        this.colorSymbol = 'lineColor';
    }

    createGeometry(glData) {
        const data = extend({}, glData.data);
        const geometry = new reshader.Geometry(data, glData.indices, 0, { primitive: 'lines', positionSize: glData.positionSize });
        return geometry;

    }

    createMesh(geometry, transform) {
        const symbol = this.getSymbol();
        const uniforms = this.getMeshUniforms(geometry, symbol);
        geometry.generateBuffers(this.regl);
        const material = new reshader.Material(uniforms, defaultUniforms);
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

    getMeshUniforms(geometry, symbol) {
        this._colorCache = this._colorCache || {};
        const uniforms = {};
        setUniformFromSymbol(uniforms, 'lineColor', symbol, 'lineColor', createColorSetter(this._colorCache));
        setUniformFromSymbol(uniforms, 'lineOpacity', symbol, 'lineOpacity');
        return uniforms;
    }

    canStencil() {
        return true;
    }

    init() {
        const stencil = this.layer.getRenderer().isEnableTileStencil();
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

        const uniforms = [
            {
                name: 'projViewModelMatrix',
                type: 'function',
                fn: function (context, props) {
                    const projViewModelMatrix = [];
                    mat4.multiply(projViewModelMatrix, props['projViewMatrix'], props['modelMatrix']);
                    return projViewModelMatrix;
                }
            }
        ];

        const config = {
            vert,
            frag,
            uniforms,
            defines: null,
            extraCommandProps: {
                viewport,
                stencil: {
                    enable: true,
                    mask: 0xFF,
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
                    range: this.sceneConfig.depthRange || [0, 1],
                    func: this.sceneConfig.depthFunc || '<'
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
                    uniforms
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

export default NativeLinePainter;
