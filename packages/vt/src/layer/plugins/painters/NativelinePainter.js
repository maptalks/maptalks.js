import { reshader, mat4 } from '@maptalks/gl';
import { setUniformFromSymbol, createColorSetter } from '../Util';
import BasicPainter from './BasicPainter';
import vert from './glsl/native-line.vert';
import frag from './glsl/native-line.frag';
import pickingVert from './glsl/native-line.vert';
import { piecewiseConstant, isFunctionDefinition } from '@maptalks/function-type';

const IDENTITY_ARR = mat4.identity([]);

class NativeLinePainter extends BasicPainter {
    constructor(regl, layer, symbol, sceneConfig, pluginIndex, dataConfig) {
        super(regl, layer, symbol, sceneConfig, pluginIndex, dataConfig);
        this.primitive = 'lines';
        if (isFunctionDefinition(this.symbolDef['lineColor'])) {
            const map = layer.getMap();
            const fn = piecewiseConstant(this.symbolDef['lineColor']);
            this.colorSymbol = properties => fn(map.getZoom(), properties);
        }
    }

    needPolygonOffset() {
        return true;
    }

    createMesh(geo, transform) {
        const { geometry, symbolIndex, ref } = geo;
        const symbol = this.getSymbol(symbolIndex);
        const uniforms = this.getMeshUniforms(geometry, symbol);
        if (ref === undefined) {
            geometry.generateBuffers(this.regl);
        }
        const material = new reshader.Material(uniforms);
        const mesh = new reshader.Mesh(geometry, material, {
            castShadow: false,
            picking: true
        });
        mesh.setLocalTransform(transform);
        mesh.properties.symbolIndex = symbolIndex;

        const defines = {};
        if (mesh.geometry.data.aAltitude) {
            defines['HAS_ALTITUDE'] = 1;
        }
        mesh.setDefines(defines);
        return mesh;
    }

    getMeshUniforms(geometry, symbol) {
        const uniforms = {};
        setUniformFromSymbol(uniforms, 'lineColor', symbol, 'lineColor', '#000', createColorSetter(this.colorCache));
        setUniformFromSymbol(uniforms, 'lineOpacity', symbol, 'lineOpacity', 1);
        return uniforms;
    }

    isEnableTileStencil(context) {
        const isRenderingTerrainSkin = !!(context && context.isRenderingTerrain && this.isTerrainSkin());
        const isEnableStencil = !isRenderingTerrainSkin;
        return isEnableStencil;
    }

    init(context) {
        const regl = this.regl;

        this.renderer = new reshader.Renderer(regl);
        const canvas = this.canvas;

        const viewport = {
            x: (_, props) => {
                return props.viewport ? props.viewport.x : 0;
            },
            y: (_, props) => {
                return props.viewport ? props.viewport.y : 0;
            },
            width: (_, props) => {
                return props.viewport ? props.viewport.width : (canvas ? canvas.width : 1);
            },
            height: (_, props) => {
                return props.viewport ? props.viewport.height : (canvas ? canvas.height : 1);
            },
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
                    enable: () => {
                        return this.isEnableTileStencil(context);
                    },
                    mask: 0xFF,
                    func: {
                        cmp: () => {
                            return this.isOnly2D() ? '=' : '<=';
                        },
                        ref: (context, props) => {
                            return props.stencilRef;
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
            this.picking = [new reshader.FBORayPicking(
                this.renderer,
                {
                    vert: '#define PICKING_MODE 1\n' + pickingVert,
                    uniforms,
                    extraCommandProps: {
                        viewport: this.pickingViewport
                    }
                },
                this.pickingFBO,
                this.getMap()
            )];
        }
    }

    getUniformValues(map, context) {
        const isRenderingTerrainSkin = context && context.isRenderingTerrainSkin;
        const projViewMatrix = isRenderingTerrainSkin ? IDENTITY_ARR : map.projViewMatrix;
        return {
            projViewMatrix,
            viewport: isRenderingTerrainSkin && context && context.viewport,
        };
    }

    getPrimitive() {
        return 'lines';
    }
}

export default NativeLinePainter;
