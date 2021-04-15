import { mat4, vec4, reshader } from '@maptalks/gl';
import { setUniformFromSymbol, createColorSetter, wrap } from '../../Util';
import { prepareFnTypeData, PREFIX } from './fn_type_util';
import { interpolated, piecewiseConstant } from '@maptalks/function-type';
import Color from 'color';
import { getAnchor, getLabelBox } from './get_label_box';
import { projectPoint } from './projection';
import { getLabelContent } from './get_label_content';

const GAMMA_SCALE = 1;

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

export function createTextMesh(regl, geometry, transform, symbol, fnTypeConfig, enableCollision, enableUniquePlacement) {
    const meshes = [];

    if (geometry.isDisposed() || geometry.data.aPosition.length === 0) {
        return meshes;
    }
    const glyphAtlas = geometry.properties.glyphAtlas;
    if (!glyphAtlas) {
        return meshes;
    }

    if (symbol['textSize'] === 0 || symbol['textOpacity'] === 0) {
        return meshes;
    }
    prepareFnTypeData(geometry, symbol.def || symbol, fnTypeConfig);
    geometry.properties.symbol = symbol;


    //避免重复创建属性数据
    if (!geometry.properties.aAnchor) {
        prepareGeometry(geometry, enableCollision || enableUniquePlacement);
        const { aTextSize, aTextDx, aTextDy, aPitchAlign, aRotationAlign, aRotation } = geometry.data;
        if (aTextSize) {
            //for collision
            geometry.properties.aTextSize = geometry.properties[PREFIX + 'aTextSize'] || new aTextSize.constructor(aTextSize);
        }
        if (aTextDx) {
            //for collision
            geometry.properties.aTextDx = geometry.properties[PREFIX + 'aTextDx'] || new aTextDx.constructor(aTextDx);
        }
        if (aTextDy) {
            //for collision
            geometry.properties.aTextDy = geometry.properties[PREFIX + 'aTextDy'] || new aTextDy.constructor(aTextDy);
        }
        if (aPitchAlign) {
            //for collision
            geometry.properties.aPitchAlign = geometry.properties[PREFIX + 'aPitchAlign'] || new aPitchAlign.constructor(aPitchAlign);
        }
        if (aRotationAlign) {
            //for collision
            geometry.properties.aRotationAlign = geometry.properties[PREFIX + 'aRotationAlign'] || new aRotationAlign.constructor(aRotationAlign);
        }
        if (aRotation) {
            //for collision
            geometry.properties.aRotation = geometry.properties[PREFIX + 'aRotation'] || new aRotation.constructor(aRotation);
        }
    }

    const glyphTexture = this.createAtlasTexture(glyphAtlas, false);
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
    geometry.generateBuffers(regl);
    const material = new reshader.Material(uniforms, DEFAULT_UNIFORMS);
    const mesh = new reshader.Mesh(geometry, material, {
        transparent,
        castShadow: false,
        picking: true
    });
    mesh.setLocalTransform(transform);
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
        const uniforms = {
            flipY: 0,
            tileResolution: geometry.properties.tileResolution,
            tileRatio: geometry.properties.tileRatio,
            texture: glyphTexture,
            texSize: [glyphAtlas.width, glyphAtlas.height],
            isHalo: 0
        };
        setMeshUniforms(geometry, uniforms, symbol);
        const material = new reshader.Material(uniforms, DEFAULT_UNIFORMS);
        const mesh = new reshader.Mesh(geometry, material, {
            transparent,
            castShadow: false,
            picking: true
        });
        if (enableCollision) {
            mesh.setDefines({
                'ENABLE_COLLISION': 1
            });
        }
        mesh.setLocalTransform(transform);
        meshes.push(mesh);
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
        mesh.setDefines(defines);
    });

    return meshes;
}

function prepareGeometry(geometry, enableCollision) {
    const { symbol } = geometry.properties;
    const isLinePlacement = symbol['textPlacement'] === 'line' && !symbol['isIconText'];
    const { aPosition, aShape } = geometry.data;
    const vertexCount = aPosition.length / geometry.desc.positionSize;
    geometry.properties.aPickingId = geometry.data.aPickingId;
    geometry.properties.aCount = geometry.data.aCount;
    delete geometry.data.aCount;

    if ((enableCollision || isLinePlacement)) {
        geometry.properties.aAnchor = aPosition;
        geometry.properties.aShape = aShape;
    }

    if (isLinePlacement) {
        const { aVertical, aSegment, aGlyphOffset } = geometry.data;
        geometry.properties.aGlyphOffset = aGlyphOffset;
        geometry.properties.aSegment = aSegment;
        geometry.properties.aVertical = aVertical;

        delete geometry.data.aSegment;
        delete geometry.data.aVertical;
        delete geometry.data.aGlyphOffset;

        geometry.data.aOffset = {
            usage: 'dynamic',
            data: new Int16Array(aShape.length)
        };
        geometry.properties.aOffset = new Int16Array(aShape.length);
    }

    if (enableCollision) {
        geometry.data.aOpacity = {
            usage: 'dynamic',
            data: new Uint8Array(vertexCount)
        };
        geometry.properties.aOpacity = new Uint8Array(vertexCount);

        const { aTextHaloRadius } = geometry.data;
        if (aTextHaloRadius && !geometry.properties.aTextHaloRadius) {
            geometry.properties.aTextHaloRadius = geometry.properties[PREFIX + 'aTextHaloRadius'] || new aTextHaloRadius.constructor(aTextHaloRadius);
        }
    }

    if (isLinePlacement || enableCollision) {
        geometry.properties.elements = geometry.elements;
        geometry.properties.elemCtor = geometry.elements.constructor;
    }
}

function setMeshUniforms(geometry, uniforms, symbol) {
    if (uniforms['isHalo'] === undefined) {
        setUniformFromSymbol(uniforms, 'isHalo', symbol, 'textHaloRadius', 0, v => {
            return +(v > 0 && !geometry.data['aTextHaloRadius'] || geometry.data['aTextHaloRadius'] && geometry.properties.hasHalo);
        });
    }
    setUniformFromSymbol(uniforms, 'textOpacity', symbol, 'textOpacity', DEFAULT_UNIFORMS['textOpacity']);
    setUniformFromSymbol(uniforms, 'textFill', symbol, 'textFill', DEFAULT_UNIFORMS['textFill'], createColorSetter());
    setUniformFromSymbol(uniforms, 'textHaloFill', symbol, 'textHaloFill', DEFAULT_UNIFORMS['textHaloFill'], createColorSetter());
    setUniformFromSymbol(uniforms, 'textHaloBlur', symbol, 'textHaloBlur', DEFAULT_UNIFORMS['textHaloBlur']);
    setUniformFromSymbol(uniforms, 'textHaloRadius', symbol, 'textHaloRadius', DEFAULT_UNIFORMS['textHaloRadius']);
    setUniformFromSymbol(uniforms, 'textHaloOpacity', symbol, 'textHaloOpacity', DEFAULT_UNIFORMS['textHaloOpacity']);
    setUniformFromSymbol(uniforms, 'textPerspectiveRatio', symbol, 'textPerspectiveRatio', DEFAULT_UNIFORMS['textPerspectiveRatio'], v => {
        return symbol['textPlacement'] === 'line' ? 1 : v;
    });
    setUniformFromSymbol(uniforms, 'rotateWithMap', symbol, 'textRotationAlignment', DEFAULT_UNIFORMS['textRotationAlignment'], v => +(v === 'map'));
    setUniformFromSymbol(uniforms, 'pitchWithMap', symbol, 'textPitchAlignment', DEFAULT_UNIFORMS['textPitchAlignment'], v => +(v === 'map'));
    setUniformFromSymbol(uniforms, 'textSize', symbol, 'textSize', DEFAULT_UNIFORMS['textSize']);
    setUniformFromSymbol(uniforms, 'textDx', symbol, 'textDx', DEFAULT_UNIFORMS['textDx']);
    setUniformFromSymbol(uniforms, 'textDy', symbol, 'textDy', DEFAULT_UNIFORMS['textDy']);
    setUniformFromSymbol(uniforms, 'textRotation', symbol, 'textRotation', DEFAULT_UNIFORMS['textRotation'], v => v * Math.PI / 180);
}

export function createTextShader(layer, sceneConfig) {
    const renderer = layer.getRenderer();
    const canvas = renderer.canvas;
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

    const uniforms = [
        'flipY',
        'textSize',
        'textDx',
        'textDy',
        'textRotation',
        'cameraToCenterDistance',
        {
            name: 'projViewModelMatrix',
            type: 'function',
            fn: function (context, props) {
                return mat4.multiply([], props['projViewMatrix'], props['modelMatrix']);
            }
        },
        'textPerspectiveRatio',
        'texSize',
        'canvasSize',
        'glyphSize',
        'pitchWithMap',
        'mapPitch',
        'texture',
        'gammaScale',
        'textFill',
        'textOpacity',
        'textHaloRadius',
        'textHaloFill',
        'textHaloBlur',
        'textHaloOpacity',
        'isHalo',
        {
            name: 'zoomScale',
            type: 'function',
            fn: function (context, props) {
                return props['tileResolution'] / props['resolution'];
            }
        },
        'rotateWithMap',
        'mapRotation',
        'tileRatio'
    ];

    const extraCommandProps = {
        viewport,
        stencil: { //fix #94, intel显卡的崩溃和blending关系比较大，开启stencil来避免blending
            enable: false,
            mask: 0xFF,
            func: {
                //halo的stencil ref更大，允许文字填充在halo上绘制
                cmp: '<', //renderer.isEnableWorkAround('win-intel-gpu-crash') ? '<' : '<=',
                ref: (context, props) => {
                    //level * 2 以避免相邻level的halo和非halo产生相同的ref
                    return props.level * 2 + (props.isHalo || 0) + 1;
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
            evaluate: properties => {
                let color = textFillFn(map.getZoom(), properties);
                if (!Array.isArray(color)) {
                    color = colorCache[color] = colorCache[color] || Color(color).array();
                }
                if (color.length === 3) {
                    color.push(255);
                }
                return color;
            }
        },
        {
            attrName: 'aTextSize',
            symbolName: 'textSize',
            define: 'HAS_TEXT_SIZE',
            type: Uint8Array,
            width: 1,
            evaluate: properties => {
                const size = textSizeFn(map.getZoom(), properties);
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
                    color = colorCache[color] = colorCache[color] || Color(color).array();
                }
                if (color.length === 3) {
                    color.push(255);
                }
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
            evaluate: properties => {
                const x = textDxFn(map.getZoom(), properties);
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
            evaluate: properties => {
                const y = textDyFn(map.getZoom(), properties);
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
            evaluate: properties => {
                const y = textOpacityFn(map.getZoom(), properties);
                u8[0] = y * 255;
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
    ];
}

const BOX0 = [], BOX1 = [];
const ANCHOR = [], PROJ_ANCHOR = [];

export function isLabelCollides(hasCollides, mesh, elements, boxCount, start, end, matrix/*, boxIndex*/) {
    hasCollides = hasCollides === 1 ? 1 : 0;
    const map = this.getMap();
    const geoProps = mesh.geometry.properties;
    const symbol = geoProps.symbol;
    const isLinePlacement = symbol['textPlacement'] === 'line' && !symbol['isIconText'];
    const { aTextSize, aTextHaloRadius, aShape } = geoProps;
    const textSize = aTextSize ? aTextSize[elements[start]] : mesh.properties.textSize;
    const haloRadius = aTextHaloRadius ? aTextHaloRadius[elements[start]] : mesh.properties.textHaloRadius;

    const anchor = getAnchor(ANCHOR, mesh, elements[start]);
    const projAnchor = projectPoint(PROJ_ANCHOR, anchor, matrix, map.width, map.height);

    const charCount = boxCount;
    const boxes = [];
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
                const tlBox = getLabelBox(BOX0, anchor, projAnchor, mesh, textSize, haloRadius, firstChrIdx, matrix, map),
                    brBox = getLabelBox(BOX1, anchor, projAnchor, mesh, textSize, haloRadius, lastChrIdx, matrix, map);
                const box = [];
                box[0] = Math.min(tlBox[0], brBox[0]);
                box[1] = Math.min(tlBox[1], brBox[1]);
                box[2] = Math.max(tlBox[2], brBox[2]);
                box[3] = Math.max(tlBox[3], brBox[3]);
                boxes.push(box);
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
        for (let j = start; j < start + charCount * 6; j += 6) {
            //use int16array to save some memory
            const box = getLabelBox([], anchor, projAnchor, mesh, textSize, haloRadius, elements[j], matrix, map);
            boxes.push(box);
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
    return {
        collides: hasCollides,
        boxes
    };
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
    for (let i = 0; i < label.length; i++) {
        codeSum += label.charCodeAt(i);
    }
    // if (getLabelContent(mesh, idx) === '湖北') {
    //     console.log('湖北', Math.floor(point[0]), Math.floor(point[1]), Math.floor(point[2]), codeSum);
    // }
    return [Math.floor(point[0]), Math.floor(point[1]), Math.floor(point[2]), codeSum];
}
