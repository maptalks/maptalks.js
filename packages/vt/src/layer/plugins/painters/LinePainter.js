import * as maptalks from 'maptalks';
import Color from 'color';
import BasicPainter from './BasicPainter';
import { reshader } from '@maptalks/gl';
import { vec2, mat4 } from '@maptalks/gl';
import vert from './glsl/line.vert';
import frag from './glsl/line.frag';
import pickingVert from './glsl/line.vert';
import { setUniformFromSymbol, createColorSetter, toUint8ColorInGlobalVar, isNil } from '../Util';
import { prepareFnTypeData, isFnTypeSymbol } from './util/fn_type_util';
import { createAtlasTexture } from './util/atlas_util';
import { isFunctionDefinition, piecewiseConstant, interpolated } from '@maptalks/function-type';

const IDENTITY_ARR = mat4.identity([]);
const TEMP_CANVAS_SIZE = [];

class LinePainter extends BasicPainter {

    static getBloomSymbol() {
        return ['lineBloom'];
    }

    isUniqueStencilRefPerTile() {
        //如果用unique ref，会导致邻居瓦片内的 linecap或linejoin 没有绘制，导致线在瓦片间出现空隙
        return false;
    }

    prepareSymbol(symbol) {
        const lineColor = symbol.lineColor;
        if (Array.isArray(lineColor)) {
            if (lineColor.length === 3) {
                lineColor.push(1);
            }
            symbol.lineColor = lineColor.map(c => c * 255);
        }

        const lineStrokeColor = symbol.lineStrokeColor;
        if (Array.isArray(lineStrokeColor)) {
            if (lineStrokeColor.length === 3) {
                lineStrokeColor.push(1);
            }
            symbol.lineStrokeColor = lineStrokeColor.map(c => c * 255);
        }

        const lineDashColor = symbol.lineDashColor;
        if (Array.isArray(lineDashColor)) {
            if (lineDashColor.length === 3) {
                lineDashColor.push(1);
            }
            symbol.lineDashColor = lineDashColor.map(c => c * 255);
        }
    }

    isAnimating() {
        if (this._hasPatternAnim) {
            return true;
        }
        const symbols = this.getSymbols();
        const animation = this.sceneConfig.trailAnimation;
        const needToRedraw = animation && animation.enable;
        if (needToRedraw) {
            return true;
        }
        for (let i = 0; i < symbols.length; i++) {
            if (symbols[i]['linePatternFile'] && symbols[i]['linePatternAnimSpeed']) {
                return true;
            }
        }
        return false;
    }

    needToRedraw() {
        if (super.needToRedraw()) {
            return true;
        }
        if (this.isAnimating()) {
            return true;
        }
        return false;
    }

    isBloom(mesh) {
        const symbol = this.getSymbol(mesh.properties.symbolIndex);
        const lineSymbol = LinePainter.getBloomSymbol()[0];
        return !!symbol[lineSymbol];
    }

    needPolygonOffset() {
        return true;
    }

    createMesh(geo, transform) {
        if (!geo.geometry) {
            return null;
        }
        const { geometry, symbolIndex, ref } = geo;
        const symbolDef = this.getSymbolDef(symbolIndex);
        if (ref === undefined) {
            const fnTypeConfig = this.getFnTypeConfig(symbolIndex);
            prepareFnTypeData(geometry, symbolDef, fnTypeConfig);
        }

        const symbol = this.getSymbol(symbolIndex);
        const uniforms = {
            tileResolution: geometry.properties.tileResolution,
            tileRatio: geometry.properties.tileRatio,
            tileExtent: geometry.properties.tileExtent
        };
        this.setLineUniforms(symbol, uniforms);

        // 为了支持和linePattern合成，把默认lineColor设为白色
        setUniformFromSymbol(uniforms, 'lineColor', symbol, 'lineColor', '#fff', createColorSetter(this.colorCache));
        setUniformFromSymbol(uniforms, 'linePatterGapColor', symbol, 'linePatterGapColor', [0, 0, 0, 0], createColorSetter(this.colorCache));
        setUniformFromSymbol(uniforms, 'lineStrokeColor', symbol, 'lineStrokeColor', [0, 0, 0, 0], createColorSetter(this.colorCache));
        setUniformFromSymbol(uniforms, 'lineDasharray', symbol, 'lineDasharray', [0, 0, 0, 0], dasharray => {
            let lineDasharray;
            if (dasharray && dasharray.length) {
                const old = dasharray;
                if (dasharray.length === 1) {
                    lineDasharray = [old[0], old[0], old[0], old[0]];
                } else if (dasharray.length === 2) {
                    lineDasharray = [old[0], old[1], old[0], old[1]];
                } else if (dasharray.length === 3) {
                    lineDasharray = [old[0], old[1], old[2], old[2]];
                } else if (dasharray.length === 4) {
                    lineDasharray = dasharray;
                } else if (dasharray.length > 4) {
                    lineDasharray = dasharray.slice(0, 4);
                }
            }
            return lineDasharray || [0, 0, 0, 0];
        }, [0, 0, 0, 0]);
        setUniformFromSymbol(uniforms, 'lineDashColor', symbol, 'lineDashColor', [0, 0, 0, 0], createColorSetter(this.colorCache));

        const iconAtlas = geometry.properties.iconAtlas;
        const isVectorTile = this.layer instanceof maptalks.TileLayer;
        if (iconAtlas) {
            uniforms.linePatternFile = createAtlasTexture(this.regl, iconAtlas, false, false);
            uniforms.atlasSize = iconAtlas ? [iconAtlas.width, iconAtlas.height] : [0, 0];
            uniforms.flipY = isVectorTile ? -1 : 1;
            this.drawDebugAtlas(iconAtlas);
        }
        //TODO lineDx, lineDy
        // const indices = geometries[i].elements;
        // const projViewMatrix = mat4.multiply([], mapUniforms.projMatrix, mapUniforms.viewMatrix);
        // const projViewModelMatrix = mat4.multiply(new Float32Array(16), projViewMatrix, transform);
        // console.log('projViewModelMatrix', projViewModelMatrix);
        // const pos = geometries[i].data.aPosition;
        // for (let ii = 0; ii < indices.length; ii++) {
        //     const idx = indices[ii] * 3;
        //     // if (ii === 2) {
        //     //     pos[idx + 2] = 8192;
        //     // }
        //     const vector = [pos[idx], pos[idx + 1], pos[idx + 2], 1];
        //     const glPos = vec4.transformMat4([], vector, projViewModelMatrix);
        //     const tilePos = vec4.transformMat4([], vector, transform);
        //     const ndc = [glPos[0] / glPos[3], glPos[1] / glPos[3], glPos[2] / glPos[3]];
        //     console.log(vector, tilePos, glPos, ndc);
        // }

        if (ref === undefined) {
            geometry.generateBuffers(this.regl);
        }

        const material = new reshader.Material(uniforms);
        const mesh = new reshader.Mesh(geometry, material, {
            castShadow: false,
            picking: true
        });
        mesh.setLocalTransform(transform);
        mesh.positionMatrix = this.getAltitudeOffsetMatrix();

        const defines = {};
        if (iconAtlas) {
            defines['HAS_PATTERN'] = 1;
        }
        mesh.properties.symbolIndex = symbolIndex;
        this._prepareDashDefines(mesh, defines);
        if (geometry.data.aColor) {
            defines['HAS_COLOR'] = 1;
        }
        if (geometry.data.aStrokeColor) {
            defines['HAS_STROKE_COLOR'] = 1;
        }
        this.setMeshDefines(defines, geometry, symbolDef);
        if (geometry.data.aAltitude) {
            defines['HAS_ALTITUDE'] = 1;
        }
        mesh.setDefines(defines);
        return mesh;
    }

    addMesh(...args) {
        delete this._hasPatternAnim;
        const mesh = args[0];
        if (Array.isArray(mesh)) {
            mesh.forEach(m => {
                this._prepareMesh(m);
            });
        } else {
            this._prepareMesh(mesh);
        }
        super.addMesh(...args);
    }

    _prepareMesh(mesh) {
        if (!mesh.geometry.aLineWidth && mesh.material.get('lineWidth') <= 0 || !mesh.geometry.aOpacity && mesh.material.get('lineOpacity') <= 0) {
            return;
        }
        const defines = mesh.defines;
        this._prepareDashDefines(mesh, defines);
        mesh.setDefines(defines);
        if (mesh.geometry.properties.hasPatternAnim) {
            this._hasPatternAnim = 1;
        }
    }

    _prepareDashDefines(mesh, defines) {
        const geometry = mesh.geometry;
        const symbol = this.getSymbol(mesh.properties.symbolIndex);
        if (geometry.data['aDasharray'] || Array.isArray(symbol.lineDasharray) &&
            symbol.lineDasharray.reduce((accumulator, currentValue)=> {
                return accumulator + currentValue;
            }, 0) > 0) {
            defines['HAS_DASHARRAY'] = 1;
            if (geometry.data['aDasharray']) {
                defines['HAS_DASHARRAY_ATTR'] = 1;
            }
            if (geometry.data['aDashColor']) {
                defines['HAS_DASHARRAY_COLOR'] = 1;
            }
        } else if (defines['HAS_DASHARRAY']) {
            delete defines['HAS_DASHARRAY'];
        }
    }

    setLineUniforms(symbol, uniforms) {
        setUniformFromSymbol(uniforms, 'lineWidth', symbol, 'lineWidth', 2);
        setUniformFromSymbol(uniforms, 'lineOpacity', symbol, 'lineOpacity', 1);
        setUniformFromSymbol(uniforms, 'lineStrokeWidth', symbol, 'lineStrokeWidth', 0);
        setUniformFromSymbol(uniforms, 'lineBlur', symbol, 'lineBlur', 0.7);
        setUniformFromSymbol(uniforms, 'lineOffset', symbol, 'lineOffset', 0);
        setUniformFromSymbol(uniforms, 'lineDx', symbol, 'lineDx', 0);
        setUniformFromSymbol(uniforms, 'lineDy', symbol, 'lineDy', 0);
        setUniformFromSymbol(uniforms, 'linePatternAnimSpeed', symbol, 'linePatternAnimSpeed', 0);
        setUniformFromSymbol(uniforms, 'linePatternGap', symbol, 'linePatternGap', 0);
        // setUniformFromSymbol(uniforms, 'lineOffset', symbol, 'lineOffset', 0);
    }

    setMeshDefines(defines, geometry, symbolDef) {
        if (geometry.data.aOpacity) {
            defines['HAS_OPACITY'] = 1;
        }
        if (geometry.data.aLineWidth) {
            defines['HAS_LINE_WIDTH'] = 1;
        }
        if (geometry.data.aLineStrokeWidth) {
            defines['HAS_STROKE_WIDTH'] = 1;
        }
        if (isFnTypeSymbol(symbolDef['lineDx'])) {
            defines['HAS_LINE_DX'] = 1;
        }
        if (isFnTypeSymbol(symbolDef['lineDy'])) {
            defines['HAS_LINE_DY'] = 1;
        }
        // if (symbol['lineOffset']) {
        //     defines['USE_LINE_OFFSET'] = 1;
        // }
        if (isFnTypeSymbol(symbolDef['linePatternAnimSpeed'])) {
            defines['HAS_PATTERN_ANIM'] = 1;
        }
        if (isFnTypeSymbol(symbolDef['linePatternGap'])) {
            defines['HAS_PATTERN_GAP'] = 1;
        }
    }

    paint(context) {
        if (this.isShadowIncludeChanged(context)) {
            this.shader.dispose();
            this.createShader(context);
        }
        super.paint(context);
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
                    return i8;
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
                    return i8;
                }
            }
        ].concat(shapeConfigs);
    }

    createShapeFnTypeConfigs(map, symbolDef) {
        const aLineWidthFn = interpolated(symbolDef['lineWidth']);
        const aLineOpacityFn = interpolated(symbolDef['lineOpacity']);
        const aLineStrokeWidthFn = interpolated(symbolDef['lineStrokeWidth']);
        const aLineDxFn = interpolated(symbolDef['lineDx']);
        const aLineDyFn = interpolated(symbolDef['lineDy']);
        const u16 = new Uint16Array(1);
        const i8  = new Int8Array(1);
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
                attrName: 'aLineStrokeWidth',
                symbolName: 'lineStrokeWidth',
                type: Uint8Array,
                width: 1,
                define: 'HAS_STROKE_WIDTH',
                evaluate: properties => {
                    const lineStrokeWidth = aLineStrokeWidthFn(map.getZoom(), properties);
                    //乘以2是为了解决 #190
                    u16[0] = Math.round(lineStrokeWidth * 2.0);
                    return u16[0];
                }
            },
            {
                attrName: 'aLineDxDy',
                symbolName: 'lineDx',
                type: Int8Array,
                width: 2,
                define: 'HAS_LINE_DX',
                evaluate: properties => {
                    const lineDx = aLineDxFn(map.getZoom(), properties);
                    i8[0] = lineDx;
                    return i8[0];
                }
            },
            {
                attrName: 'aLineDxDy',
                symbolName: 'lineDy',
                type: Int8Array,
                width: 2,
                define: 'HAS_LINE_DY',
                evaluate: properties => {
                    const lineDy = aLineDyFn(map.getZoom(), properties);
                    i8[0] = lineDy;
                    return i8[0];
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

    updateSceneConfig(config) {
        if (config.trailAnimation) {
            this.createShader(this._context);
        }
    }

    init(context) {
        const regl = this.regl;

        this.renderer = new reshader.Renderer(regl);

        this.createShader(context);

        if (this.pickingFBO) {
            this.picking = [new reshader.FBORayPicking(
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
                    extraCommandProps: this.getExtraCommandProps()
                },
                this.pickingFBO,
                this.getMap()
            )];
        }
    }

    createShader(context) {
        this._context = context;
        const uniforms = [];
        const defines = {
        };
        this.fillIncludes(defines, uniforms, context);
        if (this.sceneConfig.trailAnimation && this.sceneConfig.trailAnimation.enable) {
            defines['HAS_TRAIL'] = 1;
        }
        const projViewModelMatrix = [];
        uniforms.push(
            {
                name: 'projViewModelMatrix',
                type: 'function',
                fn: function (context, props) {
                    mat4.multiply(projViewModelMatrix, props['projViewMatrix'], props['modelMatrix']);
                    return projViewModelMatrix;
                }
            }
        );



        this.shader = new reshader.MeshShader({
            vert, frag,
            uniforms,
            defines,
            extraCommandProps: this.getExtraCommandProps(context)
        });
    }

    // LinePainter 需要在2d下打开stencil，否则会因为子级瓦片无法遮住父级瓦片的绘制，出现一些奇怪的现象
    // https://github.com/maptalks/issues/issues/677
    isEnableTileStencil(context) {
        const isRenderingTerrainSkin = !!(context && context.isRenderingTerrain && this.isTerrainSkin());
        const isEnableStencil = !isRenderingTerrainSkin;
        return isEnableStencil;
    }

    getExtraCommandProps(context) {
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
        const depthRange = this.sceneConfig.depthRange;
        return {
            viewport,
            stencil: {
                enable: () => {
                    return this.isEnableTileStencil(context);
                },
                mask: 0xff,
                func: {
                    cmp: () => {
                        return '<=';
                    },
                    ref: (context, props) => {
                        return props.stencilRef;
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
                mask: this.sceneConfig.depthMask || false,
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
    }


    getUniformValues(map, context) {
        const isRenderingTerrainSkin = context && context.isRenderingTerrainSkin;
        const tileSize = this.layer.getTileSize().width;

        const projViewMatrix = isRenderingTerrainSkin ? IDENTITY_ARR : map.projViewMatrix;
        const viewMatrix = map.viewMatrix,
            cameraToCenterDistance = map.cameraToCenterDistance,
            resolution = map.getResolution();
        const canvasSize = vec2.set(TEMP_CANVAS_SIZE, map.width, map.height);
        if (isRenderingTerrainSkin) {
            vec2.set(canvasSize, tileSize, tileSize);
        }
        const blendSrc = this.getBlendFunc().src();
        // const glScale = map.getGLScale();
        // const c = vec3.transformMat4([], map.cameraLookAt, projViewMatrix);
        // const unit = [resolution * 100 * glScale, 0, 0];
        // const v = vec3.transformMat4([], vec3.add([], map.cameraLookAt, unit), projViewMatrix);
        // console.log(vec2.normalize([], [v[0] - c[0], v[1] - c[1]]));
        const animation = this.sceneConfig.trailAnimation || {};
        const uniforms = {
            layerScale: this.layer.options['styleScale'] || 1,
            projViewMatrix, viewMatrix, cameraToCenterDistance, resolution, canvasSize,
            trailSpeed: animation.speed || 1,
            trailLength: animation.trailLength || 500,
            trailCircle: animation.trailCircle || 1000,
            currentTime: this.layer.getRenderer().getFrameTimestamp() || 0,
            blendSrcIsOne: +(!!(blendSrc === 1 || blendSrc === 'one')),
            cameraPosition: map.cameraPosition,
            viewport: isRenderingTerrainSkin && context && context.viewport,
            isRenderingTerrain: +(!!isRenderingTerrainSkin)
            // projMatrix: map.projMatrix,
            // halton: context.jitter || [0, 0],
            // outSize: [this.canvas.width, this.canvas.height],
        };

        this.setIncludeUniformValues(uniforms, context);
        return uniforms;
    }
}

export default LinePainter;
