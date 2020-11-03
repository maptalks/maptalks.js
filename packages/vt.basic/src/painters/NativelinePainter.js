import { reshader, mat4 } from '@maptalks/gl';
import { extend, setUniformFromSymbol, createColorSetter } from '../Util';
import Painter from './Painter';
import vert from './glsl/native-line.vert';
import frag from './glsl/native-line.frag';
import pickingVert from './glsl/native-line.vert';
import { piecewiseConstant, isFunctionDefinition } from '@maptalks/function-type';

class NativeLinePainter extends Painter {
    constructor(regl, layer, symbol, sceneConfig, pluginIndex) {
        super(regl, layer, symbol, sceneConfig, pluginIndex);
        if (isFunctionDefinition(this.symbolDef['lineColor'])) {
            const map = layer.getMap();
            const fn = piecewiseConstant(this.symbolDef['lineColor']);
            this.colorSymbol = properties => fn(map.getZoom(), properties);
        }
    }

    needPolygonOffset() {
        return true;
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
        const material = new reshader.Material(uniforms);
        const mesh = new reshader.Mesh(geometry, material, {
            castShadow: false,
            picking: true
        });
        mesh.setLocalTransform(transform);
        return mesh;
    }

    getMeshUniforms(geometry, symbol) {
        this._colorCache = this._colorCache || {};
        const uniforms = {};
        setUniformFromSymbol(uniforms, 'lineColor', symbol, 'lineColor', '#000', createColorSetter(this._colorCache));
        setUniformFromSymbol(uniforms, 'lineOpacity', symbol, 'lineOpacity', 1);
        return uniforms;
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
        const depthRange = this.sceneConfig.depthRange;
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
                    range: depthRange || [0, 1],
                    func: this.sceneConfig.depthFunc || '<='
                },
                blend: {
                    enable: true,
                    func: this.getBlendFunc(),
                    equation: 'add'
                },
                polygonOffset: {
                    enable: true,
                    offset: this.getPolygonOffset()
                }
            }
        };

        this.shader = new reshader.MeshShader(config);

        if (this.pickingFBO) {
            this.picking = new reshader.FBORayPicking(
                this.renderer,
                {
                    vert: '#define PICKING_MODE 1\n' + pickingVert,
                    uniforms,
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

export default NativeLinePainter;
