import * as maptalks from 'maptalks';
import Color from 'color';
import BasicPainter from './BasicPainter';
import { reshader, getWGSLSource } from '@maptalks/gl';
import { vec2, mat4 } from '@maptalks/gl';
import vert from './glsl/line.vert';
import frag from './glsl/line.frag';
import pickingVert from './glsl/line.vert';
import { setUniformFromSymbol, createColorSetter, toUint8ColorInGlobalVar, isNil } from '../Util';
import { prepareFnTypeData, isFnTypeSymbol } from './util/fn_type_util';
import { canEnableLineFnStorage, enableLineFnStorage, isLineFnStorageMode, prepareLineFnStorageRecords, storeLineFnConstantValues, getLineFnConstantAttrValues } from './util/line_fn_storage';
import { createAtlasTexture } from './util/atlas_util';
import { isFunctionDefinition, piecewiseConstant, interpolated } from '@maptalks/function-type';
import { limitLineDefinesByDevice } from './util/limit_defines';

const IDENTITY_ARR = mat4.identity([]);
const TEMP_CANVAS_SIZE = [];

// 同一几何的多个 symbol（如线宽10的描边 + 线宽8的主线）在 vt 的瓦片渲染中会被拆成多个 mesh（symbolIndex 递增），
// 需要 mesh 级 NDC 深度偏置（见 lineDepthBias uniform），使后绘制（上层）的 mesh 确定性地略靠近相机；
// 而在 vector 渲染路径（LineStringLayer 等）中，同一条线的多个 symbol 会被合并进同一个 mesh 的同一顶点缓冲，
// 只能通过逐 feature 的顶点属性 aLineDepthBias（见 prepareFeatureDepthBias）区分。
const LINE_SYMBOL_DEPTH_BIAS = 1e-4;

// 计算单个 symbol mesh 的 NDC 深度偏置（瓦片渲染中同一线的多 symbol 被拆成多个 mesh 的场景）。
// vt 管线中传入 createMesh 的 symbolIndex 是 { index: N } 形式的对象（见 Painter.getSymbolDef），
// 直接对对象做乘法会得到 NaN，导致顶点深度为 NaN、线整体绘制不出来，这里统一安全取值。
export function getLineDepthBias(symbolIndex) {
    const index = symbolIndex && symbolIndex.index !== undefined ? symbolIndex.index : symbolIndex;
    const biasIndex = parseInt(index, 10);
    return (isFinite(biasIndex) && biasIndex > 0 ? biasIndex : 0) * LINE_SYMBOL_DEPTH_BIAS;
}

// vector 渲染路径（非瓦片图层）中，同一条线的多个 symbol 会被 convertToFeature 拆成多个共享同一 id 的 feature，
// 并合并在同一个 geometry/顶点缓冲中一次绘制，它们完全共面，倾斜视角下深度只差插值噪声，产生 z-fighting 闪烁。
// 这里按 feature 在其所属几何 symbol 数组中的顺序（即 packing 顺序）计算 NDC 深度偏置，
// 写入逐顶点属性 aLineDepthBias，使后一个 symbol（语义上绘制在上层）确定性地更靠近相机。
// 注意偏置只把"下层的 symbol"（非最上层）向远离相机方向推：同一线的最上层 symbol 仍保持在 feature 所在的平面深度（偏置 0），
// 否则上层的 symbol 会因其 NDC 深度偏置浮到其他无关 feature（例如同图层中另一条线、渐变线）之上，破坏原先由绘制顺序决定的层叠关系。
// features 中不存在多 symbol 几何时不做任何处理，不改变普通线条的顶点格式。
function prepareFeatureDepthBias(geometry) {
    const aPickingId = geometry.properties.aPickingId || geometry.data.aPickingId;
    const features = geometry.properties.features;
    if (!aPickingId || !aPickingId.length || !features) {
        return false;
    }
    const count = {};
    const ord = {};
    let hasMultiSymbol = false;
    for (const key in features) {
        const feaObj = features[key];
        const feature = feaObj && (feaObj.feature || feaObj);
        if (!feature || feature.id === undefined) {
            continue;
        }
        const id = feature.id;
        const c = count[id] || 0;
        count[id] = c + 1;
        ord[key] = c;
        if (c > 0) {
            hasMultiSymbol = true;
        }
    }
    if (!hasMultiSymbol) {
        return false;
    }
    const len = aPickingId.length;
    const arr = new Float32Array(len);
    let start = 0;
    let current = aPickingId[0];
    for (let i = 1; i <= len; i++) {
        if (i === len || aPickingId[i] !== current) {
            // 同一 feature 的所有顶点连续（aPickingId 相同），按 feature 填统一的偏置
            const total = count[current];
            if (total > 1) {
                // 只有同一线的多 symbol 之间才需要区分深度：最上层 symbol 偏置为 0，下层 symbol 依次向后推
                const bias = (ord[current] - (total - 1)) * LINE_SYMBOL_DEPTH_BIAS;
                if (bias !== 0) {
                    arr.fill(bias, start, i);
                }
            }
            current = aPickingId[i];
            start = i;
        }
    }
    geometry.data['aLineDepthBias'] = arr;
    return true;
}

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
            prepareFnTypeData(geometry, symbolDef, fnTypeConfig, this.layer);
            // vector（非瓦片）图层的同一条多symbol线会被合并进同一geometry，需要逐 feature 的深度偏置
            // 避免共面 z-fighting；瓦片图层每条线的多 symbol 会拆成独立 mesh，由 lineDepthBias uniform 处理
            geometry.properties.hasFeatureDepthBias = !(this.layer instanceof maptalks.TileLayer) && prepareFeatureDepthBias(geometry);
            // WebGPU 下把 fn-type 的动态属性打包成逐 feature 的只读 storage records，
            // 避免它们占用 maxVertexBuffers 的顶点 buffer 名额（records 在 generateBuffers 时创建 GPU buffer）。
            // 纯常量外观（无 fn 逐顶点数组）的线条同样启用，常量字段按本 mesh 的 symbol 取值打包
            this._enableLineFnStorage(geometry, symbolDef);
        }

        const symbol = this.getSymbol(symbolIndex);
        const uniforms = {
            tileResolution: geometry.properties.tileResolution,
            tileRatio: geometry.properties.tileRatio,
            tileExtent: geometry.properties.tileExtent,
            // 瓦片渲染中同一条线的多 symbol 被拆成多个 mesh 绘制时，按 symbolIndex 递增的 NDC 深度偏置（见 shader 中 lineDepthBias）。
            // 注意 symbolIndex 在这里是 { index: N } 形式的对象，直接相乘会产生 NaN，需要安全取值。
            lineDepthBias: getLineDepthBias(symbolIndex)
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
        if (geometry.properties.hasFeatureDepthBias) {
            //同一条线的多symbol被合并进同一mesh绘制，启用逐feature（逐顶点）的NDC深度偏置以解决共面z-fighting
            defines['HAS_LINE_DEPTH_BIAS'] = 1;
        }
        if (isLineFnStorageMode(geometry)) {
            // 该 geometry 的 fn-type 动态属性已打包进只读 storage buffer，
            // shader 中不再为这些属性声明逐顶点 attribute（不占用顶点 buffer 名额），改为按 feature 下标读取
            defines['HAS_LINES_STORAGE'] = 1;
        }
        // 存在逐顶点aLineOffset属性时，用属性驱动偏移，无需再开启uniform方式的USE_LINE_OFFSET
        if (!geometry.data.aLineOffset) {
            const lineOffset = symbol['lineOffset'];
            if (!isNil(lineOffset) && !isFunctionDefinition(lineOffset) && lineOffset !== 0) {
                //开启沿线法向偏移（像素），在顶点着色器中把整条带宽平移到线的一侧
                defines['USE_LINE_OFFSET'] = 1;
            }
        }
        mesh.setDefines(defines);
        return mesh;
    }

    addMesh(...args) {
        //delete Will cause reordering of object properties
        this._hasPatternAnim = null;
        let meshes = args[0];
        if (!Array.isArray(meshes)) {
            meshes = [meshes];
        }
        for (let i = 0; i < meshes.length; i++) {
            this._prepareMesh(meshes[i]);
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
            symbol.lineDasharray.reduce((accumulator, currentValue) => {
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
    }

    setMeshDefines(defines, geometry, symbolDef) {
        const isStorage = isLineFnStorageMode(geometry);
        if (isStorage) {
            // storage 模式下这 5 个外观字段的值全部打包在逐 feature 的 records 里
            // （字段没有 fn 逐顶点数组时使用该 mesh symbol 的常量值，见 storeLineFnConstantValues），
            // 因此 define 一律放行：否则 WGSL 会回退到 per-mesh 动态 uniform，而 WebGPU 顶点阶段
            // 动态 uniform 对 lineStrokeWidth 等部分字段上传不可靠（实际读到 0），导致外观丢失
            defines['HAS_COLOR'] = 1;
            defines['HAS_OPACITY'] = 1;
            defines['HAS_LINE_WIDTH'] = 1;
            defines['HAS_STROKE_WIDTH'] = 1;
            defines['HAS_STROKE_COLOR'] = 1;
        } else {
            if (geometry.data.aOpacity) {
                defines['HAS_OPACITY'] = 1;
            }
            if (geometry.data.aLineWidth) {
                defines['HAS_LINE_WIDTH'] = 1;
            }
            if (geometry.data.aLineStrokeWidth) {
                defines['HAS_STROKE_WIDTH'] = 1;
            }
        }
        if (geometry.data.aLineOffset) {
            // 存在逐顶点aLineOffset属性（pack 会同时生成 aCapOffset）时，用 storage records / 属性驱动偏移
            defines['HAS_LINE_OFFSET'] = 1;
        }
        // 需要 shader 的 dx/dy 分支的情形：fn-type 的 lineDx/lineDy、存在逐顶点 aLineDxDy 数据，
        // 或 storage 模式下非零的常量 dx/dy（取值已随 aLineDxDy 打包进 records，按 records 读取；
        // WebGL 常量 dx/dy 仍走 uniform 路径，避免 glsl 声明没有数据的 attribute）
        if (geometry.data.aLineDxDy || isFnTypeSymbol(symbolDef['lineDx']) || isStorage && this._isNonZeroConst(symbolDef['lineDx'])) {
            defines['HAS_LINE_DX'] = 1;
        }
        if (geometry.data.aLineDxDy || isFnTypeSymbol(symbolDef['lineDy']) || isStorage && this._isNonZeroConst(symbolDef['lineDy'])) {
            defines['HAS_LINE_DY'] = 1;
        }
        if (isFnTypeSymbol(symbolDef['linePatternAnimSpeed'])) {
            defines['HAS_PATTERN_ANIM'] = 1;
        }
        if (isFnTypeSymbol(symbolDef['linePatternGap'])) {
            defines['HAS_PATTERN_GAP'] = 1;
        }
    }

    // symbol 取值是否为非零常量（非 fn-type）：storage 模式下非零常量 dx/dy 应走 records 读取
    _isNonZeroConst(value) {
        return !isNil(value) && !isFunctionDefinition(value) && value !== 0;
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
        const i8 = new Int8Array(2);
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
                    const cache = maptalks.MapStateCache[map.id];
                    const zoom = cache ? cache.zoom : map.getZoom();
                    let color = aColorFn(zoom, properties);
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
                    const cache = maptalks.MapStateCache[map.id];
                    const zoom = cache ? cache.zoom : map.getZoom();
                    let speed = aLinePatternAnimSpeedFn(zoom, properties);
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
                    const cache = maptalks.MapStateCache[map.id];
                    const zoom = cache ? cache.zoom : map.getZoom();
                    let gap = aLinePatternGapFn(zoom, properties);
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
        const aLineOffsetFn = piecewiseConstant(symbolDef['lineOffset']);
        const u16 = new Uint16Array(1);
        const i8 = new Int8Array(1);
        const i16 = new Int16Array(1);
        return [
            {
                attrName: 'aLineWidth',
                symbolName: 'lineWidth',
                type: Uint8Array,
                width: 1,
                define: 'HAS_LINE_WIDTH',
                evaluate: (properties, geometry) => {
                    const cache = maptalks.MapStateCache[map.id];
                    const zoom = cache ? cache.zoom : map.getZoom();
                    let lineWidth = aLineWidthFn(zoom, properties);
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
                    const cache = maptalks.MapStateCache[map.id];
                    const zoom = cache ? cache.zoom : map.getZoom();
                    const lineStrokeWidth = aLineStrokeWidthFn(zoom, properties);
                    //乘以2是为了解决 #190
                    u16[0] = Math.round(lineStrokeWidth * 2.0);
                    return u16[0];
                }
            },
            {
                attrName: 'aLineOffset',
                symbolName: 'lineOffset',
                type: Int16Array,
                width: 1,
                define: 'HAS_LINE_OFFSET',
                evaluate: (properties, geometry) => {
                    const cache = maptalks.MapStateCache[map.id];
                    const zoom = cache ? cache.zoom : map.getZoom();
                    let lineOffset = aLineOffsetFn(zoom, properties);
                    if (isFunctionDefinition(lineOffset)) {
                        lineOffset = this.evaluateInFnTypeConfig(lineOffset, geometry, map, properties);
                    }
                    if (isNil(lineOffset)) {
                        lineOffset = 0;
                    }
                    i16[0] = Math.round(lineOffset);
                    return i16[0];
                }
            },
            {
                attrName: 'aLineDxDy',
                symbolName: 'lineDx',
                type: Int8Array,
                width: 2,
                index: 0,
                define: 'HAS_LINE_DX',
                evaluate: properties => {
                    const cache = maptalks.MapStateCache[map.id];
                    const zoom = cache ? cache.zoom : map.getZoom();
                    const lineDx = aLineDxFn(zoom, properties);
                    i8[0] = lineDx;
                    return i8[0];
                }
            },
            {
                attrName: 'aLineDxDy',
                symbolName: 'lineDy',
                type: Int8Array,
                width: 2,
                index: 1,
                define: 'HAS_LINE_DY',
                evaluate: properties => {
                    const cache = maptalks.MapStateCache[map.id];
                    const zoom = cache ? cache.zoom : map.getZoom();
                    const lineDy = aLineDyFn(zoom, properties);
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
                    const cache = maptalks.MapStateCache[map.id];
                    const zoom = cache ? cache.zoom : map.getZoom();
                    let opacity = aLineOpacityFn(zoom, properties);
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
            const isVectorTile = this.layer instanceof maptalks.TileLayer;
            const defines = { 'PICKING_MODE': 1 };
            defines['LINESOFAR_TYPE'] = isVectorTile ? 'u32' : 'f32';
            this.picking = [new reshader.FBORayPicking(
                this.renderer,
                {
                    name: 'line-picking',
                    vert: pickingVert,
                    wgslVert: getWGSLSource('vt_line_vert'),
                    defines,
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

        const isVectorTile = this.layer.isVectorTileLayer;
        defines['LINESOFAR_TYPE'] = isVectorTile ? 'u32' : 'f32';
        this.shader = new reshader.MeshShader({
            name: 'vt-line',
            vert,
            frag,
            wgslVert: getWGSLSource('vt_line_vert'),
            wgslFrag: getWGSLSource('vt_line_frag'),
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

    getExtraCommandProps() {
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
                enable: (_, props) => {
                    return this.isEnableTileStencil(props.painterContext);
                },
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

    limitMeshDefines(mesh) {
        let defines = mesh.defines;
        defines = limitLineDefinesByDevice(this.regl, defines, isLineFnStorageMode(mesh.geometry));
        mesh.setDefines(defines);
    }

    // WebGPU 下把 line 的 fn-type 动态属性（同一 feature 的所有顶点取值相同）打包进只读 storage records，
    // shader 从 storage 按 feature 读取，不再为这些属性占用 maxVertexBuffers 的顶点 buffer 名额。
    // WebGL/GLSL 渲染路径保持原样（仍使用逐顶点 attribute）。
    // 纯常量外观（没有任何 fn-type 逐顶点数组）的线条同样启用：WebGPU 下只要 geometry 带
    // aPickingId（feature 序号）即可按 feature 打包 records。缺少逐顶点数组的字段回退到
    // storeLineFnConstantValues 保存的本 mesh symbol 常量取值，渲染时外观字段一律从 records 读取，
    // 不再回退到 per-mesh 动态 uniform（WebGPU 动态 uniform 对部分顶点阶段字段上传不可靠，
    // 见 lineStrokeWidth 在 GPU 下读到 0 的问题）。
    _enableLineFnStorage(geometry, symbolDef) {
        if (!this.isWebGPU()) {
            return;
        }
        if (!canEnableLineFnStorage(geometry)) {
            return;
        }
        // 保存常量外观字段的取值（attributeName -> 与 fn 逐顶点数组同单位的取值数组），
        // syncLineFnStorageRecords 打包 records 时对缺少 fn 逐顶点数组的字段回退使用
        storeLineFnConstantValues(geometry, getLineFnConstantAttrValues(symbolDef));
        enableLineFnStorage(geometry);
        // 打包 records 并暂存到 geometry，generateBuffers 时会创建 GPU storage buffer
        prepareLineFnStorageRecords(geometry);
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
            isRenderingTerrain: +(!!isRenderingTerrainSkin),
            fogFactor: this.layer.options.fogFactor || 0
            // projMatrix: map.projMatrix,
            // halton: context.jitter || [0, 0],
            // outSize: [this.canvas.width, this.canvas.height],
        };

        this.setIncludeUniformValues(uniforms, context);
        return uniforms;
    }
}

export default LinePainter;
