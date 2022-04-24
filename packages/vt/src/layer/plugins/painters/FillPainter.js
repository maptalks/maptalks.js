import BasicPainter from './BasicPainter';
import { reshader, mat4 } from '@maptalks/gl';
import vert from './glsl/fill.vert';
import frag from './glsl/fill.frag';
import pickingVert from './glsl/fill.picking.vert';
import { isNumber, isNil, setUniformFromSymbol, createColorSetter, toUint8ColorInGlobalVar } from '../Util';
import { prepareFnTypeData } from './util/fn_type_util';
import { createAtlasTexture } from './util/atlas_util';
import { isFunctionDefinition, piecewiseConstant, interpolated } from '@maptalks/function-type';
import Color from 'color';

const DEFAULT_UNIFORMS = {
    'polygonFill': [1, 1, 1, 1],
    'polygonOpacity': 1,
    'uvScale': [1, 1],
    'uvOffset': [0, 0]
};

class FillPainter extends BasicPainter {
    prepareSymbol(symbol) {
        const polygonFill = symbol.polygonFill;
        if (Array.isArray(polygonFill)) {
            if (polygonFill.length === 3) {
                polygonFill.push(1);
            }
            symbol.polygonFill = polygonFill.map(c => c * 255);
        }
    }

    supportRenderMode(mode) {
        if (this.sceneConfig.antialias || this.sceneConfig.antialias === undefined) {
            //turn on antialias if set
            return mode === 'fxaa' || mode === 'fxaaBeforeTaa';
        } else {
            return super.supportRenderMode(mode);
        }
    }

    isBloom(mesh) {
        const symbol = this.getSymbol(mesh.properties.symbolIndex);
        return !!symbol['polygonBloom'];
    }

    needPolygonOffset() {
        return true;
    }

    createMesh(geo, transform, params) {
        const { tilePoint } = params;
        const { geometry, symbolIndex, ref } = geo;
        const isVectorTile = geometry.data.aPosition instanceof Int16Array;
        const uniforms = {
            tileExtent: geometry.properties.tileExtent,
            tileRatio: geometry.properties.tileRatio
        };

        const symbol = this.getSymbol(symbolIndex);

        setUniformFromSymbol(uniforms, 'polygonFill', symbol, 'polygonFill', DEFAULT_UNIFORMS['polygonFill'], createColorSetter(this.colorCache));
        setUniformFromSymbol(uniforms, 'polygonOpacity', symbol, 'polygonOpacity', DEFAULT_UNIFORMS['polygonOpacity']);
        setUniformFromSymbol(uniforms, 'uvScale', symbol, 'uvScale', DEFAULT_UNIFORMS['uvScale']);
        setUniformFromSymbol(uniforms, 'uvOffset', symbol, 'uvOffset', DEFAULT_UNIFORMS['uvOffset']);

        if (ref === undefined) {
            const symbolDef = this.getSymbolDef(symbolIndex);
            const fnTypeConfig = this.getFnTypeConfig(symbolIndex);
            prepareFnTypeData(geometry, symbolDef, fnTypeConfig);
            geometry.generateBuffers(this.regl);
        }

        const iconAtlas = geometry.properties.iconAtlas;
        if (iconAtlas && geometry.data.aTexInfo) {
            // const resolution = this.getMap().getResolution();
            const map = this.getMap();
            uniforms.tilePoint = tilePoint;
            // Object.defineProperty(uniforms, 'tilePoint', {
            //     enumerable: true,
            //     get: function () {
            //         const tileScale = geometry.properties.tileResolution / map.getResolution();
            //         return [tilePoint[0] * tileScale, tilePoint[1] * tileScale];
            //     }
            // });
            Object.defineProperty(uniforms, 'tileScale', {
                enumerable: true,
                get: function () {
                    return geometry.properties.tileResolution / map.getResolution();
                }
            });
            // uniforms.tileRatio = geometry.properties.tileResolution / resolution / geometry.properties.tileRatio;
            //如果SCALE[0] !== 1，说明是Vector3DLayer，则texture不用设置flipY
            uniforms.polygonPatternFile = createAtlasTexture(this.regl, iconAtlas, false);
            uniforms.atlasSize = [iconAtlas.width, iconAtlas.height];
            this.drawDebugAtlas(iconAtlas);
        }

        const material = new reshader.Material(uniforms, DEFAULT_UNIFORMS);
        const mesh = new reshader.Mesh(geometry, material, {
            disableVAO: true,
            castShadow: false,
            picking: true
        });
        const defines = {};
        if (iconAtlas && geometry.data.aTexInfo) {
            defines['HAS_PATTERN'] = 1;
        }
        if (geometry.data.aColor) {
            defines['HAS_COLOR'] = 1;
        }
        if (geometry.data.aOpacity) {
            defines['HAS_OPACITY'] = 1;
        }
        if (geometry.data.aUVScale) {
            defines['HAS_UV_SCALE'] = 1;
        }
        if (geometry.data.aUVOffset) {
            defines['HAS_UV_OFFSET'] = 1;
        }

        if (isVectorTile) {
            defines['IS_VT'] = 1;
        }

        mesh.setDefines(defines);
        mesh.setLocalTransform(transform);
        mesh.properties.symbolIndex = symbolIndex;
        return mesh;
    }

    createFnTypeConfig(map, symbolDef) {
        const polygonFillFn = piecewiseConstant(symbolDef['polygonFill']);
        const polygonOpacityFn = interpolated(symbolDef['polygonOpacity']);
        const uvScaleFn = interpolated(symbolDef['uvScale']);
        const uvOffsetFn = interpolated(symbolDef['uvOffset']);
        const u8 = new Uint8Array(1);
        const u16 = new Uint16Array(1);
        return [
            {
                //geometry.data 中的属性数据
                attrName: 'aColor',
                //symbol中的function-type属性
                symbolName: 'polygonFill',
                type: Uint8Array,
                width: 4,
                define: 'HAS_COLOR',
                //
                evaluate: (properties, _, geometry) => {
                    let color = polygonFillFn(map.getZoom(), properties);
                    if (isFunctionDefinition(color)) {
                        color = this.evaluateInFnTypeConfig(color, geometry, map, properties, true);
                    }
                    if (!Array.isArray(color)) {
                        color = this.colorCache[color] = this.colorCache[color] || Color(color).unitArray();
                    }
                    color = toUint8ColorInGlobalVar(color);
                    return color;
                }
            },
            {
                attrName: 'aOpacity',
                symbolName: 'polygonOpacity',
                type: Uint8Array,
                width: 1,
                define: 'HAS_OPACITY',
                evaluate: (properties, _, geometry) => {
                    let opacity = polygonOpacityFn(map.getZoom(), properties);
                    if (isFunctionDefinition(opacity)) {
                        opacity = this.evaluateInFnTypeConfig(opacity, geometry, map, properties);
                    }
                    u8[0] = opacity * 255;
                    return u8[0];
                }
            },
            {
                attrName: 'aUVScale',
                symbolName: 'uvScale',
                // 0.01 - 20
                type: Uint16Array,
                width: 2,
                define: 'HAS_UV_SCALE',
                evaluate: properties => {
                    let scale = uvScaleFn(map.getZoom(), properties);
                    u16[0] = scale * 10;
                    return u16[0];
                }
            },
            {
                attrName: 'aUVOffset',
                symbolName: 'uvOffset',
                type: Uint8Array,
                width: 2,
                define: 'HAS_UV_OFFSET',
                evaluate: properties => {
                    let offset = uvOffsetFn(map.getZoom(), properties);
                    u8[0] = offset * 255;
                    return u8[0];
                }
            }
        ];
    }

    paint(context) {
        if (context.states && context.states.includesChanged['shadow']) {
            this.shader.dispose();
            this._createShader(context);
        }
        super.paint(context);
    }

    init(context) {
        const regl = this.regl;


        this.renderer = new reshader.Renderer(regl);

        const renderer = this.layer.getRenderer();
        const stencil = renderer.isEnableTileStencil && renderer.isEnableTileStencil();
        const depthRange = this.sceneConfig.depthRange;
        const extraCommandProps = {
            viewport: this.pickingViewport,
            stencil: {
                enable: true,
                func: {
                    cmp: () => {
                        return stencil ? '=' : '<=';
                    },
                    ref: (context, props) => {
                        return stencil ? props.stencilRef : props.level;
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
                range: depthRange || [0, 1],
                // 如果mask设为true，fill会出现与轮廓线的深度冲突，出现奇怪的绘制
                // 如果mask设为false，会出现 antialias 打开时，会被Ground的ssr覆盖的问题 （绘制时ssr需要对比深度值）
                // 以上问题已经解决 #284
                mask: (_, props) => {
                    if (!isNil(this.sceneConfig.depthMask)) {
                        return !!this.sceneConfig.depthMask;
                    }
                    if (props.meshConfig.transparent) {
                        return false;
                    }
                    const opacity = props['polygonOpacity'];
                    return !(isNumber(opacity) && opacity < 1);
                },
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
        };
        this._createShader(context, extraCommandProps);

        if (this.pickingFBO) {
            this.picking = [new reshader.FBORayPicking(
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
                    ],
                    extraCommandProps
                },
                this.pickingFBO
            )];
        }
    }

    _createShader(context, extraCommandProps) {
        const uniforms = [
            {
                name: 'projViewModelMatrix',
                type: 'function',
                fn: function (context, props) {
                    const projViewModelMatrix = [];
                    mat4.multiply(projViewModelMatrix, props['projViewMatrix'], props['modelMatrix']);
                    return projViewModelMatrix;
                }
            },
        ];
        const defines = {};
        this.fillIncludes(defines, uniforms, context);


        this.shader = new reshader.MeshShader({
            vert, frag,
            uniforms,
            defines,
            extraCommandProps
        });
    }

    getUniformValues(map, context) {
        const projViewMatrix = map.projViewMatrix;
        const uniforms = {
            projViewMatrix,
            glScale: 1 / map.getGLScale(),
            blendSrcIsOne: +(!!(this.sceneConfig.blendSrc === 'one'))
        };
        this.setIncludeUniformValues(uniforms, context);
        return uniforms;
    }
}

export default FillPainter;
