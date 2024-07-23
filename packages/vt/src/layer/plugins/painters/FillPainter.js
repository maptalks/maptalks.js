import * as maptalks from 'maptalks';
import BasicPainter from './BasicPainter';
import { vec2, reshader, mat4 } from '@maptalks/gl';
import vert from './glsl/fill.vert';
import frag from './glsl/fill.frag';
import pickingVert from './glsl/fill.picking.vert';
import { isNumber, isNil, setUniformFromSymbol, createColorSetter, toUint8ColorInGlobalVar, meterToPoint } from '../Util';
import { prepareFnTypeData } from './util/fn_type_util';
import { createAtlasTexture } from './util/atlas_util';
import { isFunctionDefinition, piecewiseConstant, interpolated } from '@maptalks/function-type';
import { Color } from '@maptalks/vector-packer';
import { isObjectEmpty } from './util/is_obj_empty';
import { INVALID_TEX_COORD } from '@maptalks/vector-packer';

const IDENTITY_ARR = mat4.identity([]);

const DEFAULT_UNIFORMS = {
    'polygonFill': [1, 1, 1, 1],
    'polygonOpacity': 1,
    'uvScale': [1, 1],
    'uvOffset': [0, 0],
    'patternWidth': [0, 0],
    'patternOffset': [0, 0]
};

const EMPTY_ARRAY = [];

const COORD0 = new maptalks.Coordinate(0, 0);
const COORD1 = new maptalks.Coordinate(0, 0);
const COORD2 = new maptalks.Coordinate(0, 0);

const ARR_0 = [];

class FillPainter extends BasicPainter {
    static getBloomSymbol() {
        return ['polygonBloom'];
    }

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
        const bloomSymbol = FillPainter.getBloomSymbol()[0];
        return !!symbol[bloomSymbol];
    }

    forbiddenTerrainUpscale() {
        return true;
    }

    needPolygonOffset() {
        return true;
    }

    // getShadowMeshes() {
    //     if (!this.isVisible()) {
    //         return EMPTY_ARRAY;
    //     }
    //     const meshes = this.scene.getMeshes().filter(m => m.properties.level === 0 && !m.geometry.properties.is2D);
    //     this.shadowCount = meshes.length;
    //     return meshes;
    // }

    getAnalysisMeshes() {
        if (!this.isVisible()) {
            return EMPTY_ARRAY;
        }
        const meshes = this.scene.getMeshes().filter(m => m.properties.level === 0);
        return meshes;
    }

    createMesh(geo, transform, params) {
        const map = this.getMap();
        const { tilePoint } = params;
        const { geometry, symbolIndex, ref } = geo;
        const isVectorTile = this.layer instanceof maptalks.TileLayer;
        const tileSize = this.layer.getTileSize().width;
        const tileRatio = geometry.properties.tileExtent / tileSize;
        const tileRes = geometry.properties.tileResolution;
        const tileCoord = map.pointAtResToCoord(COORD0.set(tilePoint[0], tilePoint[1]), tileRes);
        const uniforms = {
            tileExtent: geometry.properties.tileExtent,
            tileRatio
        };

        const symbol = this.getSymbol(symbolIndex);
        const symbolDef = this.getSymbolDef(symbolIndex);

        if (isFunctionDefinition(symbolDef['polygonPatternFileOrigin'])) {
            this._preparePatternOrigin(symbolDef, geo, isVectorTile ? [0, 0] : tilePoint, tileRes);
        }
        if (isFunctionDefinition(symbolDef['polygonPatternFileWidth']) || isFunctionDefinition(symbolDef['polygonPatternFileWidth'])) {
            this._preparePatternWidth(symbolDef, geo, isVectorTile ? tileRatio : 1, tileCoord, tileRes);
        }
        if (symbolDef['uvOffsetInMeter'] && isFunctionDefinition(symbolDef['uvOffset'])) {
            this._preparePatternOffset(symbolDef, geo, tileCoord, tileRes);
        }


        setUniformFromSymbol(uniforms, 'polygonFill', symbol, 'polygonFill', DEFAULT_UNIFORMS['polygonFill'], createColorSetter(this.colorCache));
        setUniformFromSymbol(uniforms, 'polygonOpacity', symbol, 'polygonOpacity', DEFAULT_UNIFORMS['polygonOpacity']);
        setUniformFromSymbol(uniforms, 'uvScale', symbol, 'uvScale', DEFAULT_UNIFORMS['uvScale']);
        // setUniformFromSymbol(uniforms, 'uvOffset', symbol, 'uvOffset', DEFAULT_UNIFORMS['uvOffset']);

        if (ref === undefined) {

            const fnTypeConfig = this.getFnTypeConfig(symbolIndex);
            prepareFnTypeData(geometry, symbolDef, fnTypeConfig);
            geometry.generateBuffers(this.regl);
        }

        const iconAtlas = geometry.properties.iconAtlas;
        // 直接用maxIconSize对uvOrigin取余，保证icon大小不大于maxIconSize时，余数是一致的，且能提高数据精度，避免精度不够造成的绘制问题
        const maxIconSize = 2048;
        if (iconAtlas && geometry.data.aTexInfo) {
            const tilePointUniform = [];
            Object.defineProperty(uniforms, 'uvOrigin', {
                enumerable: true,
                get: () => {
                    const tileScale = uniforms.tileScale;
                    if (geometry.data.aPatternOrigin) {
                        tilePointUniform[0] = (tilePoint[0] * tileScale) % maxIconSize;
                        tilePointUniform[1] = (tilePoint[1] * tileScale) % maxIconSize;
                        return tilePointUniform;
                    }
                    const patternOrigin = symbol.polygonPatternFileOrigin;
                    if (!patternOrigin) {
                        tilePointUniform[0] = (tilePoint[0] * tileScale) % maxIconSize;
                        tilePointUniform[1] = (tilePoint[1] * tileScale) % maxIconSize;
                        return tilePointUniform;
                    }
                    COORD0.set(patternOrigin[0], patternOrigin[1]);
                    map.coordToPointAtRes(COORD0, tileRes, COORD1);
                    return vec2.set(tilePointUniform, tilePoint[0] - COORD1.x, tilePoint[1] - COORD1.y);
                }
            });

            const patternWidthUniform = [];
            Object.defineProperty(uniforms, 'patternWidth', {
                enumerable: true,
                get: () => {
                    if (geometry.data.aPatternWidth) {
                        return DEFAULT_UNIFORMS['patternWidth'];
                    }
                    const texWidth = symbolDef.polygonPatternFileWidth;
                    const texHeight = symbolDef.polygonPatternFileHeight;
                    if (!texWidth && !texHeight) {
                        return DEFAULT_UNIFORMS['patternWidth'];
                    }
                    const [ width, height ] = this._computePatternWidth(ARR_0, texWidth, texHeight, isVectorTile ? tileRatio : 1, tileCoord, tileRes);
                    return vec2.set(patternWidthUniform, width, height);
                }
            });


            Object.defineProperty(uniforms, 'uvOffset', {
                enumerable: true,
                get: () => {
                    if (geometry.data.aPatternOffset) {
                        return DEFAULT_UNIFORMS['uvOffset'];
                    }
                    if (symbolDef.uvOffsetInMeter) {
                        return DEFAULT_UNIFORMS['uvOffset'];
                    }
                    return symbol.uvOffset || DEFAULT_UNIFORMS['uvOffset'];
                }
            });

            const offsetUniform = [];
            Object.defineProperty(uniforms, 'patternOffset', {
                enumerable: true,
                get: () => {
                    if (geometry.data.aPatternOffset) {
                        return DEFAULT_UNIFORMS['uvOffset'];
                    }
                    if (!symbolDef.uvOffsetInMeter) {
                        return DEFAULT_UNIFORMS['uvOffset'];
                    }
                    const offset = symbolDef.uvOffset;
                    if (!offset) {
                        return DEFAULT_UNIFORMS['uvOffset'];
                    }
                    const offsetX = meterToPoint(map, offset[0], tileCoord, tileRes);
                    const offsetY = meterToPoint(map, offset[1], tileCoord, tileRes);
                    return vec2.set(offsetUniform, offsetX, offsetY);
                }
            });

            Object.defineProperty(uniforms, 'tileScale', {
                enumerable: true,
                get: function () {
                    const texWidth = symbolDef.polygonPatternFileWidth;
                    const texHeight = symbolDef.polygonPatternFileHeight;
                    if (texWidth || texHeight) {
                        return 1;
                    }
                    return geometry.properties.tileResolution / map.getResolution();
                }
            });
            uniforms.polygonPatternFile = createAtlasTexture(this.regl, iconAtlas, false, false);
            uniforms.atlasSize = [iconAtlas.width, iconAtlas.height];
            this.drawDebugAtlas(iconAtlas);
        }

        const material = new reshader.Material(uniforms, DEFAULT_UNIFORMS);
        const mesh = new reshader.Mesh(geometry, material, {
            // disableVAO: true,
            castShadow: false,
            picking: true
        });
        const defines = {};
        if (iconAtlas && geometry.data.aTexInfo) {
            defines['HAS_PATTERN'] = 1;
        }
        if (iconAtlas && geometry.data.aTexCoord) {
            defines['HAS_TEX_COORD'] = 1;
            defines['INVALID_TEX_COORD'] = INVALID_TEX_COORD + '.0';
        }
        if (geometry.data.aAltitude) {
            defines['HAS_ALTITUDE'] = 1;
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
        if (geometry.data.aPatternOrigin) {
            defines['HAS_PATTERN_ORIGIN'] = 1;
        }
        if (geometry.data.aPatternWidth) {
            defines['HAS_PATTERN_WIDTH'] = 1;
        }
        if (geometry.data.aPatternOffset) {
            defines['HAS_PATTERN_OFFSET'] = 1;
        }

        if (isVectorTile) {
            defines['IS_VT'] = 1;
        }

        mesh.setDefines(defines);
        mesh.setLocalTransform(transform);
        mesh.properties.symbolIndex = symbolIndex;
        return mesh;
    }

    _preparePatternWidth(symbolDef, geo, tileRatio, tileCoord, tileRes) {
        geo = geo && geo.geometry;
        if (!geo) {
            return;
        }
        const features = geo.properties.features;
        if (isObjectEmpty(features)) {
            return;
        }
        const widthSymbol = symbolDef['polygonPatternFileWidth'];
        const heightSymbol = symbolDef['polygonPatternFileHeight'];
        const originFn = interpolated(symbolDef['polygonPatternFileOrigin']);
        let widthFn, heightFn;
        if (isFunctionDefinition(widthSymbol)) {
            widthFn = interpolated(widthSymbol);
        }
        if (isFunctionDefinition(heightSymbol)) {
            heightFn = interpolated(heightSymbol);
        }

        const { aPickingId, aPatternOrigin } = geo.data;
        const count = aPickingId.length;
        const aPatternWidth = new Float32Array(count * 2);

        let current, currentScaleX, currentScaleY;
        for (let i = 0, l = aPickingId.length; i < l; i++) {
            let width, height;
            if (aPickingId[i] === current) {
                aPatternWidth[i * 2] = currentScaleX;
                aPatternWidth[i * 2 + 1] = currentScaleY;
                continue;
            }
            const feature = features[aPickingId[i]];
            width = widthFn ? widthFn(null, feature.feature.properties) : widthSymbol;
            height = heightFn ? heightFn(null, feature.feature.properties) : heightSymbol;
            current = aPickingId[i];
            if (width || height) {
                let origin = tileCoord;
                if (aPatternOrigin) {
                    const patternOrigin = originFn(null, feature.feature.properties);
                    if (patternOrigin) {
                        origin = COORD2.set(patternOrigin[0], patternOrigin[1]);
                    }
                }
                const [ scaleX, scaleY ] = this._computePatternWidth(ARR_0, width, height, tileRatio, origin, tileRes);
                currentScaleX = aPatternWidth[i * 2] = scaleX;
                currentScaleY = aPatternWidth[i * 2 + 1] = scaleY;
            } else {
                currentScaleX = aPatternWidth[i * 2] = 0;
                currentScaleY = aPatternWidth[i * 2 + 1] = 0;
            }
        }
        geo.data.aPatternWidth = aPatternWidth;
    }

    _preparePatternOffset(symbolDef, geo, tileCoord, tileRes) {
        geo = geo && geo.geometry;
        if (!geo) {
            return;
        }
        const features = geo.properties.features;
        if (isObjectEmpty(features)) {
            return;
        }
        const map = this.getMap();
        let isMeterFn = isFunctionDefinition(symbolDef['uvOffsetInMeter']) && piecewiseConstant(symbolDef['uvOffsetInMeter']);
        const uvOffsetFn = interpolated(symbolDef['uvOffset']);
        const originFn = interpolated(symbolDef['polygonPatternFileOrigin']);

        const { aPickingId, aPatternOrigin } = geo.data;
        const count = aPickingId.length;
        const aPatternOffset = new Float32Array(count * 2);

        let current, currentOffsetX, currentOffsetY;
        for (let i = 0, l = aPickingId.length; i < l; i++) {
            if (aPickingId[i] === current) {
                aPatternOffset[i * 2] = currentOffsetX;
                aPatternOffset[i * 2 + 1] = currentOffsetY;
                continue;
            }
            const feature = features[aPickingId[i]];
            const offset = uvOffsetFn(null, feature.feature.properties);
            let isUvOffsetInMeter = true;
            if (isMeterFn) {
                isUvOffsetInMeter = isMeterFn(null, feature.feature.properties);
            }
            current = aPickingId[i];
            if (offset && isUvOffsetInMeter) {
                let origin = tileCoord;
                if (aPatternOrigin) {
                    const patternOrigin = originFn(null, feature.feature.properties);
                    if (patternOrigin) {
                        origin = COORD2.set(patternOrigin[0], patternOrigin[1]);
                    }
                }
                const offsetX = meterToPoint(map, offset[0], origin, tileRes);
                const offsetY = meterToPoint(map, offset[0], origin, tileRes);
                currentOffsetX = aPatternOffset[i * 2] = offsetX;
                currentOffsetY = aPatternOffset[i * 2 + 1] = offsetY;
            } else {
                currentOffsetX = aPatternOffset[i * 2] = 0;
                currentOffsetY = aPatternOffset[i * 2 + 1] = 0;
            }
        }
        geo.data.aPatternOffset = aPatternOffset;
    }

    _preparePatternOrigin(symbolDef, geo, tilePoint, tileRes) {
        geo = geo && geo.geometry;
        if (!geo) {
            return;
        }
        const features = geo.properties.features;
        if (isObjectEmpty(features)) {
            return;
        }
        const map = this.getMap();
        const originFn = interpolated(symbolDef['polygonPatternFileOrigin']);
        const aPickingId = geo.data.aPickingId;
        const count = aPickingId.length;
        const aPatternOrigin = new Float32Array(count * 2);
        let current, currentOriginX, currentOriginY;
        for (let i = 0, l = aPickingId.length; i < l; i++) {
            if (aPickingId[i] === current) {
                aPatternOrigin[i * 2] = currentOriginX;
                aPatternOrigin[i * 2 + 1] = currentOriginY;
                continue;
            }
            current = aPickingId[i];
            const feature = features[current];
            const patternOrigin = originFn(null, feature.feature.properties);

            if (patternOrigin) {
                COORD0.set(patternOrigin[0], patternOrigin[1]);
                map.coordToPointAtRes(COORD0, tileRes, COORD1);
                currentOriginX = aPatternOrigin[i * 2] = COORD1.x;
                currentOriginY = aPatternOrigin[i * 2 + 1] = COORD1.y;
            } else {
                currentOriginX = aPatternOrigin[i * 2] = tilePoint[0];
                currentOriginY = aPatternOrigin[i * 2 + 1] = tilePoint[1];
            }
        }
        geo.data.aPatternOrigin = aPatternOrigin;
    }

    createFnTypeConfig(map, symbolDef) {
        const polygonFillFn = piecewiseConstant(symbolDef['polygonFill']);
        const polygonOpacityFn = interpolated(symbolDef['polygonOpacity']);
        const uvScaleFn = interpolated(symbolDef['uvScale']);
        const uvOffsetFn = interpolated(symbolDef['uvOffset']);
        const u8 = new Uint8Array(1);
        const u16 = new Uint16Array(2);
        const offsetU8 = new Uint8Array(2);
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
                evaluate: (properties, geometry) => {
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
                evaluate: (properties, geometry) => {
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
                    const scale = uvScaleFn(map.getZoom(), properties);
                    u16[0] = scale[0] * 255;
                    u16[1] = scale[1] * 255;
                    return u16;
                }
            },
            {
                attrName: 'aUVOffset',
                symbolName: 'uvOffset',
                type: Uint8Array,
                width: 2,
                define: 'HAS_UV_OFFSET',
                evaluate: properties => {
                    const offset = uvOffsetFn(map.getZoom(), properties);
                    offsetU8[0] = offset[0] * 255;
                    offsetU8[1] = offset[1] * 255;
                    return offsetU8;
                }
            }
        ];
    }

    paint(context) {
        if (this.isShadowIncludeChanged(context)) {
            this.shader.dispose();
            this._createShader(context);
        }
        super.paint(context);
    }

    isEnableTileStencil(context) {
        const isVT = this.layer.getJSONType() === 'VectorTileLayer';
        const isTileLayer = this.layer instanceof maptalks.TileLayer;
        const isRenderingTerrainSkin = !!(context && context.isRenderingTerrain && this.isTerrainSkin());
        const isEnableStencil = !isRenderingTerrainSkin;
        // 只在VectorTileLayer上打开stencil maptalks/issues#566
        // 原有stencil打开后，前面的polygon绘制后，后面的polygon不再绘制，用以解决底图上，半透明polygon重叠时的z-fighting，但比较反直觉
        // GeoJSONVectorTileLayer不用于底图绘制，所以应该关闭该特性
        return isEnableStencil && (isVT || isTileLayer && this.isOnly2D());
    }

    init(context) {
        const regl = this.regl;
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

        this.renderer = new reshader.Renderer(regl);
        const depthRange = this.sceneConfig.depthRange;
        const extraCommandProps = {
            viewport,
            stencil: {
                enable: () => {
                    return this.isEnableTileStencil(context);
                },
                func: {
                    cmp: () => {
                        return this.isOnly2D() ? '=' : '<=';
                    },
                    ref: (context, props) => {
                        return props.stencilRef;
                    }
                },
                op: {
                    fail: 'keep',
                    zfail: 'keep',
                    zpass: () => {
                        const isVT = this.layer.getJSONType() === 'VectorTileLayer';
                        const stencil = this.isOnly2D();
                        return (isVT && stencil) ? 'zero' : 'replace';
                    }

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
                    if (props.hasSSRGround) {
                        // fuzhenn/maptalks-ide#3071
                        // 解决没写depthMask，导致被ssr地面遮住的问题
                        // 但这里会导致透明的polygon无法叠加绘制的问题
                        return true;
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
            const projViewModelMatrix = [];
            this.picking = [new reshader.FBORayPicking(
                this.renderer,
                {
                    vert: pickingVert,
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
                    extraCommandProps
                },
                this.pickingFBO,
                this.getMap()
            )];
        }
    }

    _createShader(context, extraCommandProps) {
        const projViewModelMatrix = [];
        const uniforms = [
            {
                name: 'projViewModelMatrix',
                type: 'function',
                fn: function (context, props) {
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
        const isRenderingTerrainSkin = context && context.isRenderingTerrainSkin;
        const projViewMatrix = isRenderingTerrainSkin ? IDENTITY_ARR : map.projViewMatrix;
        const glScale = context && context.isRenderingTerrainSkin ? 1 : 1 / map.getGLScale();
        // const blendSrc = this.sceneConfig.blendSrc;
        const uniforms = {
            projViewMatrix,
            glScale,
            viewport: isRenderingTerrainSkin && context && context.viewport,
            hasSSRGround: context && context.hasSSRGround
            // blendSrcIsOne: +(!!(blendSrc === 'one' || blendSrc === 1))
        };
        this.setIncludeUniformValues(uniforms, context);
        return uniforms;
    }

    _computePatternWidth(out, texWidth, texHeight, tileRatio, tileCoord, tileRes) {
        let scaleX, scaleY;
        const map = this.getMap();
        if (texWidth) {
            const pointWidth = meterToPoint(map, texWidth, tileCoord, tileRes);
            scaleX = pointWidth;
        }
        if (texHeight) {
            const pointHeight = meterToPoint(map, texHeight, tileCoord, tileRes, 1);
            scaleY = pointHeight;
        }
        scaleX = scaleX || scaleY;
        scaleY = scaleY || scaleX;
        out[0] = scaleX;
        out[1] = scaleY;
        return out;
    }
}

export default FillPainter;


