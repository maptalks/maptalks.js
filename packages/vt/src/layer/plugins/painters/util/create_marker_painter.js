import { reshader } from '@maptalks/gl';
import { interpolated, piecewiseConstant, isFunctionDefinition } from '@maptalks/function-type';
import { extend, setUniformFromSymbol, wrap, fillArray } from '../../Util';
import { DEFAULT_MARKER_WIDTH, DEFAULT_MARKER_HEIGHT, GLYPH_SIZE, DEFAULT_ICON_ALPHA_TEST } from '../Constant';
import { createAtlasTexture, getDefaultMarkerSize } from './atlas_util';
import { prepareFnTypeData, PREFIX, isFnTypeSymbol } from './fn_type_util';
import { prepareTextGeometry, initTextUniforms, initTextMeshDefines } from './create_text_painter';
// import { getIconBox } from './get_icon_box';

export const BOX_ELEMENT_COUNT = 6;
export const BOX_VERTEX_COUNT = 4; //每个box有四个顶点数据
const U8 = new Uint16Array(1);
const I8 = new Int8Array(1);

export function createMarkerMesh(
    regl,
    geometry,
    transform,
    symbolDef,
    symbol,
    fnTypeConfig,
    enableCollision,
    visibleInCollision,
    enableUniquePlacement
) {
    if (geometry.isDisposed() || geometry.data.aPosition.length === 0) {
        return null;
    }
    const hasIcon = !!geometry.properties.iconAtlas;
    const glyphAtlas = geometry.properties.glyphAtlas;
    const hasText = !!glyphAtlas;
    if (!hasIcon && !hasText && !geometry.properties.isEmpty) {
        return null;
    }


    //!geometry.properties.aShape 以避免重复创建collision数据
    if (!geometry.properties.aShape) {
        const { aPosition, aShape } = geometry.data;
        const vertexCount = geometry.data.aPosition.length / geometry.desc.positionSize;
        //initialize opacity array
        //aOpacity用于fading透明度的调整
        const aOpacity = new Uint8Array(vertexCount);
        if (visibleInCollision) {
            aOpacity.fill(255, 0);
        }
        geometry.data.aOpacity = {
            usage: 'dynamic',
            data: aOpacity
        };
        geometry.properties.aOpacity = new Uint8Array(vertexCount);
        if (visibleInCollision) {
            geometry.properties.aOpacity.fill(255, 0);
        }

        geometry.properties.aAnchor = aPosition;
        const length = aShape.length / 4;
        const aShapeData = new aShape.constructor(length * 2);
        for (let i = 0; i < length; i++) {
            aShapeData[i * 2] = aShape[i * 4];
            aShapeData[i * 2 + 1] = aShape[i * 4 + 1];
        }
        geometry.properties.aShape = aShapeData;
    }
    if (!geometry.properties.visElemts) {
        //保存elements，隐藏icon时，从elements中删除icon的索引数据
        geometry.properties.elements = geometry.elements;
        geometry.properties.visElemts = new geometry.elements.constructor(geometry.elements.length);
    }
    if (hasText) {
        prepareTextGeometry.call(this, geometry, symbolDef, fnTypeConfig.text, enableCollision, visibleInCollision, enableUniquePlacement);
    }

    geometry.properties.memorySize = geometry.getMemorySize();
    // console.log('data', geometry.data);
    geometry.generateBuffers(regl, { excludeElementsInVAO: true });

    // const symbol = this.getSymbol();
    // geometry.properties.symbol = symbol;
    const uniforms = {
        flipY: 0,
        tileResolution: geometry.properties.tileResolution,
        tileRatio: geometry.properties.tileRatio
    };
    setMeshUniforms.call(this, uniforms, regl, geometry, symbol);
    initTextUniforms.call(this, uniforms, regl, geometry, symbol);
    uniforms.isHalo = 0;

    const meshes = [];
    const meshConfig = {
        // 必须关闭VAO，否则对vao中elements的更新会导致halo绘制出错
        disableVAO: true,
        transparent: true,
        castShadow: false,
        picking: true
    };
    let haloMesh;
    if (hasText) {
        const uniforms1 = extend({}, uniforms);
        uniforms1.isHalo = 1;
        const material = new reshader.Material(uniforms1);
        haloMesh = new reshader.Mesh(geometry, material, meshConfig);
        haloMesh.properties.isHalo = 1;
        haloMesh.setUniform('alphaTest', DEFAULT_ICON_ALPHA_TEST);
        haloMesh.setLocalTransform(transform);
        // meshes.push(haloMesh);
    }

    const material = new reshader.Material(uniforms);
    const mesh = new reshader.Mesh(geometry, material, meshConfig);
    const defines = {
        'HAS_HALO_ATTR': 1
    };
    if (enableCollision) {
        defines['ENABLE_COLLISION'] = 1;
    }

    initMeshDefines.call(this, geometry, defines);
    if (haloMesh) {
        const haloDefines = extend({}, defines);
        initTextMeshDefines.call(this, defines, haloMesh);
        haloMesh.setDefines(haloDefines);
    }
    if (hasText) {
        initTextMeshDefines.call(this, defines, mesh);
    }
    mesh.setDefines(defines);
    mesh.setUniform('alphaTest', DEFAULT_ICON_ALPHA_TEST);
    mesh.setLocalTransform(transform);
    mesh.properties.symbolIndex = geometry.properties.symbolIndex;
    if (haloMesh) {
        // mesh.properties.haloMesh = haloMesh;
    }
    meshes.push(mesh);
    return meshes;
}

export function prepareDxDy(geometry) {
    const { aMarkerDx, aMarkerDy, aTextDx, aTextDy } = geometry.data;
    const dxdy = (aTextDx || aTextDy || aMarkerDx || aMarkerDy);
    if (dxdy) {
        const aDxDy = new dxdy.constructor(dxdy.length * 4);
        for (let i = 0; i < aDxDy.length; i += 4) {
            const idx = i / 4;
            if (aMarkerDx) {
                aDxDy[i] = aMarkerDx[idx];
            }
            if (aMarkerDy) {
                aDxDy[i + 1] = aMarkerDy[idx];
            }
            if (aTextDx) {
                aDxDy[i + 2] = aTextDx[idx];
            }
            if (aTextDy) {
                aDxDy[i + 3] = aTextDy[idx];
            }
        }
        geometry.data.aDxDy = aDxDy;
        geometry.properties.aDxDy = aDxDy.slice();
        if (aMarkerDx) {
            geometry.properties.aMarkerDx = aMarkerDx;
        }
        if (aMarkerDy) {
            geometry.properties.aMarkerDy = aMarkerDy;
        }
        if (aTextDx) {
            geometry.properties.aTextDx = aTextDx;
        }
        if (aTextDy) {
            geometry.properties.aTextDy = aTextDy;
        }
    }
}

function setMeshUniforms(uniforms, regl, geometry, symbol) {
    const [ defaultMarkerWidth, defaultMarkerHeight ] = getDefaultMarkerSize(geometry);
    setUniformFromSymbol(uniforms, 'markerOpacity', symbol, 'markerOpacity', 1);
    setUniformFromSymbol(uniforms, 'markerPerspectiveRatio', symbol, 'markerPerspectiveRatio', symbol.markerTextFit ? 0 : 1);
    setUniformFromSymbol(uniforms, 'markerWidth', symbol, 'markerWidth', defaultMarkerWidth || DEFAULT_MARKER_WIDTH);
    setUniformFromSymbol(uniforms, 'markerHeight', symbol, 'markerHeight', defaultMarkerHeight || DEFAULT_MARKER_HEIGHT);
    setUniformFromSymbol(uniforms, 'markerDx', symbol, 'markerDx', 0);
    setUniformFromSymbol(uniforms, 'markerDy', symbol, 'markerDy', 0);
    setUniformFromSymbol(uniforms, 'markerRotation', symbol, 'markerRotation', 0, v => v * Math.PI / 180);
    setUniformFromSymbol(uniforms, 'markerPitchWithMap', symbol, 'markerPitchAlignment', 0, v => v === 'map' ? 1 : 0);
    setUniformFromSymbol(uniforms, 'markerRotateWithMap', symbol, 'markerRotationAlignment', 0, v => v === 'map' ? 1 : 0);

    const iconAtlas = geometry.properties.iconAtlas;
    uniforms['iconTex'] = iconAtlas ? createAtlasTexture(regl, iconAtlas, false) : this._emptyTexture;
    uniforms['iconTexSize'] = iconAtlas ? [iconAtlas.width, iconAtlas.height] : [0, 0];
}

function initMeshDefines(geometry, defines) {
    if (geometry.data.aMarkerWidth) {
        defines['HAS_MARKER_WIDTH'] = 1;
    }
    if (geometry.data.aMarkerHeight) {
        defines['HAS_MARKER_HEIGHT'] = 1;
    }
    if (geometry.data.aColorOpacity) {
        defines['HAS_OPACITY'] = 1;
    }
    const symbolDef = this.getSymbolDef(geometry.properties.symbolIndex);
    if (isFnTypeSymbol(symbolDef.markerDx)) {
        defines['HAS_MARKER_DX'] = 1;
    }
    if (isFnTypeSymbol(symbolDef.markerDy)) {
        defines['HAS_MARKER_DY'] = 1;
    }
    if (isFnTypeSymbol(symbolDef.textDx)) {
        defines['HAS_TEXT_DX'] = 1;
    }
    if (isFnTypeSymbol(symbolDef.textDy)) {
        defines['HAS_TEXT_DY'] = 1;
    }
    if (isFnTypeSymbol(symbolDef.markerPitchAlignment)) {
        defines['HAS_MARKER_PITCH_ALIGN'] = 1;
    }
    if (isFnTypeSymbol(symbolDef.textPitchAlignment)) {
        defines['HAS_TEXT_PITCH_ALIGN'] = 1;
    }
    if (isFnTypeSymbol(symbolDef.markerRotationAlignment)) {
        defines['HAS_MARKER_ROTATION_ALIGN'] = 1;
    }
    if (isFnTypeSymbol(symbolDef.textRotationAlignment)) {
        defines['HAS_TEXT_ROTATION_ALIGN'] = 1;
    }
    if (isFnTypeSymbol(symbolDef.markerRotation)) {
        defines['HAS_MARKER_ROTATION'] = 1;
    }
    if (isFnTypeSymbol(symbolDef.textRotation)) {
        defines['HAS_TEXT_ROTATION'] = 1;
    }
    if (geometry.data.aPadOffset) {
        defines['HAS_PAD_OFFSET'] = 1;
    }
    if (geometry.data.aAltitude) {
        defines['HAS_ALTITUDE'] = 1;
    }
}

export function prepareMarkerGeometry(iconGeometry, symbolDef, iconFnTypeConfig, layer) {
    prepareFnTypeData(iconGeometry, symbolDef, iconFnTypeConfig, layer);
    prepareIconGeometry(iconGeometry);
}

function prepareIconGeometry(iconGeometry) {
    const { aMarkerWidth, aMarkerHeight, aMarkerDx, aMarkerDy, aPitchAlign, aRotationAlign, aRotation, aOverlap } = iconGeometry.data;

    if (aMarkerWidth) {
        //for collision
        const keyName = (PREFIX + 'aMarkerWidth').trim();
        iconGeometry.properties.aMarkerWidth = iconGeometry.properties[keyName] || new aMarkerWidth.constructor(aMarkerWidth);
    }
    if (aMarkerHeight) {
        //for collision
        const keyName = (PREFIX + 'aMarkerHeight').trim();
        iconGeometry.properties.aMarkerHeight = iconGeometry.properties[keyName] || new aMarkerHeight.constructor(aMarkerHeight);
    }
    if (aMarkerDx) {
        //for collision
        const keyName = (PREFIX + 'aMarkerDx').trim();
        iconGeometry.properties.aMarkerDx = iconGeometry.properties[keyName] || new aMarkerDx.constructor(aMarkerDx);
    }
    if (aMarkerDy) {
        //for collision
        const keyName = (PREFIX + 'aMarkerDy').trim();
        iconGeometry.properties.aMarkerDy = iconGeometry.properties[keyName] || new aMarkerDy.constructor(aMarkerDy);
    }
    if (aPitchAlign) {
        //for collision
        const keyName = (PREFIX + 'aPitchAlign').trim();
        iconGeometry.properties.aPitchAlign = iconGeometry.properties[keyName] || new aPitchAlign.constructor(aPitchAlign);
    }
    if (aRotationAlign) {
        //for collision
        const keyName = (PREFIX + 'aRotationAlign').trim();
        iconGeometry.properties.aRotationAlign = iconGeometry.properties[keyName] || new aRotationAlign.constructor(aRotationAlign);
    }
    if (aRotation) {
        //for collision
        const keyName = (PREFIX + 'aRotation').trim();
        iconGeometry.properties.aRotation = iconGeometry.properties[keyName] || new aRotation.constructor(aRotation);
    }
    if (aOverlap) {
        //for placement
        const keyName = (PREFIX + 'aOverlap').trim();
        iconGeometry.properties.aOverlap = iconGeometry.properties[keyName] || new aOverlap.constructor(aOverlap);
    }
}

export function getMarkerFnTypeConfig(map, symbolDef) {
    const markerWidthFn = interpolated(symbolDef['markerWidth']);
    const markerHeightFn = interpolated(symbolDef['markerHeight']);
    const markerDxFn = interpolated(symbolDef['markerDx']);
    const markerDyFn = interpolated(symbolDef['markerDy']);
    const markerOpacityFn = interpolated(symbolDef['markerOpacity']);
    const markerTextFitFn = interpolated(symbolDef['markerTextFit']);
    const markerPitchAlignmentFn = piecewiseConstant(symbolDef['markerPitchAlignment']);
    const textPitchAlignmentFn = piecewiseConstant(symbolDef['textPitchAlignment']);
    const markerRotationAlignmentFn = piecewiseConstant(symbolDef['markerRotationAlignment']);
    const textRotationAlignmentFn =  piecewiseConstant(symbolDef['textRotationAlignment']);
    const markerRotationFn = interpolated(symbolDef['markerRotation']);
    const textRotationFn = interpolated(symbolDef['textRotation']);
    const markerAllowOverlapFn = piecewiseConstant(symbolDef['markerAllowOverlapFn']);
    const markerIgnorePlacementFn = piecewiseConstant(symbolDef['markerIgnorePlacement']);
    const textOpacityFn = interpolated(symbolDef['textOpacity']);
    const textDxFn = interpolated(symbolDef['textDx']);
    const textDyFn = interpolated(symbolDef['textDy']);
    const u8 = new Int16Array(1);
    const u16 = new Uint16Array(1);
    return [
        {
            attrName: 'aMarkerWidth',
            symbolName: 'markerWidth',
            type: Uint16Array,
            width: 1,
            define: 'HAS_MARKER_WIDTH',
            evaluate: (properties, geometry, arr, index) => {
                const value = arr[index];
                const markerTextFit = symbolDef['markerTextFit'];
                //如果是markerTextFit，aMarkerWidth已经更新过了，直接返回原值
                const textFit = markerTextFitFn ? markerTextFitFn(map.getZoom(), properties) : markerTextFit;
                if (textFit === 'both' || textFit === 'width') {
                    return value;
                }
                let x = markerWidthFn(map.getZoom(), properties);
                if (isFunctionDefinition(x)) {
                    x = this.evaluateInFnTypeConfig(x, geometry, map, properties);
                }
                u8[0] = x;
                return u8[0];
            }
        },
        {
            attrName: 'aMarkerHeight',
            symbolName: 'markerHeight',
            type: Uint16Array,
            width: 1,
            define: 'HAS_MARKER_HEIGHT',
            evaluate: (properties, geometry, arr, index) => {
                const value = arr[index];
                const markerTextFit = symbolDef['markerTextFit'];
                const textFit = markerTextFitFn ? markerTextFitFn(map.getZoom(), properties) : markerTextFit;
                if (textFit === 'both' || textFit === 'height') {
                    return value;
                }
                let x = markerHeightFn(map.getZoom(), properties);
                if (isFunctionDefinition(x)) {
                    x = this.evaluateInFnTypeConfig(x, geometry, map, properties);
                }
                u8[0] = x;
                return u8[0];
            }
        },
        // markerDx, markerDy, textDx, textDy 集中在 aDxDy中是因为attributes数量会超过限制
        {
            attrName: 'aDxDy',
            symbolName: 'markerDx',
            type: Int8Array,
            width: 4,
            index: 0,
            define: 'HAS_MARKER_DX',
            evaluate: (properties, geometry, arr, index) => {
                let x = markerDxFn(map.getZoom(), properties);
                if (isFunctionDefinition(x)) {
                    x = this.evaluateInFnTypeConfig(x, geometry, map, properties);
                }
                const { aMarkerDx } = geometry.properties;
                if (aMarkerDx) {
                    aMarkerDx[index / 4] = x;
                }
                // const x = markerDxFn(map.getZoom(), properties);
                u8[0] = x;
                return u8[0];
            }
        },
        {
            attrName: 'aDxDy',
            symbolName: 'markerDy',
            type: Int8Array,
            width: 4,
            index: 1,
            define: 'HAS_MARKER_DY',
            evaluate: (properties, geometry, arr, index) => {
                let x = markerDyFn(map.getZoom(), properties);
                if (isFunctionDefinition(x)) {
                    x = this.evaluateInFnTypeConfig(x, geometry, map, properties);
                }
                const { aMarkerDy } = geometry.properties;
                if (aMarkerDy) {
                    aMarkerDy[Math.floor(index / 4)] = x;
                }
                u8[0] = x;
                return u8[0];
            }
        },
        {
            attrName: 'aDxDy',
            symbolName: 'textDx',
            type: Int8Array,
            width: 4,
            index: 2,
            define: 'HAS_TEXT_DX',
            evaluate: (properties, geometry, arr, index) => {
                let x = textDxFn(map.getZoom(), properties);
                if (isFunctionDefinition(x)) {
                    x = this.evaluateInFnTypeConfig(x, geometry, map, properties);
                }
                const { aTextDx } = geometry.properties;
                if (aTextDx) {
                    aTextDx[Math.floor(index / 4)] = x;
                }
                // const x = markerDxFn(map.getZoom(), properties);
                u8[0] = x;
                return u8[0];
            }
        },
        {
            attrName: 'aDxDy',
            symbolName: 'textDy',
            type: Int8Array,
            width: 4,
            index: 3,
            define: 'HAS_TEXT_DY',
            evaluate: (properties, geometry, arr, index) => {
                let x = textDyFn(map.getZoom(), properties);
                if (isFunctionDefinition(x)) {
                    x = this.evaluateInFnTypeConfig(x, geometry, map, properties);
                }
                const { aTextDy } = geometry.properties;
                if (aTextDy) {
                    aTextDy[Math.floor(index / 4)] = x;
                }
                // const x = markerDxFn(map.getZoom(), properties);
                u8[0] = x;
                return u8[0];
            }
        },
        {
            attrName: 'aColorOpacity',
            symbolName: 'markerOpacity',
            type: Uint8Array,
            width: 2,
            index: 0,
            define: 'HAS_OPACITY',
            evaluate: (properties, geometry) => {
                let opacity = 1;
                if (markerOpacityFn) {
                    opacity = markerOpacityFn(map.getZoom(), properties);
                    if (isFunctionDefinition(opacity)) {
                        opacity = this.evaluateInFnTypeConfig(opacity, geometry, map, properties);
                    }
                }
                u8[0] = opacity * 255;
                return u8[0];
            }
        },
        {
            attrName: 'aColorOpacity',
            symbolName: 'textOpacity',
            type: Uint8Array,
            width: 2,
            index: 1,
            define: 'HAS_OPACITY',
            evaluate: (properties, geometry) => {
                let opacity = 1;
                if (textOpacityFn) {
                    opacity = textOpacityFn(map.getZoom(), properties);
                    if (isFunctionDefinition(opacity)) {
                        opacity = this.evaluateInFnTypeConfig(opacity, geometry, map, properties);
                    }
                }
                u8[0] = opacity * 255;
                return u8[0];
            }
        },
        {
            attrName: 'aPitchAlign',
            symbolName: 'markerPitchAlignment',
            type: Uint8Array,
            width: 2,
            index: 0,
            define: 'HAS_PITCH_ALIGN',
            evaluate: properties => {
                const y = +(markerPitchAlignmentFn(map.getZoom(), properties) === 'map');
                return y;
            }
        },
        {
            attrName: 'aPitchAlign',
            symbolName: 'textPitchAlignment',
            type: Uint8Array,
            width: 2,
            index: 1,
            define: 'HAS_PITCH_ALIGN',
            evaluate: properties => {
                const y = +(textPitchAlignmentFn(map.getZoom(), properties) === 'map');
                return y;
            }
        },
        {
            attrName: 'aRotationAlign',
            symbolName: 'markerRotationAlignment',
            type: Uint8Array,
            width: 2,
            index: 0,
            define: 'HAS_MARKER_ROTATION_ALIGN',
            evaluate: properties => {
                const y = +(markerRotationAlignmentFn(map.getZoom(), properties) === 'map');
                return y;
            }
        },
        {
            attrName: 'aRotationAlign',
            symbolName: 'textRotationAlignment',
            type: Uint8Array,
            width: 2,
            index: 1,
            define: 'HAS_TEXT_ROTATION_ALIGN',
            evaluate: properties => {
                const y = +(textRotationAlignmentFn(map.getZoom(), properties) === 'map');
                return y;
            }
        },
        {
            attrName: 'aRotation',
            symbolName: 'markerRotation',
            type: Uint16Array,
            width: 2,
            index: 0,
            define: 'HAS_MARKER_ROTATION',
            evaluate: properties => {
                const y = wrap(markerRotationFn(map.getZoom(), properties), 0, 360) * Math.PI / 180;
                u16[0] = y * 9362;
                return u16[0];
            }
        },
        {
            attrName: 'aRotation',
            symbolName: 'textRotation',
            type: Uint16Array,
            width: 2,
            index: 1,
            define: 'HAS_TEXT_ROTATION',
            evaluate: properties => {
                const y = wrap(textRotationFn(map.getZoom(), properties), 0, 360) * Math.PI / 180;
                u16[0] = y * 9362;
                return u16[0];
            }
        },
        {
            attrName: 'aOverlap',
            symbolName: 'markerAllowOverlap',
            type: Uint8Array,
            width: 1,
            evaluate: properties => {
                let overlap = markerAllowOverlapFn(map.getZoom(), properties) || 0;
                let placement = (markerIgnorePlacementFn ? markerIgnorePlacementFn(map.getZoom(), properties) : symbolDef['markerIgnorePlacement']) || 0;
                overlap = 1 << 3 + overlap * (1 << 2);
                placement = (markerIgnorePlacementFn ? 1 << 1 : 0) + placement;
                return overlap + placement;
            }
        },
        // 因为 markerAllowOverlap 和 markerIgnorePlacement 共用一个 aOverlap
        // 如果 markerAllowOverlap 和 markerIgnorePlacement 同时定义，会重复计算一次。
        // 这里稍微牺牲一些性能，保持程序逻辑的简洁
        {
            attrName: 'aOverlap',
            symbolName: 'markerIgnorePlacement',
            type: Uint8Array,
            width: 1,
            evaluate: properties => {
                let overlap = (markerAllowOverlapFn ? markerAllowOverlapFn(map.getZoom(), properties) : symbolDef['markerAllowOverlap']) || 0;
                let placement = markerIgnorePlacementFn(map.getZoom(), properties) || 0;
                overlap = (markerAllowOverlapFn ? 1 << 3 : 0) + overlap * (1 << 2);
                placement = (1 << 1) + placement;
                return overlap + placement;
            }
        }
    ];
}

export function prepareLabelIndex(map, iconGeometry, markerTextFit) {
    if (!iconGeometry || !markerTextFit || markerTextFit === 'none') {
        return;
    }

    const { iconAtlas, glyphAtlas } = iconGeometry.properties;
    if (!iconAtlas || !glyphAtlas) {
        return;
    }

    prepareElements(iconGeometry);

    const labelIndex = buildLabelIndex(iconGeometry, markerTextFit);
    if (!iconGeometry.getElements().length) {
        return;
    }
    if (!labelIndex.length) {
        return;
    }
    iconGeometry.properties.labelIndex = labelIndex;
    const hasTextFit = labelIndex.length && markerTextFit && markerTextFit !== 'none';
    if (hasTextFit) {
        const labelShape = buildLabelShape(iconGeometry);
        if (labelShape.length) {
            iconGeometry.properties.labelShape = labelShape;
            fillTextFitData.call(this, map, iconGeometry);
        }
    }
}

function prepareElements(iconGeometry) {
    if (iconGeometry.properties.iconElements) {
        return;
    }
    const iconElements = [];
    const textElements = [];
    const elements = iconGeometry.elements;
    const aType = iconGeometry.properties.aType;

    for (let i = 0; i < elements.length; i++) {
        const index = elements[i];
        if (aType[index] === 0) {
            iconElements.push(index);
        } else {
            textElements.push(index);
        }
    }
    iconGeometry.properties.iconElements = new elements.constructor(iconElements);
    iconGeometry.properties.textElements = new elements.constructor(textElements);
}

// labelIndex中存的是icon对应的label在textGeometry.element中的start和end
function buildLabelIndex(iconGeometry, markerTextFit) {
    let markerTextFitFn = iconGeometry.properties.textFitFn;
    if (isFunctionDefinition(markerTextFit)) {
        markerTextFitFn = iconGeometry.properties.textFitFn = piecewiseConstant(markerTextFit);
    }
    const isTextFit = markerTextFit !== 'none';
    const labelIndex = [];
    const iconElements = iconGeometry.properties.iconElements;
    const aPickingId = iconGeometry.data.aPickingId;

    const textElements = iconGeometry.properties.textElements;
    const textIds = iconGeometry.data.aPickingId;
    const textCounts = iconGeometry.properties.aCount;

    const features = iconGeometry.properties.features;

    let currentLabel;
    let textId = textElements[0];
    currentLabel = {
        pickingId: textIds[textId],
        start: 0,
        end: textCounts[textId] * BOX_ELEMENT_COUNT
    };
    let labelVisitEnd = false;
    let hasLabel = false;
    let count = 0;
    const unused = new Set();
    //遍历所有的icon，当icon和aPickingId和text的相同时，则认为是同一个icon + text，并记录它的序号
    for (let i = 0; i < iconElements.length; i += BOX_ELEMENT_COUNT) {
        const idx = iconElements[i];
        const pickingId = aPickingId[idx];
        if (!labelVisitEnd && currentLabel) {
            //label的pickingId比icon的小，说明当前文字没有icon，则往前找到下一个label pickingId比当前icon大的label
            while (currentLabel.pickingId < pickingId && currentLabel.end < textElements.length) {
                const start = currentLabel.end;
                const textId = textElements[start];
                currentLabel.start = start;
                currentLabel.end = start + textCounts[textId] * BOX_ELEMENT_COUNT;
                currentLabel.pickingId = textIds[textId];
            }
        }
        if (!labelVisitEnd && currentLabel && currentLabel.pickingId < pickingId) {
            //后面的icon都没有label
            labelVisitEnd = true;
            if (!isTextFit) {
                //如果不是textfit, 直接填充labelIndex并退出
                if (!hasLabel) {
                    return [];
                }
                for (let ii = i; ii < iconElements.length; ii += BOX_ELEMENT_COUNT) {
                    labelIndex[count++] = [-1, -1];
                }
                return labelIndex;
            }
        }
        const feature = features[pickingId] && features[pickingId].feature;
        const properties = feature && feature.properties || {};
        // properties['$layer'] = feature && feature.layer;
        // properties['$type'] = feature && feature.type;
        const textFit = markerTextFitFn ? markerTextFitFn(null, properties) : markerTextFit;
        // delete properties['$layer'];
        // delete properties['$type'];
        if (currentLabel && pickingId === currentLabel.pickingId) {
            labelIndex[count++] = [currentLabel.start, currentLabel.end];
            const start = currentLabel.end;
            const textId = textElements[start];
            currentLabel.start = start;
            currentLabel.end = start + textCounts[textId] * BOX_ELEMENT_COUNT;
            currentLabel.pickingId = textIds[textId];
            hasLabel = true;
        } else if (textFit && textFit !== 'none') {
            //如果icon设置了markerTextFit，但没有label，则从elements中去掉这个icon
            for (let ii = i; ii < i + BOX_ELEMENT_COUNT; ii++) {
                unused.add(ii);
            }
        } else {
            labelIndex[count++] = [-1, -1];
        }
    }
    if (unused.size) {
        if (unused.size === iconElements.length) {
            iconGeometry.setElements([]);
        } else {
            const elements = [];
            for (let i = 0; i < iconElements.length; i++) {
                if (!unused.has(i)) {
                    elements.push(iconElements[i]);
                }
            }
            iconGeometry.setElements(new iconElements.constructor(elements));
        }
    }
    if (!hasLabel) {
        return [];
    }
    return labelIndex;
}

function buildLabelShape(iconGeometry) {
    const labelShape = [];
    const labelIndex = iconGeometry.properties.labelIndex;
    const { aShape } = iconGeometry.data;
    let hasValue = false;
    for (let i = 0; i < labelIndex.length; i++) {
        const [start, end] = labelIndex[i];
        if (start === -1) {
            labelShape.push(0, 0, 0, 0);
        } else {
            hasValue = true;
            let minx = Infinity, miny = Infinity, maxx = -Infinity, maxy = -Infinity;
            const elements = iconGeometry.properties.textElements;
            for (let ii = start; ii < end; ii++) {
                const idx = elements[ii];
                const x = aShape[idx * 4];
                const y = aShape[idx * 4 + 1];
                if (x < minx) {
                    minx = x;
                }
                if (x > maxx) {
                    maxx = x;
                }
                if (y < miny) {
                    miny = y;
                }
                if (y > maxy) {
                    maxy = y;
                }
            }
            labelShape.push(minx, miny, maxx, maxy);
        }
    }
    if (!hasValue) {
        return [];
    }
    return labelShape;
}

function fillTextFitData(map, iconGeometry) {
    const symbolDef = this.getSymbolDef(iconGeometry.properties.symbolIndex);
    //1. markerTextFit 是否是 fn-type，如果是，则遍历features创建 fitIcons, fitWidthIcons, fitHeightIcons
    //2. 检查data中是否存在aMarkerWidth或aMarkerHeight，如果没有则添加
    //3. 如果textSize是zoomConstant，说明 markerWidth和markerHeight是静态的，提前计算，未来无需再更新
    const markerTextFit = symbolDef['markerTextFit'];
    const props = iconGeometry.properties;
    let hasWidth = markerTextFit === 'both' || markerTextFit === 'width';
    let hasHeight = markerTextFit === 'both' || markerTextFit === 'height';

    if (isFunctionDefinition(symbolDef['markerTextFit'])) {
        let markerTextFitFn = iconGeometry.properties.textFitFn;
        if (!markerTextFitFn) {
            markerTextFitFn = iconGeometry.properties.textFitFn = interpolated(symbolDef['markerTextFit']);
        }
        const { features } = iconGeometry.properties;
        const elements = iconGeometry.properties.iconElements;
        const { aPickingId } = iconGeometry.data;
        const fitWidthIcons = [];
        const fitHeightIcons = [];
        let onlyBoth = true;
        for (let i = 0; i < elements.length; i += BOX_ELEMENT_COUNT) {
            const idx = elements[i];
            const pickingId = aPickingId[idx];
            const feature = features[pickingId];
            const fea = feature && feature.feature || {};
            const properties = fea.properties || {};
            // properties['$layer'] = fea.layer;
            // properties['$type'] =  fea.type;
            let v = markerTextFitFn(null, properties);
            if (isFunctionDefinition(v)) {
                const fn = properties.textFitFn = properties.textFitFn || interpolated(v);
                v = fn(null, properties);
            }
            // delete properties['$layer'];
            // delete properties['$type'];
            if (v === 'both') {
                fitWidthIcons.push(i / BOX_ELEMENT_COUNT);
                fitHeightIcons.push(i / BOX_ELEMENT_COUNT);
            } else if (v === 'width') {
                onlyBoth = false;
                fitWidthIcons.push(i / BOX_ELEMENT_COUNT);
            } else if (v === 'height') {
                onlyBoth = false;
                fitHeightIcons.push(i / BOX_ELEMENT_COUNT);
            }
        }
        if (onlyBoth) {
            props.fitIcons = fitWidthIcons;
            hasWidth = true;
            hasHeight = true;
        } else {
            if (fitWidthIcons.length) {
                props.fitWidthIcons = fitWidthIcons;
                hasWidth = true;
            }
            if (fitHeightIcons.length) {
                props.fitHeightIcons = fitHeightIcons;
                hasHeight = true;
            }
        }
    }

    if (!props['aPickingId']) {
        props['aPickingId'] = new iconGeometry.data.aPickingId.constructor(iconGeometry.data.aPickingId);
    }
    const { aMarkerWidth, aMarkerHeight, aPickingId } = props;
    const count = aPickingId.length;
    //把aMarkerWidth和aMarkerHeight从Uint8Array改为Uint16Array，因为text-fit后的宽度或高度很可能超过255
    if (hasWidth) {
        if (!aMarkerWidth) {
            // 因为 aMarkerWidth 可能不会被更新（例如markerTextFit为height时），预先用 markerWidth 填充 aMarkerWidth
            const markerWidth = this.getSymbol(iconGeometry.properties.symbolIndex).markerWidth || 0;
            props.aMarkerWidth = new Uint16Array(count);
            props.aMarkerWidth.fill(markerWidth);
            if (markerWidth) {
                props.aMarkerWidth.dirty = true;
            }
            iconGeometry.data.aMarkerWidth = new Uint16Array(count);
        } else {
            const arr = iconGeometry.data.aMarkerWidth;
            //在 fn-type 中已经创建
            iconGeometry.data.aMarkerWidth = new Uint16Array(arr);
            props.aMarkerWidth = new Uint16Array(arr);
            const keyName = (PREFIX + 'aMarkerWidth').trim();
            if (props[keyName]) {
                props[keyName] = props.aMarkerWidth;
            }
        }

    }
    if (hasHeight) {
        if (!aMarkerHeight) {
            const markerHeight = this.getSymbol(iconGeometry.properties.symbolIndex).markerHeight || 0;
            props.aMarkerHeight = new Uint16Array(count);
            props.aMarkerHeight.fill(markerHeight);
            if (markerHeight) {
                props.aMarkerHeight.dirty = true;
            }
            iconGeometry.data.aMarkerHeight = new Uint16Array(count);
        } else {
            const arr = iconGeometry.data.aMarkerHeight;
            //在 fn-type 中已经创建
            iconGeometry.data.aMarkerHeight = new Uint16Array(arr);
            props.aMarkerHeight = new Uint16Array(arr);
            const keyName = (PREFIX + 'aMarkerHeight').trim();
            if (props[keyName]) {
                props[keyName] = props.aMarkerHeight;
            }
        }
    }

    const textSymbolDef = this.getSymbolDef(iconGeometry.properties.symbolIndex);
    const textFitFn = interpolated(textSymbolDef['textSize']);

    updateMarkerFitSize.call(this, map, iconGeometry);
    if (!isFunctionDefinition(textSymbolDef['textSize']) || textFitFn.isZoomConstant && textFitFn.isFeatureConstant) {
        props.isFitConstant = true;
        return;
    }
}

const DEFAULT_PADDING = [0, 0, 0, 0];
export function updateMarkerFitSize(map, iconGeometry) {
    const textGeometry = iconGeometry;
    const textProps = textGeometry.properties;
    if (!textProps.glyphAtlas || !textProps.textElements || !textProps.textElements.length) {
        return;
    }

    const props = iconGeometry.properties;
    if (props.isFitConstant || !props.labelShape || !props.labelShape.length) {
        return;
    }
    // const { symbolDef: markerSymbol } = props;
    // const { symbolDef } = textProps;
    const markerSymbol = this.getSymbolDef(iconGeometry.properties.symbolIndex);
    const symbolDef = markerSymbol;

    const textSizeDef = symbolDef['textSize'];
    let textSizeFn;
    if (isFunctionDefinition(textSizeDef)) {
        if (!textProps._textSizeFn) {
            textSizeFn = textProps._textSizeFn = interpolated(textSizeDef);
        } else {
            textSizeFn = textProps._textSizeFn;
        }
    }
    const padding = markerSymbol['markerTextFitPadding'] || DEFAULT_PADDING;
    let paddingFn;
    if (isFunctionDefinition(padding)) {
        if (!props._paddingFn) {
            paddingFn = props._paddingFn = piecewiseConstant(padding);
        } else {
            paddingFn = props._paddingFn;
        }
    }
    const zoom = map.getZoom();
    //textSize是fn-type，实时更新aMarkerHeight或者aMarkerWidth
    const { fitIcons, fitWidthIcons, fitHeightIcons } = props;
    const { aMarkerWidth, aMarkerHeight, labelShape } = props;

    const elements = iconGeometry.properties.iconElements;
    const { features, aPickingId } = props;
    const fn = (idx, iconIndex, hasWidth, hasHeight) => {
        const minx = labelShape[iconIndex * 4];
        const miny = labelShape[iconIndex * 4 + 1];
        const maxx = labelShape[iconIndex * 4 + 2];
        const maxy = labelShape[iconIndex * 4 + 3];
        if (!minx && !miny && !maxx && !maxy) {
            return;
        }
        const pickingId = aPickingId[idx];
        const feature = features[pickingId] && features[pickingId].feature;
        const properties = feature && feature.properties || {};
        // properties['$layer'] = feature && feature.layer;
        // properties['$type'] = feature && feature.type;
        let textSize = (textSizeFn ? textSizeFn(zoom, properties) : textSizeDef);
        if (isFunctionDefinition(textSize)) {
            const fn = properties.textSizeFn = properties.textSizeFn || interpolated(textSize);
            textSize = fn(zoom, properties);
        }
        textSize /=  GLYPH_SIZE;
        let fitPadding = paddingFn && paddingFn(zoom, properties) || padding;
        if (isFunctionDefinition(fitPadding)) {
            const fn = properties.fitPaddingFn = properties.fitPaddingFn || piecewiseConstant(fitPadding);
            fitPadding = fn(zoom, properties);
        }
        fitPadding = fitPadding || DEFAULT_PADDING;
        let aPadOffset;
        if (fitPadding[0] !== fitPadding[2] || fitPadding[1] !== fitPadding[3]) {
            aPadOffset = props.aPadOffset;
            if (!aPadOffset) {
                aPadOffset = props.aPadOffset = new Int8Array(aMarkerWidth.length * 2);
            }
        }
        // delete properties['$layer'];
        // delete properties['$type'];
        if (aMarkerWidth && hasWidth) {
            //除以10是因为为了增加精度，shader中的aShape乘以了10
            const width = Math.abs((maxx - minx) / 10 * textSize) + ((fitPadding[1] + fitPadding[3]) || 0);
            U8[0] = width;
            if (aMarkerWidth[idx] !== U8[0]) {
                fillArray(aMarkerWidth, U8[0], idx, idx + BOX_VERTEX_COUNT);
                aMarkerWidth.dirty = true;
            }
            if (aPadOffset) {
                const offset = (fitPadding[1] + fitPadding[3]) / 2 - fitPadding[3];
                I8[0] = offset;
                if (aPadOffset[idx * 2] !== I8[0]) {
                    for (let i = idx; i < idx + BOX_VERTEX_COUNT; i++) {
                        aPadOffset[i * 2] = offset;
                    }
                    aPadOffset.dirty = true;
                }
            }
        }
        if (aMarkerHeight && hasHeight) {
            const height = Math.abs((maxy - miny) / 10 * textSize) + ((fitPadding[0] + fitPadding[2]) || 0);
            U8[0] = height;
            if (aMarkerHeight[idx] !== U8[0]) {
                fillArray(aMarkerHeight, U8[0], idx, idx + BOX_VERTEX_COUNT);
                aMarkerHeight.dirty = true;
            }
            if (aPadOffset) {
                const offset = fitPadding[0] - (fitPadding[0] + fitPadding[2]) / 2;
                I8[0] = offset;
                if (aPadOffset[idx * 2 + 1] !== I8[0]) {
                    for (let i = idx; i < idx + BOX_VERTEX_COUNT; i++) {
                        aPadOffset[i * 2 + 1] = offset;
                    }
                    aPadOffset.dirty = true;
                }
            }
        }
    };

    if (!fitIcons && !fitWidthIcons && !fitHeightIcons) {
        // markerTextFit 不是 fn-type，遍历所有的icon
        for (let i = 0; i < elements.length; i += BOX_ELEMENT_COUNT) {
            const iconIndex = i / BOX_ELEMENT_COUNT;
            const idx = elements[i];
            fn(idx, iconIndex, true, true);
        }
    } else if (fitIcons) {
        // markerTextFit 是 fn-type，且是both
        for (let i = 0; i < fitIcons.length; i++) {
            const iconIndex = fitIcons[i];
            const idx = elements[iconIndex * BOX_ELEMENT_COUNT];
            fn(idx, iconIndex, true, true);
        }
    } else if (fitWidthIcons || fitHeightIcons) {
        // markerTextFit 是 fn-type, 且值可能为both，也可能为width, height
        if (fitWidthIcons) {
            for (let i = 0; i < fitWidthIcons.length; i++) {
                const iconIndex = fitWidthIcons[i];
                const idx = elements[iconIndex * BOX_ELEMENT_COUNT];
                fn(idx, iconIndex, true, false);
            }
        }
        if (fitHeightIcons) {
            for (let i = 0; i < fitHeightIcons.length; i++) {
                const iconIndex = fitHeightIcons[i];
                const idx = elements[iconIndex * BOX_ELEMENT_COUNT];
                fn(idx, iconIndex, false, true);
            }
        }
    }
    const { aPadOffset } = props;
    if (aPadOffset) {
        iconGeometry.data.aPadOffset = aPadOffset;
    }
}
