import { reshader } from '@maptalks/gl';
import { interpolated, piecewiseConstant, isFunctionDefinition } from '@maptalks/function-type';
import { setUniformFromSymbol, wrap, fillArray } from '../../Util';
import { DEFAULT_MARKER_WIDTH, DEFAULT_MARKER_HEIGHT, GLYPH_SIZE, DEFAULT_ICON_ALPHA_TEST } from '../Constant';
import { createAtlasTexture, getDefaultMarkerSize } from './atlas_util';
import { prepareFnTypeData, PREFIX } from './fn_type_util';
// import { getIconBox } from './get_icon_box';

export const BOX_ELEMENT_COUNT = 6;
export const BOX_VERTEX_COUNT = 4; //每个box有四个顶点数据
const U8 = new Uint16Array(1);
const I8 = new Int8Array(1);

export function createMarkerMesh(regl, geometry, transform, symbolDef, symbol, fnTypeConfig, enableCollision, visibleInCollision) {
    if (geometry.isDisposed() || geometry.data.aPosition.length === 0) {
        return null;
    }
    const iconAtlas = geometry.properties.iconAtlas;
    if (!iconAtlas && !geometry.properties.isEmpty) {
        return null;
    }
    // const symbol = this.getSymbol();
    // geometry.properties.symbol = symbol;
    const uniforms = {
        flipY: 0,
        tileResolution: geometry.properties.tileResolution,
        tileRatio: geometry.properties.tileRatio
    };

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
        geometry.properties.aShape = aShape;
    }
    if (!geometry.properties.visElemts) {
        //保存elements，隐藏icon时，从elements中删除icon的索引数据
        geometry.properties.elements = geometry.elements;
        geometry.properties.visElemts = new geometry.elements.constructor(geometry.elements.length);
    }


    const [ defaultMarkerWidth, defaultMarkerHeight ] = getDefaultMarkerSize(geometry);
    setUniformFromSymbol(uniforms, 'markerOpacity', symbol, 'markerOpacity', 1);
    setUniformFromSymbol(uniforms, 'markerPerspectiveRatio', symbol, 'markerPerspectiveRatio', symbol.markerTextFit ? 0 : 1);
    setUniformFromSymbol(uniforms, 'markerWidth', symbol, 'markerWidth', defaultMarkerWidth || DEFAULT_MARKER_WIDTH);
    setUniformFromSymbol(uniforms, 'markerHeight', symbol, 'markerHeight', defaultMarkerHeight || DEFAULT_MARKER_HEIGHT);
    setUniformFromSymbol(uniforms, 'markerDx', symbol, 'markerDx', 0);
    setUniformFromSymbol(uniforms, 'markerDy', symbol, 'markerDy', 0);
    setUniformFromSymbol(uniforms, 'markerRotation', symbol, 'markerRotation', 0, v => v * Math.PI / 180);
    setUniformFromSymbol(uniforms, 'pitchWithMap', symbol, 'markerPitchAlignment', 0, v => v === 'map' ? 1 : 0);
    setUniformFromSymbol(uniforms, 'rotateWithMap', symbol, 'markerRotationAlignment', 0, v => v === 'map' ? 1 : 0);

    uniforms['iconTex'] = iconAtlas ? createAtlasTexture(regl, iconAtlas, false) : null;
    uniforms['texSize'] = iconAtlas ? [iconAtlas.width, iconAtlas.height] : [0, 0];
    geometry.generateBuffers(regl, { excludeElementsInVAO: true });
    const material = new reshader.Material(uniforms);
    const mesh = new reshader.Mesh(geometry, material, {
        // 必须关闭VAO，否则对vao中elements的更新会导致halo绘制出错
        disableVAO: true,
        transparent: true,
        castShadow: false,
        picking: true
    });
    const defines = {};
    if (enableCollision) {
        defines['ENABLE_COLLISION'] = 1;
    }
    if (geometry.data.aMarkerWidth) {
        defines['HAS_MARKER_WIDTH'] = 1;
    }
    if (geometry.data.aMarkerHeight) {
        defines['HAS_MARKER_HEIGHT'] = 1;
    }
    if (geometry.data.aColorOpacity) {
        defines['HAS_OPACITY'] = 1;
    }
    if (geometry.data.aMarkerDx) {
        defines['HAS_MARKER_DX'] = 1;
    }
    if (geometry.data.aMarkerDy) {
        defines['HAS_MARKER_DY'] = 1;
    }
    if (geometry.data.aPitchAlign) {
        defines['HAS_PITCH_ALIGN'] = 1;
    }
    if (geometry.data.aRotationAlign) {
        defines['HAS_ROTATION_ALIGN'] = 1;
    }
    if (geometry.data.aRotation) {
        defines['HAS_ROTATION'] = 1;
    }
    if (geometry.data.aPadOffsetX) {
        defines['HAS_PAD_OFFSET'] = 1;
    }
    if (geometry.data.aAltitude) {
        defines['HAS_ALTITUDE'] = 1;
    }
    mesh.setDefines(defines);
    mesh.setUniform('alphaTest', DEFAULT_ICON_ALPHA_TEST);
    mesh.setLocalTransform(transform);
    mesh.properties.symbolIndex = geometry.properties.symbolIndex;
    return mesh;
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
    const markerRotationAlignmentFn = piecewiseConstant(symbolDef['markerRotationAlignment']);
    const markerRotationFn = interpolated(symbolDef['markerRotation']);
    const markerAllowOverlapFn = piecewiseConstant(symbolDef['markerAllowOverlapFn']);
    const markerIgnorePlacementFn = piecewiseConstant(symbolDef['markerIgnorePlacement']);
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
        {
            attrName: 'aMarkerDx',
            symbolName: 'markerDx',
            type: Uint8Array,
            width: 1,
            define: 'HAS_MARKER_DX',
            evaluate: (properties, geometry) => {
                let x = markerDxFn(map.getZoom(), properties);
                if (isFunctionDefinition(x)) {
                    x = this.evaluateInFnTypeConfig(x, geometry, map, properties);
                }

                // const x = markerDxFn(map.getZoom(), properties);
                u8[0] = x;
                return u8[0];
            }
        },
        {
            attrName: 'aMarkerDy',
            symbolName: 'markerDy',
            type: Uint8Array,
            width: 1,
            define: 'HAS_MARKER_DY',
            evaluate: (properties, geometry) => {
                let x = markerDyFn(map.getZoom(), properties);
                if (isFunctionDefinition(x)) {
                    x = this.evaluateInFnTypeConfig(x, geometry, map, properties);
                }

                u8[0] = x;
                return u8[0];
            }
        },
        {
            attrName: 'aColorOpacity',
            symbolName: 'markerOpacity',
            type: Uint8Array,
            width: 1,
            define: 'HAS_OPACITY',
            evaluate: (properties, geometry) => {
                let opacity = markerOpacityFn(map.getZoom(), properties);
                if (isFunctionDefinition(opacity)) {
                    opacity = this.evaluateInFnTypeConfig(opacity, geometry, map, properties);
                }
                u8[0] = opacity * 255;
                return u8[0];
            }
        },
        {
            attrName: 'aPitchAlign',
            symbolName: 'markerPitchAlignment',
            type: Uint8Array,
            width: 1,
            define: 'HAS_PITCH_ALIGN',
            evaluate: properties => {
                const y = +(markerPitchAlignmentFn(map.getZoom(), properties) === 'map');
                return y;
            }
        },
        {
            attrName: 'aRotationAlign',
            symbolName: 'markerRotationAlignment',
            type: Uint8Array,
            width: 1,
            define: 'HAS_ROTATION_ALIGN',
            evaluate: properties => {
                const y = +(markerRotationAlignmentFn(map.getZoom(), properties) === 'map');
                return y;
            }
        },
        {
            attrName: 'aRotation',
            symbolName: 'markerRotation',
            type: Uint16Array,
            width: 1,
            define: 'HAS_ROTATION',
            evaluate: properties => {
                const y = wrap(markerRotationFn(map.getZoom(), properties), 0, 360) * Math.PI / 180;
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

export function prepareLabelIndex(map, iconGeometry, textGeometry, markerTextFit) {
    if (!textGeometry || !markerTextFit || markerTextFit === 'none') {
        return;
    }

    const labelIndex = buildLabelIndex(iconGeometry, textGeometry, markerTextFit);
    if (!iconGeometry.getElements().length) {
        return;
    }
    if (!labelIndex.length) {
        return;
    }
    iconGeometry.properties.labelIndex = labelIndex;
    const hasTextFit = labelIndex.length && markerTextFit && markerTextFit !== 'none';
    if (hasTextFit && textGeometry) {
        const labelShape = buildLabelShape(iconGeometry, textGeometry);
        if (labelShape.length) {
            iconGeometry.properties.labelShape = labelShape;
            fillTextFitData.call(this, map, iconGeometry, textGeometry);
        }
    }
}

// labelIndex中存的是icon对应的label在textGeometry.element中的start和end
function buildLabelIndex(iconGeometry, textGeometry, markerTextFit) {
    let markerTextFitFn = iconGeometry.properties.textFitFn;
    if (isFunctionDefinition(markerTextFit)) {
        markerTextFitFn = iconGeometry.properties.textFitFn = piecewiseConstant(markerTextFit);
    }
    const isTextFit = markerTextFit !== 'none';
    const labelIndex = [];
    const iconElements = iconGeometry.getElements();
    const iconIds = iconGeometry.data.aPickingId;

    let textElements, textIds, textCounts;
    if (textGeometry) {
        textElements = textGeometry.getElements();
        textIds = textGeometry.data.aPickingId;
        textCounts = textGeometry.data.aCount;
    }

    const features = iconGeometry.properties.features;

    let currentLabel;
    if (textGeometry) {
        let textId = textElements[0];
        currentLabel = {
            pickingId: textIds[textId],
            start: 0,
            end: textCounts[textId] * BOX_ELEMENT_COUNT
        };
    }

    let labelVisitEnd = false;
    let hasLabel = false;
    let count = 0;
    const unused = new Set();
    //遍历所有的icon，当icon和aPickingId和text的相同时，则认为是同一个icon + text，并记录它的序号
    for (let i = 0; i < iconElements.length; i += BOX_ELEMENT_COUNT) {
        const idx = iconElements[i];
        const pickingId = iconIds[idx];
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

function buildLabelShape(iconGeometry, textGeometry) {
    const labelShape = [];
    const labelIndex = iconGeometry.properties.labelIndex;
    const { aShape } = textGeometry.data;
    let hasValue = false;
    for (let i = 0; i < labelIndex.length; i++) {
        const [start, end] = labelIndex[i];
        if (start === -1) {
            labelShape.push(0, 0, 0, 0);
        } else {
            hasValue = true;
            let minx = Infinity, miny = Infinity, maxx = -Infinity, maxy = -Infinity;
            const elements = textGeometry.elements;
            for (let ii = start; ii < end; ii++) {
                const idx = elements[ii];
                const x = aShape[idx * 2];
                const y = aShape[idx * 2 + 1];
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
        const elements = iconGeometry.properties.elements || iconGeometry.elements;
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

    const textSymbolDef = this.getSymbolDef(iconGeometry.properties.textGeo.properties.symbolIndex);
    const textFitFn = interpolated(textSymbolDef['textSize']);

    updateMarkerFitSize.call(this, map, iconGeometry);
    if (!isFunctionDefinition(textSymbolDef['textSize']) || textFitFn.isZoomConstant && textFitFn.isFeatureConstant) {
        props.isFitConstant = true;
        return;
    }
}

const DEFAULT_PADDING = [0, 0, 0, 0];
export function updateMarkerFitSize(map, iconGeometry) {
    const textGeometry = iconGeometry.properties.textGeo;
    if (!textGeometry) {
        return;
    }
    const textProps = textGeometry.properties;
    const props = iconGeometry.properties;
    if (props.isFitConstant || !props.labelShape || !props.labelShape.length) {
        return;
    }
    // const { symbolDef: markerSymbol } = props;
    // const { symbolDef } = textProps;
    const markerSymbol = this.getSymbolDef(iconGeometry.properties.symbolIndex);
    const symbolDef = this.getSymbolDef(textGeometry.properties.symbolIndex);

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

    const elements = props.elements || iconGeometry.elements;
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
        let aPadOffsetX, aPadOffsetY;
        if (fitPadding[0] !== fitPadding[2] || fitPadding[1] !== fitPadding[3]) {
            aPadOffsetX = props.aPadOffsetX;
            aPadOffsetY = props.aPadOffsetY;
            if (!aPadOffsetX) {
                aPadOffsetX = props.aPadOffsetX = new Int8Array(aMarkerWidth.length);
                aPadOffsetY = props.aPadOffsetY = new Int8Array(aMarkerWidth.length);
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
            if (aPadOffsetX) {
                const offset = (fitPadding[1] + fitPadding[3]) / 2 - fitPadding[3];
                I8[0] = offset;
                if (aPadOffsetX[idx] !== I8[0]) {
                    fillArray(aPadOffsetX, offset, idx, idx + BOX_VERTEX_COUNT);
                    aPadOffsetX.dirty = true;
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
            if (aPadOffsetY) {
                const offset = fitPadding[0] - (fitPadding[0] + fitPadding[2]) / 2;
                I8[0] = offset;
                if (aPadOffsetY[idx] !== I8[0]) {
                    fillArray(aPadOffsetY, offset, idx, idx + BOX_VERTEX_COUNT);
                    aPadOffsetY.dirty = true;
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
    const { aPadOffsetX, aPadOffsetY } = props;
    if (aPadOffsetX) {
        iconGeometry.data.aPadOffsetX = aPadOffsetX;
        iconGeometry.data.aPadOffsetY = aPadOffsetY;
    }
}
