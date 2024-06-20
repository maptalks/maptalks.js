import { Color } from '@maptalks/vector-packer';
import { reshader, mat4 } from '@maptalks/gl';
import BasicPainter from './BasicPainter';
import vert from './glsl/native-point.vert';
import frag from './glsl/native-point.frag';
import pickingVert from './glsl/native-point.vert';
import { setUniformFromSymbol, createColorSetter, toUint8ColorInGlobalVar } from '../Util';
import { isFunctionDefinition, piecewiseConstant } from '@maptalks/function-type';
import { prepareFnTypeData } from './util/fn_type_util';

const DEFAULT_UNIFORMS = {
    markerFill: [0, 0, 0],
    markerOpacity: 1,
    markerSize: 10
};

class NativePointPainter extends BasicPainter {

    getPrimitive() {
        return 'points';
    }

    isTerrainSkin() {
        return false;
    }

    isTerrainVector() {
        return this.layer.options.awareOfTerrain;
    }

    isUniqueStencilRefPerTile() {
        return false;
    }

    createMesh(geo, transform) {
        const { geometry, symbolIndex, ref } = geo;
        const symbol = this.getSymbol(symbolIndex);
        if (ref === undefined) {
            const symbolDef = this.getSymbolDef(symbolIndex);
            const fnTypeConfig = this.getFnTypeConfig(symbolIndex);
            prepareFnTypeData(geometry, symbolDef, fnTypeConfig);
            geometry.generateBuffers(this.regl);
        }

        const uniforms = {};
        setUniformFromSymbol(uniforms, 'markerOpacity', symbol, 'markerOpacity', 1);
        setUniformFromSymbol(uniforms, 'markerSize', symbol, 'markerSize', 10);
        setUniformFromSymbol(uniforms, 'markerFill', symbol, 'markerFill', '#000', createColorSetter(this.colorCache, 3));
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
        const defines = {};
        if (mesh.geometry.data.aAltitude) {
            defines['HAS_ALTITUDE'] = 1;
        }
        if (geometry.data.aColor) {
            defines['HAS_COLOR'] = 1;
        }
        mesh.setDefines(defines);
        mesh.positionMatrix = this.getAltitudeOffsetMatrix();
        mesh.setLocalTransform(transform);
        mesh.properties.symbolIndex = symbolIndex;
        return mesh;
    }

    createFnTypeConfig(map, symbolDef) {
        const aColorFn = piecewiseConstant(symbolDef['markerFill']);
        return [
            {
                //geometry.data 中的属性数据
                attrName: 'aColor',
                //symbol中的function-type属性
                symbolName: 'markerFill',
                type: Uint8Array,
                width: 4,
                define: 'HAS_COLOR',
                evaluate: (properties, geometry) => {
                    let color = aColorFn(map.getZoom(), properties);
                    if (isFunctionDefinition(color)) {
                        color = this.evaluateInFnTypeConfig(color, geometry, map, properties, true);
                    }
                    if (!Array.isArray(color)) {
                        color = this.colorCache[color] = this.colorCache[color] || Color(color).unitArray();
                    }
                    color = toUint8ColorInGlobalVar(color);
                    return color;
                }
            }
        ];
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
        const projViewModelMatrix = [];
        // const stencil = this.isOnly2D();
        const config = {
            vert,
            frag,
            uniforms: [
                {
                    name: 'projViewModelMatrix',
                    type: 'function',
                    fn: function (context, props) {
                        mat4.multiply(projViewModelMatrix, props['projViewMatrix'], props['modelMatrix']);
                        return projViewModelMatrix;
                    }
                }
            ],
            defines: null,
            extraCommandProps: {
                viewport,
                // stencil: {
                //     enable: false,
                //     func: {
                //         cmp: () => {
                //             return stencil ? '=' : '<=';
                //         },
                //         ref: (context, props) => {
                //             return stencil ? props.stencilRef : props.level;
                //         },
                //         mask: 0xFF
                //     },
                //     op: {
                //         fail: 'keep',
                //         zfail: 'keep',
                //         zpass: () => {
                //             return stencil ? 'zero' : 'replace';
                //         }
                //     }
                // },
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
            const projViewModelMatrix = [];
            this.picking = [new reshader.FBORayPicking(
                this.renderer,
                {
                    vert: '#define PICKING_MODE 1\n' + pickingVert,
                    uniforms: [
                        {
                            name: 'projViewModelMatrix',
                            type: 'function',
                            fn: function (context, props) {
                                mat4.multiply(projViewModelMatrix, props['projViewMatrix'], props['modelMatrix']);
                                return projViewModelMatrix;
                            }
                        }
                    ],
                    extraCommandProps: {
                        viewport: this.pickingViewport
                    }
                },
                this.pickingFBO,
                this.getMap()
            )];
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
