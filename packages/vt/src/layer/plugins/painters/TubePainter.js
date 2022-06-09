import Color from 'color';
import { reshader, mat4, mat3 } from '@maptalks/gl';
import BasicPainter from './BasicPainter';
import { setUniformFromSymbol, createColorSetter, toUint8ColorInGlobalVar, isNil } from '../Util';
import { prepareFnTypeData, isFnTypeSymbol } from './util/fn_type_util';
import { createAtlasTexture } from './util/atlas_util';
import tubeVert from './glsl/tube.vert';
import { isFunctionDefinition, piecewiseConstant, interpolated } from '@maptalks/function-type';

const { getPBRUniforms } = reshader.pbr.PBRUtils;

const EMPTY_ARRAY = [];

class TubePainter extends BasicPainter {

    needToRedraw() {
        if (this._hasPatternAnim) {
            return true;
        }
        const symbols = this.getSymbols();
        for (let i = 0; i < symbols.length; i++) {
            if (symbols[i]['linePatternAnimSpeed']) {
                return true;
            }
        }
        return false;
    }

    isBloom(mesh) {
        const symbol = this.getSymbol(mesh.properties.symbolIndex);
        return !!symbol['lineBloom'];
    }

    createMesh(geo, transform) {
        if (!geo.geometry) {
            return null;
        }
        const map = this.getMap();
        const { geometry, symbolIndex, ref } = geo;
        console.log(geometry.data);
        console.log(geometry.elements);
        const symbolDef = this.getSymbolDef(symbolIndex);
        if (ref === undefined) {
            const fnTypeConfig = this.getFnTypeConfig(symbolIndex);
            prepareFnTypeData(geometry, symbolDef, fnTypeConfig);
        }

        const symbol = this.getSymbol(symbolIndex);
        const uniforms = {
        };

        // 为了支持和linePattern合成，把默认lineColor设为白色
        setUniformFromSymbol(uniforms, 'lineColor', symbol, 'lineColor', '#fff', createColorSetter(this.colorCache));
        setUniformFromSymbol(uniforms, 'lineWidth', symbol, 'lineWidth', 2);
        setUniformFromSymbol(uniforms, 'lineOpacity', symbol, 'lineOpacity', 1);

        const iconAtlas = geometry.properties.iconAtlas;
        const isVectorTile = geometry.data.aPosition instanceof Int16Array;
        if (iconAtlas) {
            uniforms.linePatternFile = createAtlasTexture(this.regl, iconAtlas, false);
            uniforms.atlasSize = iconAtlas ? [iconAtlas.width, iconAtlas.height] : [0, 0];
            uniforms.flipY = isVectorTile ? -1 : 1;
            this.drawDebugAtlas(iconAtlas);
        }

        if (ref === undefined) {
            geometry.generateBuffers(this.regl);
        }

        const material = new reshader.pbr.StandardMaterial(uniforms);
        const mesh = new reshader.Mesh(geometry, material, {
            castShadow: false,
            picking: true
        });
        const centiMeterToLocal = map.distanceToPointAtRes(100, 100, geometry.properties.tileResolution)._multi(8192 / 512 / 10000).toArray();
        mesh.setUniform('centiMeterToLocal', centiMeterToLocal);
        mesh.setLocalTransform(transform);

        const defines = {
            'IS_LINE_EXTRUSION': 1
        };
        if (iconAtlas) {
            defines['HAS_PATTERN'] = 1;
        }
        mesh.properties.symbolIndex = symbolIndex;
        if (geometry.data.aColor) {
            defines['HAS_COLOR'] = 1;
        }
        this.setMeshDefines(defines, geometry, symbolDef);
        if (geometry.data.aAltitude) {
            defines['HAS_ALTITUDE'] = 1;
        }
        mesh.setDefines(defines);
        return mesh;
    }

    setMeshDefines(defines, geometry, symbolDef) {
        if (geometry.data.aOpacity) {
            defines['HAS_OPACITY'] = 1;
        }
        if (geometry.data.aLineWidth) {
            defines['HAS_LINE_WIDTH'] = 1;
        }
        if (isFnTypeSymbol(symbolDef['linePatternAnimSpeed'])) {
            defines['HAS_PATTERN_ANIM'] = 1;
        }
        if (isFnTypeSymbol(symbolDef['linePatternGap'])) {
            defines['HAS_PATTERN_GAP'] = 1;
        }
    }

    paint(context) {
        if (context.states && context.states.includesChanged['shadow']) {
            this.shader.dispose();
            this.createShader(context);
        }
        super.paint(context);
    }

    init(context) {
        this.getMap().on('updatelights', this._onUpdatelights, this);
        this.createIBLTextures();
        const regl = this.regl;

        this.renderer = new reshader.Renderer(regl);

        this.createShader(context);

        if (this.pickingFBO) {
            const modelNormalMatrix = [];
            this.picking = [new reshader.FBORayPicking(
                this.renderer,
                {
                    vert: '#define PICKING_MODE 1\n' + tubeVert,
                    uniforms: [
                        {
                            name: 'projViewModelMatrix',
                            type: 'function',
                            fn: function (context, props) {
                                const projViewModelMatrix = [];
                                mat4.multiply(projViewModelMatrix, props['projViewMatrix'], props['modelMatrix']);
                                return projViewModelMatrix;
                            }
                        },
                        {
                            name: 'modelNormalMatrix',
                            type: 'function',
                            fn: (_, props) => {
                                return mat3.fromMat4(modelNormalMatrix, props['modelMatrix']);
                            }
                        }
                    ],
                    extraCommandProps: this.getExtraCommandProps()
                },
                this.pickingFBO
            )];
        }
    }

    createShader(context) {
        this._context = context;
        const uniforms = [];
        const defines = {};
        this.fillIncludes(defines, uniforms, context);
        uniforms.push(
            {
                name: 'projViewModelMatrix',
                type: 'function',
                fn: function (context, props) {
                    const projViewModelMatrix = [];
                    mat4.multiply(projViewModelMatrix, props['projViewMatrix'], props['modelMatrix']);
                    return projViewModelMatrix;
                }
            }
        );

        this.shader = new reshader.pbr.StandardShader({
            vert: tubeVert,
            uniforms,
            defines: this._getDefines(defines),
            extraCommandProps: this.getExtraCommandProps()
        });
    }

    getExtraCommandProps() {
        const canvas = this.canvas;
        const viewport = {
            x: 0,
            y: 0,
            width: () => {
                return canvas ? canvas.width : 1;
            },
            height: () => {
                return canvas ? canvas.height : 1;
            }
        };
        const depthRange = this.sceneConfig.depthRange;
        return {
            viewport,
            cull: {
                enable: () => {
                    return !!this.sceneConfig.cullFace;
                },
                face: this.sceneConfig.cullFace || 'back'
            },
            depth: {
                enable: true,
                range: depthRange || [0, 1],
                mask: this.sceneConfig.depthMask || true,
                func: this.sceneConfig.depthFunc || '<='
            },
            blend: {
                enable: true,
                func: this.getBlendFunc(),
                equation: 'add'
            },
            polygonOffset: {
                enable: false,
                offset: this.getPolygonOffset()
            }
        };
    }

    getUniformValues(map, context) {
        const { iblTexes, dfgLUT } = this.getIBLRes();
        const uniforms = getPBRUniforms(map, iblTexes, dfgLUT, null, context && context.jitter);
        const projViewMatrix = map.projViewMatrix,
            viewMatrix = map.viewMatrix;
        uniforms.projViewMatrix = projViewMatrix;
        uniforms.viewMatrix = viewMatrix;
        this.setIncludeUniformValues(uniforms, context);
        return uniforms;
    }

    createFnTypeConfig(map, symbolDef) {
        const aColorFn = piecewiseConstant(symbolDef['lineColor']);
        const aLinePatternAnimSpeedFn = piecewiseConstant(symbolDef['aLinePatternAnimSpeed']);
        const aLinePatternGapFn = piecewiseConstant(symbolDef['aLinePatternGap']);
        const shapeConfigs = this.createShapeFnTypeConfigs(map, symbolDef);
        const i8  = new Int8Array(2);
        return [
            {
                //geometry.data 中的属性数据
                attrName: 'aColor',
                //symbol中的function-type属性
                symbolName: 'lineColor',
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
            },
            {
                attrName: 'aLinePattern',
                symbolName: 'linePatternAnimSpeed',
                type: Int8Array,
                width: 2,
                related: ['linePatternGap'],
                define: 'HAS_LINE_PATTERN',
                evaluate: (properties, geometry, arr, index) => {
                    let speed = aLinePatternAnimSpeedFn(map.getZoom(), properties);
                    if (isNil(speed)) {
                        speed = 0;
                    }
                    if (speed !== 0) {
                        geometry.properties.hasPatternAnim = 1;
                    }
                    i8[0] = speed / 127;
                    i8[1] = arr[index + 1];
                    return i8[0];
                }
            },
            {
                attrName: 'aLinePattern',
                symbolName: 'linePatternGap',
                type: Int8Array,
                width: 2,
                related: ['linePatternAnimSpeed'],
                define: 'HAS_LINE_PATTERN',
                evaluate: (properties, geometry, arr, index) => {
                    let gap = aLinePatternGapFn(map.getZoom(), properties);
                    if (isNil(gap)) {
                        gap = 0;
                    }
                    // 0 - 12.7
                    i8[1] = gap * 10;
                    i8[0] = arr[index];
                    return i8[0];
                }
            }
        ].concat(shapeConfigs);
    }

    createShapeFnTypeConfigs(map, symbolDef) {
        const aLineWidthFn = interpolated(symbolDef['lineWidth']);
        const aLineOpacityFn = interpolated(symbolDef['lineOpacity']);
        const u16 = new Uint16Array(1);
        return [
            {
                attrName: 'aLineWidth',
                symbolName: 'lineWidth',
                type: Uint8Array,
                width: 1,
                define: 'HAS_LINE_WIDTH',
                evaluate: (properties, geometry) => {
                    let lineWidth = aLineWidthFn(map.getZoom(), properties);
                    if (isFunctionDefinition(lineWidth)) {
                        lineWidth = this.evaluateInFnTypeConfig(lineWidth, geometry, map, properties);
                    }
                    //乘以2是为了解决 #190
                    u16[0] = Math.round(lineWidth * 2.0);
                    return u16[0];
                }
            },
            {
                attrName: 'aOpacity',
                symbolName: 'lineOpacity',
                type: Uint8Array,
                width: 1,
                define: 'HAS_OPACITY',
                evaluate: (properties, geometry) => {
                    let opacity = aLineOpacityFn(map.getZoom(), properties);
                    if (isFunctionDefinition(opacity)) {
                        opacity = this.evaluateInFnTypeConfig(opacity, geometry, map, properties);
                    }
                    u16[0] = opacity * 255;
                    return u16[0];
                }
            },
        ];
    }

    _getDefines(defines) {
        if (this.hasIBL()) {
            defines['HAS_IBL_LIGHTING'] = 1;
        } else {
            delete defines['HAS_IBL_LIGHTING'];
        }
        return defines;
    }

    _onUpdatelights() {
        if (!this.shader) {
            return;
        }
        const defines = this.shader.shaderDefines;
        this._getDefines(defines);
        this.shader.shaderDefines = defines;

    }
}

export default TubePainter;

