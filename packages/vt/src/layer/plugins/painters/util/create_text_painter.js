import { mat4, vec4, reshader } from '@maptalks/gl';
import { setUniformFromSymbol, createColorSetter, wrap, toUint8ColorInGlobalVar, isIconText } from '../../Util';
import { DEFAULT_ICON_ALPHA_TEST } from '../Constant';
import { prepareFnTypeData, PREFIX } from './fn_type_util';
import { isFunctionDefinition, interpolated, piecewiseConstant } from '@maptalks/function-type';
import { Color } from '@maptalks/vector-packer';
import { getAnchor, getLabelBox } from './get_label_box';
import { projectPoint } from './projection';
import { getLabelContent } from './get_label_content';
import { createAtlasTexture } from './atlas_util';
import { INVALID_PROJECTED_ANCHOR } from '../../../../common/Constant';

const GAMMA_SCALE = 1;
const BOX_ELEMENT_COUNT = 6;

const DEFAULT_UNIFORMS = {
    'textFill': [0, 0, 0, 1],
    'textOpacity': 1,
    'textPitchAlignment': 0,
    'textRotationAlignment': 0,
    'textHaloRadius': 0,
    'textHaloFill': [1, 1, 1, 1],
    'textHaloBlur': 0,
    'textHaloOpacity': 1,
    'textPerspectiveRatio': 0,
    'textSize': 14,
    'textDx': 0,
    'textDy': 0,
    'textRotation': 0
};

export { DEFAULT_UNIFORMS, GAMMA_SCALE };

// enableCollision 决定是否生成collision数据结构
// visibleCollision决定当前mesh是否显示，例如 layer.options.collision = false 但sceneConfig.collision = false 时，则生成collision数据结构但mesh设为可见
export function createTextMesh(regl, geometry, transform, symbolDef, symbol, fnTypeConfig, enableCollision, visibleInCollision, enableUniquePlacement) {
    const meshes = [];

    if (geometry.isDisposed() || geometry.data.aPosition.length === 0) {
        return meshes;
    }
    const glyphAtlas = geometry.properties.glyphAtlas;
    if (!glyphAtlas) {
        return meshes;
    }

    if (symbolDef['textSize'] === 0 || symbolDef['textOpacity'] === 0) {
        return meshes;
    }
    prepareFnTypeData(geometry, symbolDef, fnTypeConfig);


    //避免重复创建属性数据
    if (!geometry.properties.aCount) {
        prepareGeometry.call(this, geometry, enableCollision || enableUniquePlacement, visibleInCollision);
        const { aTextSize, aTextDx, aTextDy, aPitchAlign, aRotationAlign, aRotation, aOverlap, aAltitude } = geometry.data;
        if (aTextSize) {
            //for collision
            const keyName = (PREFIX + 'aTextSize').trim();
            geometry.properties.aTextSize = geometry.properties[keyName] || new aTextSize.constructor(aTextSize);
        }
        if (aTextDx) {
            //for collision
            const keyName = (PREFIX + 'aTextDx').trim();
            geometry.properties.aTextDx = geometry.properties[keyName] || new aTextDx.constructor(aTextDx);
        }
        if (aTextDy) {
            //for collision
            const keyName = (PREFIX + 'aTextDy').trim();
            geometry.properties.aTextDy = geometry.properties[keyName] || new aTextDy.constructor(aTextDy);
        }
        if (aPitchAlign) {
            //for collision
            const keyName = (PREFIX + 'aPitchAlign').trim();
            geometry.properties.aPitchAlign = geometry.properties[keyName] || new aPitchAlign.constructor(aPitchAlign);
        }
        if (aRotationAlign) {
            //for collision
            const keyName = (PREFIX + 'aRotationAlign').trim();
            geometry.properties.aRotationAlign = geometry.properties[keyName] || new aRotationAlign.constructor(aRotationAlign);
        }
        if (aRotation) {
            //for collision
            const keyName = (PREFIX + 'aRotation').trim();
            geometry.properties.aRotation = geometry.properties[keyName] || new aRotation.constructor(aRotation);
        }
        if (aOverlap) {
            //for collision
            const keyName = (PREFIX + 'aOverlap').trim();
            geometry.properties.aOverlap = geometry.properties[keyName] || new aOverlap.constructor(aOverlap);
        }
        if (aAltitude) {
            const keyName = (PREFIX + 'aAltitude').trim();
            geometry.properties.aAltitude = geometry.properties[keyName] || new aAltitude.constructor(aAltitude);
        }
    }

    const glyphTexture = createAtlasTexture(regl, glyphAtlas, false);
    const uniforms = {
        flipY: 0,
        tileResolution: geometry.properties.tileResolution,
        tileRatio: geometry.properties.tileRatio,
        texture: glyphTexture,
        texSize: [glyphAtlas.width, glyphAtlas.height]
    };
    setMeshUniforms(geometry, uniforms, symbol);

    let transparent = false;
    if (symbol['textOpacity'] < 1) {
        transparent = true;
    }

    geometry.properties.memorySize = geometry.getMemorySize();
    geometry.generateBuffers(regl, { excludeElementsInVAO: true });
    const material = new reshader.Material(uniforms, DEFAULT_UNIFORMS);
    const mesh = new reshader.Mesh(geometry, material, {
        // 必须关闭VAO，否则对vao中elements的更新会导致halo绘制出错
        disableVAO: true,
        transparent,
        castShadow: false,
        picking: true
    });
    mesh.setLocalTransform(transform);
    mesh.setUniform('alphaTest', DEFAULT_ICON_ALPHA_TEST);
    //设置ignoreCollision，此mesh略掉collision检测
    //halo mesh会进行collision检测，并统一更新elements
    if (uniforms['isHalo']) {
        mesh.properties.isHalo = true;
    }
    if (enableCollision) {
        mesh.setDefines({
            'ENABLE_COLLISION': 1
        });
    }
    meshes.push(mesh);

    if (uniforms['isHalo']) {
        const uniforms1 = {
            flipY: 0,
            tileResolution: geometry.properties.tileResolution,
            tileRatio: geometry.properties.tileRatio,
            texture: glyphTexture,
            texSize: [glyphAtlas.width, glyphAtlas.height],
            isHalo: 0
        };
        setMeshUniforms(geometry, uniforms1, symbol);
        const material = new reshader.Material(uniforms1, DEFAULT_UNIFORMS);
        const textMesh = new reshader.Mesh(geometry, material, {
            // 必须关闭VAO，否则对vao中elements的更新会导致halo绘制出错
            disableVAO: true,
            transparent,
            castShadow: false,
            picking: true
        });
        textMesh.setUniform('alphaTest', DEFAULT_ICON_ALPHA_TEST);
        textMesh.properties.haloMesh = mesh;
        // isLabelCollides 中，计算碰撞盒时需要
        Object.defineProperty(textMesh.properties, 'textSize',  {
            enumerable: true,
            get: function () {
                return uniforms1['textSize'];
            }
        });
        if (enableCollision) {
            textMesh.setDefines({
                'ENABLE_COLLISION': 1
            });
        }
        textMesh.setLocalTransform(transform);
        meshes.push(textMesh);
    }

    meshes.forEach(mesh => {
        const defines = mesh.defines || {};
        if (geometry.data.aTextFill) {
            defines['HAS_TEXT_FILL'] = 1;
        }
        if (geometry.data.aTextSize) {
            defines['HAS_TEXT_SIZE'] = 1;
        }
        if (geometry.data.aColorOpacity) {
            defines['HAS_OPACITY'] = 1;
        }
        if (geometry.data.aTextHaloFill && mesh.material.uniforms.isHalo) {
            defines['HAS_TEXT_HALO_FILL'] = 1;
        }
        if (geometry.data.aTextHaloRadius && mesh.material.uniforms.isHalo) {
            defines['HAS_TEXT_HALO_RADIUS'] = 1;
        }
        if (geometry.data.aTextHaloOpacity && mesh.material.uniforms.isHalo) {
            defines['HAS_TEXT_HALO_OPACITY'] = 1;
        }
        if (geometry.data.aTextDx) {
            defines['HAS_TEXT_DX'] = 1;
        }
        if (geometry.data.aTextDy) {
            defines['HAS_TEXT_DY'] = 1;
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
        if (geometry.data.aAltitude) {
            defines['HAS_ALTITUDE'] = 1;
        }
        if (geometry.properties.aOffset && geometry.properties.aShape && geometry.properties.aOffset.length !== geometry.properties.aShape.length) {
            defines['HAS_OFFSET_Z'] = 1;
        }
        mesh.setDefines(defines);
        mesh.properties.symbolIndex = geometry.properties.symbolIndex;
    });

    return meshes;
}

function prepareGeometry(geometry, enableCollision, visibleInCollision) {
    const symbol = this.getSymbol(geometry.properties.symbolIndex);
    const isLinePlacement = geometry.properties.textPlacement === 'line' && !isIconText(symbol);
    const { aPosition, aShape } = geometry.data;
    const vertexCount = aPosition.length / geometry.desc.positionSize;
    geometry.properties.aPickingId = geometry.data.aPickingId;
    geometry.properties.aCount = geometry.data.aCount;
    delete geometry.data.aCount;

    if ((enableCollision || isLinePlacement)) {
        geometry.properties.aAnchor = aPosition;
        geometry.properties.aShape = aShape;
    }
    if (!geometry.properties.visElemts) {
        geometry.properties.elements = geometry.elements;
        geometry.properties.visElemts = new geometry.elements.constructor(geometry.elements.length);
    }

    if (isLinePlacement) {
        const { aVertical, aSegment, aGlyphOffset, aPitchRotation } = geometry.data;
        const is3DPitchText = !!aPitchRotation;
        geometry.properties.aGlyphOffset = aGlyphOffset;
        geometry.properties.aPitchRotation = aPitchRotation;
        geometry.properties.aSegment = aSegment;
        geometry.properties.aVertical = aVertical;

        delete geometry.data.aSegment;
        delete geometry.data.aVertical;
        delete geometry.data.aGlyphOffset;
        delete geometry.data.aPitchRotation;

        const offsetLength = aShape.length / 2 * (is3DPitchText ? 3 : 2);
        geometry.data.aOffset = {
            usage: 'dynamic',
            data: new Int16Array(offsetLength)
        };
        geometry.properties.aOffset = new Int16Array(offsetLength);
    }

    if (enableCollision) {
        geometry.data.aOpacity = {
            usage: 'dynamic',
            data: new Uint8Array(vertexCount)
        };
        geometry.properties.aOpacity = new Uint8Array(vertexCount);
        if (visibleInCollision) {
            geometry.properties.aOpacity.fill(255, 0);
            geometry.data.aOpacity.data.fill(255, 0);
        }

        const { aTextHaloRadius } = geometry.data;
        if (aTextHaloRadius && !geometry.properties.aTextHaloRadius) {
            const keyName = (PREFIX + 'aTextHaloRadius').trim();
            geometry.properties.aTextHaloRadius = geometry.properties[keyName] || new aTextHaloRadius.constructor(aTextHaloRadius);
        }
    }
}

function setMeshUniforms(geometry, uniforms, symbol) {
    // if (uniforms['isHalo'] === undefined) {
    //     setUniformFromSymbol(uniforms, 'isHalo', symbol, 'textHaloRadius', 0, () => {
    //         return +(!geometry.data['aTextHaloRadius'] || geometry.data['aTextHaloRadius'] && geometry.properties.hasHalo);
    //     });
    // }
    // 为了解决 fuzhenn/maptalks-designer#467，需要永远创建一个halo mesh
    if (uniforms['isHalo'] === undefined) {
        uniforms['isHalo'] = 1;
    }
    setUniformFromSymbol(uniforms, 'textOpacity', symbol, 'textOpacity', DEFAULT_UNIFORMS['textOpacity']);
    setUniformFromSymbol(uniforms, 'textFill', symbol, 'textFill', DEFAULT_UNIFORMS['textFill'], createColorSetter());
    setUniformFromSymbol(uniforms, 'textHaloFill', symbol, 'textHaloFill', DEFAULT_UNIFORMS['textHaloFill'], createColorSetter());
    setUniformFromSymbol(uniforms, 'textHaloBlur', symbol, 'textHaloBlur', DEFAULT_UNIFORMS['textHaloBlur']);
    setUniformFromSymbol(uniforms, 'textHaloRadius', symbol, 'textHaloRadius', DEFAULT_UNIFORMS['textHaloRadius']);
    setUniformFromSymbol(uniforms, 'textHaloOpacity', symbol, 'textHaloOpacity', DEFAULT_UNIFORMS['textHaloOpacity']);
    setUniformFromSymbol(uniforms, 'textPerspectiveRatio', symbol, 'textPerspectiveRatio', DEFAULT_UNIFORMS['textPerspectiveRatio'], v => {
        return geometry.properties.textPlacement === 'line' ? 1 : v;
    });
    setUniformFromSymbol(uniforms, 'rotateWithMap', symbol, 'textRotationAlignment', DEFAULT_UNIFORMS['textRotationAlignment'], v => +(v === 'map'));
    setUniformFromSymbol(uniforms, 'pitchWithMap', symbol, 'textPitchAlignment', DEFAULT_UNIFORMS['textPitchAlignment'], v => +(v === 'map'));
    setUniformFromSymbol(uniforms, 'textSize', symbol, 'textSize', DEFAULT_UNIFORMS['textSize']);
    setUniformFromSymbol(uniforms, 'textDx', symbol, 'textDx', DEFAULT_UNIFORMS['textDx']);
    setUniformFromSymbol(uniforms, 'textDy', symbol, 'textDy', DEFAULT_UNIFORMS['textDy']);
    setUniformFromSymbol(uniforms, 'textRotation', symbol, 'textRotation', DEFAULT_UNIFORMS['textRotation'], v => v * Math.PI / 180);
}

export function createTextShader(canvas, sceneConfig) {
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

    const projViewModelMatrix = [];
    const uniforms = [
        {
            name: 'projViewModelMatrix',
            type: 'function',
            fn: function (context, props) {
                return mat4.multiply(projViewModelMatrix, props['projViewMatrix'], props['modelMatrix']);
            }
        },
        {
            name: 'zoomScale',
            type: 'function',
            fn: function (context, props) {
                return props['tileResolution'] / props['resolution'];
            }
        }
    ];

    const extraCommandProps = {
        viewport,
        stencil: { //fix #94, intel显卡的崩溃和blending关系比较大，开启stencil来避免blending
            enable: true,
            mask: 0xFF,
            func: {
                //halo的stencil ref更大，允许文字填充在halo上绘制
                cmp: '<=', //renderer.isEnableWorkAround('win-intel-gpu-crash') ? '<' : '<=',
                ref: (context, props) => {
                    return props.stencilRef;
                },
                mask: 0xFF
            },
            op: {
                fail: 'keep',
                zfail: 'keep',
                zpass: 'replace'
            },
            // opBack: {
            //     fail: 'keep',
            //     zfail: 'keep',
            //     zpass: 'replace'
            // }
        },
        blend: {
            enable: true,
            func: {
                // src: 'src alpha',
                // dst: 'one minus src alpha'
                src: 'one',
                dst: 'one minus src alpha'
            },
            equation: 'add'
        },
        depth: {
            enable: true,
            range: sceneConfig.depthRange || [0, 1],
            func: sceneConfig.depthFunc || 'always',
            mask: false
        },
        polygonOffset: {
            enable: true,
            offset: this.getPolygonOffset()
        }
    };
    return {
        uniforms,
        extraCommandProps
    };
}

export function getTextFnTypeConfig(map, symbolDef) {
    const textFillFn = interpolated(symbolDef['textFill']);
    const textSizeFn = interpolated(symbolDef['textSize']);
    const textHaloFillFn = interpolated(symbolDef['textHaloFill']);
    const textHaloRadiusFn = interpolated(symbolDef['textHaloRadius']);
    const textHaloOpacityFn = interpolated(symbolDef['textHaloOpacity']);
    const textDxFn = interpolated(symbolDef['textDx']);
    const textDyFn = interpolated(symbolDef['textDy']);
    const textOpacityFn = interpolated(symbolDef['textOpacity']);
    const textPitchAlignmentFn = piecewiseConstant(symbolDef['textPitchAlignment']);
    const textRotationAlignmentFn = piecewiseConstant(symbolDef['textRotationAlignment']);
    const textRotationFn = interpolated(symbolDef['textRotation']);
    const textAllowOverlapFn = piecewiseConstant(symbolDef['textAllowOverlapFn']);
    const textIgnorePlacementFn = piecewiseConstant(symbolDef['textIgnorePlacement']);
    const colorCache = {};
    const u8 = new Int16Array(1);
    const u16 = new Uint16Array(1);
    return [
        {
            //geometry.data 中的属性数据
            attrName: 'aTextFill',
            //symbol中的function-type属性
            symbolName: 'textFill',
            define: 'HAS_TEXT_FILL',
            type: Uint8Array,
            width: 4,
            //
            evaluate: (properties, geometry) => {
                let color = textFillFn(map.getZoom(), properties);
                if (isFunctionDefinition(color)) {
                    color = this.evaluateInFnTypeConfig(color, geometry, map, properties, true);
                }
                if (!Array.isArray(color)) {
                    color = colorCache[color] = colorCache[color] || Color(color).unitArray();
                }
                color = toUint8ColorInGlobalVar(color);
                return color;
            }
        },
        {
            attrName: 'aTextSize',
            symbolName: 'textSize',
            define: 'HAS_TEXT_SIZE',
            type: Uint8Array,
            width: 1,
            evaluate: (properties, geometry) => {
                let size = textSizeFn(map.getZoom(), properties) || DEFAULT_UNIFORMS['textSize'];
                if (isFunctionDefinition(size)) {
                    size = this.evaluateInFnTypeConfig(size, geometry, map, properties);
                }
                u8[0] = size;
                return u8[0];
            }
        },
        {
            //geometry.data 中的属性数据
            attrName: 'aTextHaloFill',
            //symbol中的function-type属性
            symbolName: 'textHaloFill',
            define: 'HAS_TEXT_HALO_FILL',
            type: Uint8Array,
            width: 4,
            //
            evaluate: properties => {
                let color = textHaloFillFn(map.getZoom(), properties);
                if (!Array.isArray(color)) {
                    color = colorCache[color] = colorCache[color] || Color(color).unitArray();
                }
                color = toUint8ColorInGlobalVar(color);
                return color;
            }
        },
        {
            attrName: 'aTextHaloRadius',
            symbolName: 'textHaloRadius',
            define: 'HAS_TEXT_HALO_RADIUS',
            type: Uint8Array,
            width: 1,
            evaluate: properties => {
                const radius = textHaloRadiusFn(map.getZoom(), properties);
                u8[0] = radius;
                return u8[0];
            }
        },
        {
            attrName: 'aTextHaloOpacity',
            symbolName: 'textHaloOpacity',
            define: 'HAS_TEXT_HALO_OPACITY',
            type: Uint8Array,
            width: 1,
            evaluate: properties => {
                const radius = textHaloOpacityFn(map.getZoom(), properties);
                u8[0] = radius;
                return u8[0];
            }
        },
        {
            attrName: 'aTextDx',
            symbolName: 'textDx',
            define: 'HAS_TEXT_DX',
            type: Uint8Array,
            width: 1,
            evaluate: (properties, geometry) => {
                let x = textDxFn(map.getZoom(), properties);
                if (isFunctionDefinition(x)) {
                    x = this.evaluateInFnTypeConfig(x, geometry, map, properties);
                }
                u8[0] = x;
                return u8[0];
            }
        },
        {
            attrName: 'aTextDy',
            symbolName: 'textDy',
            define: 'HAS_TEXT_DY',
            type: Uint8Array,
            width: 1,
            evaluate: (properties, geometry) => {
                let y = textDyFn(map.getZoom(), properties);
                if (isFunctionDefinition(y)) {
                    y = this.evaluateInFnTypeConfig(y, geometry, map, properties);
                }
                u8[0] = y;
                return u8[0];
            }
        },
        {
            attrName: 'aColorOpacity',
            symbolName: 'textOpacity',
            define: 'HAS_OPACITY',
            type: Uint8Array,
            width: 1,
            evaluate: (properties, geometry) => {
                let opacity = textOpacityFn(map.getZoom(), properties);
                if (isFunctionDefinition(opacity)) {
                    opacity = this.evaluateInFnTypeConfig(opacity, geometry, map, properties);
                }
                u8[0] = opacity * 255;
                return u8[0];
            }
        },
        {
            attrName: 'aPitchAlign',
            symbolName: 'textPitchAlignment',
            type: Uint8Array,
            width: 1,
            define: 'HAS_PITCH_ALIGN',
            evaluate: properties => {
                const y = +(textPitchAlignmentFn(map.getZoom(), properties) === 'map');
                return y;
            }
        },
        {
            attrName: 'aRotationAlign',
            symbolName: 'textRotationAlignment',
            type: Uint8Array,
            width: 1,
            define: 'HAS_ROTATION_ALIGN',
            evaluate: properties => {
                const y = +(textRotationAlignmentFn(map.getZoom(), properties) === 'map');
                return y;
            }
        },
        {
            attrName: 'aRotation',
            symbolName: 'textRotation',
            type: Uint16Array,
            width: 1,
            define: 'HAS_ROTATION',
            evaluate: properties => {
                const y = wrap(textRotationFn(map.getZoom(), properties), 0, 360) * Math.PI / 180;
                u16[0] = y * 9362;
                return u16[0];
            }
        },
        {
            attrName: 'aOverlap',
            symbolName: 'textAllowOverlap',
            type: Uint8Array,
            width: 1,
            evaluate: properties => {
                let overlap = textAllowOverlapFn(map.getZoom(), properties) || 0;
                let placement = (textIgnorePlacementFn ? textIgnorePlacementFn(map.getZoom(), properties) : symbolDef['textIgnorePlacement']) || 0;
                overlap = 1 << 3 + overlap * (1 << 2);
                placement = (textIgnorePlacementFn ? 1 << 1 : 0) + placement;
                return overlap + placement;
            }
        },
        // 因为 textAllowOverlap 和 textIgnorePlacement 共用一个 aOverlap
        // 如果 textAllowOverlap 和 textIgnorePlacement 同时定义，会重复计算一次。
        // 这里稍微牺牲一些性能，保持程序逻辑的简洁
        {
            attrName: 'aOverlap',
            symbolName: 'textIgnorePlacement',
            type: Uint8Array,
            width: 1,
            evaluate: properties => {
                let overlap = (textAllowOverlapFn ? textAllowOverlapFn(map.getZoom(), properties) : symbolDef['textAllowOverlap']) || 0;
                let placement = textIgnorePlacementFn(map.getZoom(), properties) || 0;
                overlap = (textAllowOverlapFn ? 1 << 3 : 0) + overlap * (1 << 2);
                placement = 1 << 1 + placement;
                return overlap + placement;
            }
        }
    ];
}

const BOX0 = [], BOX1 = [];
const ANCHOR = [], PROJ_ANCHOR = [];

export function isLabelCollides(hasCollides, mesh, elements, boxCount, start, end, matrix/*, boxIndex*/) {
    hasCollides = hasCollides === 1 ? 1 : 0;
    const map = this.getMap();
    const geoProps = mesh.geometry.properties;
    const symbol = this.getSymbol(geoProps.symbolIndex);
    const isLinePlacement = geoProps.textPlacement === 'line' && !isIconText(symbol);
    const { aTextSize, aTextHaloRadius, aShape } = geoProps;
    let textSize = (aTextSize ? aTextSize[elements[start]] : mesh.properties.textSize);
    if (textSize === null || textSize === undefined) {
        textSize = DEFAULT_UNIFORMS['textSize'];
    }
    const haloRadius = aTextHaloRadius ? aTextHaloRadius[elements[start]] : mesh.properties.textHaloRadius;

    const anchor = getAnchor(ANCHOR, mesh, elements[start]);
    const { aProjectedAnchor } = mesh.geometry.properties;
    let projAnchor = PROJ_ANCHOR;
    const anchorIndex = elements[start] * 3;
    if (aProjectedAnchor && aProjectedAnchor[anchorIndex] !== INVALID_PROJECTED_ANCHOR) {
        PROJ_ANCHOR[0] = aProjectedAnchor[anchorIndex];
        PROJ_ANCHOR[1] = aProjectedAnchor[anchorIndex + 1];
        PROJ_ANCHOR[2] = aProjectedAnchor[anchorIndex + 2];
    } else {
        projAnchor = projectPoint(PROJ_ANCHOR, anchor, matrix, map.width, map.height);
    }


    const charCount = boxCount;
    // const boxes = [];
    const { boxes, collision } = this._getCollideBoxes(mesh, start);
    let boxIndex = 0;
    //1, 获取每个label的collision boxes
    //2, 将每个box在collision index中测试
    //   2.1 如果不冲突，则显示label
    //   2.2 如果冲突，则隐藏label
    if (!isLinePlacement && mesh.material.uniforms['rotateWithMap'] !== 1 && !symbol['textRotation']) {
        // 既没有沿线绘制，也没有随地图旋转时，文字本身也没有旋转时，只需为每行文字生成一个box即可
        // 遍历文字的aShape.y，发生变化时，说明新行开始，用第一个字的tl和最后一个字的br生成box
        let firstChrIdx = elements[start];
        let currentShapeY = aShape[firstChrIdx * 2 + 1];
        for (let i = start; i < end; i += 6) {
            const chrIdx = elements[i];
            const shapeY = aShape[chrIdx * 2 + 1];
            if (currentShapeY !== shapeY || i === end - 6) {
                const lastChrIdx = elements[(i === end - 6 ? i : i - 6)];
                const tlBox = getLabelBox.call(this, BOX0, anchor, projAnchor, mesh, textSize, haloRadius, firstChrIdx, matrix, map),
                    brBox = getLabelBox.call(this, BOX1, anchor, projAnchor, mesh, textSize, haloRadius, lastChrIdx, matrix, map);
                const box = boxes[boxIndex] = boxes[boxIndex] || [];
                boxIndex++;
                box[0] = Math.min(tlBox[0], brBox[0]);
                box[1] = Math.min(tlBox[1], brBox[1]);
                box[2] = Math.max(tlBox[2], brBox[2]);
                box[3] = Math.max(tlBox[3], brBox[3]);
                firstChrIdx = elements[i];
                currentShapeY = shapeY;
                if (!hasCollides && this.isCollides(box)) {
                    hasCollides = 1;
                }
            }
        }
    } else {
        let offscreenCount = 0;
        //insert every character's box into collision index
        for (let j = start; j < start + charCount * BOX_ELEMENT_COUNT; j += BOX_ELEMENT_COUNT) {
            //use int16array to save some memory
            const boxArr = boxes[boxIndex] = boxes[boxIndex] || [];
            boxIndex++;
            const box = getLabelBox.call(this, boxArr, anchor, projAnchor, mesh, textSize, haloRadius, elements[j], matrix, map);
            if (!hasCollides) {
                const collides = this.isCollides(box);
                if (collides === 1) {
                    hasCollides = 1;
                } else if (collides === -1) {
                    //offscreen
                    offscreenCount++;
                }
            }
        }
        if (offscreenCount === charCount) {
            //所有的文字都offscreen时，可认为存在碰撞
            hasCollides = -1;
        }
    }
    collision.collides = hasCollides;
    return collision;
}

export function getLabelEntryKey(mesh, idx) {
    const label = getLabelContent(mesh, idx);
    if (!label) {
        return null;
    }
    return getEntryKey(mesh, idx, label);
}


const ENTRY_ANCHOR = [];
const ENTRY_WORLD_POS = [];
function getEntryKey(mesh, idx, label) {
    if (!label) {
        return null;
    }
    const matrix = mesh.localTransform;
    const anchor = getAnchor(ENTRY_ANCHOR, mesh, idx);
    vec4.set(ENTRY_WORLD_POS, anchor[0], anchor[1], anchor[2], 1);
    const point = vec4.transformMat4(ENTRY_WORLD_POS, ENTRY_WORLD_POS, matrix);
    //误差容许有5个像素
    // const point = vec4.scale(ENTRY_WORLD_POS, ENTRY_WORLD_POS);
    // const posKey = Math.floor(point[0]) * Math.floor(point[1]) + (point[2] ? ('-' + Math.floor(point[2])) : '');
    let codeSum = 0;
    for (const codePoint of label) {
        codeSum += codePoint.codePointAt(0);
    }
    // if (getLabelContent(mesh, idx) === '湖北') {
    //     console.log('湖北', Math.floor(point[0]), Math.floor(point[1]), Math.floor(point[2]), codeSum);
    // }
    return [Math.floor(point[0]), Math.floor(point[1]), Math.floor(point[2]), codeSum];
}
