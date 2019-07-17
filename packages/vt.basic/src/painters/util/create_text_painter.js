import { mat4, reshader } from '@maptalks/gl';
import { setUniformFromSymbol, createColorSetter } from '../../Util';
import { prepareFnTypeData, PREFIX } from './fn_type_util';
import { interpolated } from '@maptalks/function-type';
import { GLYPH_SIZE } from '../Constant';
import Color from 'color';

const GAMMA_SCALE = 0.79;

const DEFAULT_UNIFORMS = {
    'textFill': [0, 0, 0, 1],
    'textOpacity': 1,
    'pitchWithMap': 0,
    'rotateWithMap': 0,
    'textHaloRadius': 0,
    'textHaloFill': [1, 1, 1, 1],
    'textHaloBlur': 0,
    'textHaloOpacity': 1,
    'isHalo': 0,
    'textPerspectiveRatio': 0,
    'textSize': 14,
    'textDx': 0,
    'textDy': 0,
    'textRotation': 0
};

export { DEFAULT_UNIFORMS, GAMMA_SCALE };

export function createTextMesh(regl, geometry, transform, symbol, fnTypeConfig, enableCollision) {
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
    prepareFnTypeData(geometry, geometry.properties.features, symbol.def || symbol, fnTypeConfig);
    geometry.properties.symbol = symbol;


    //避免重复创建属性数据
    if (!geometry.properties.aAnchor) {
        prepareGeometry(geometry, enableCollision);
        const { aTextSize, aTextDx, aTextDy } = geometry.data;
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
    }

    const uniforms = {
        tileResolution: geometry.properties.tileResolution,
        tileRatio: geometry.properties.tileRatio
    };
    setMeshUniforms(geometry, uniforms, symbol);

    let transparent = false;
    if (symbol['textOpacity'] < 1) {
        transparent = true;
    }

    uniforms['texture'] = glyphAtlas;
    uniforms['texSize'] = [glyphAtlas.width, glyphAtlas.height];

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
        uniforms.isHalo = 0;
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
        if (geometry.desc.positionSize === 2) {
            defines['IS_2D_POSITION'] = 1;
        }
        if (geometry.data.aTextFill) {
            defines['HAS_TEXT_FILL'] = 1;
        }
        if (geometry.data.aTextSize) {
            defines['HAS_TEXT_SIZE'] = 1;
        }
        if (geometry.data.aTextHaloFill && mesh.material.uniforms.isHalo) {
            defines['HAS_TEXT_HALO_FILL'] = 1;
        }
        if (geometry.data.aTextHaloRadius && mesh.material.uniforms.isHalo) {
            defines['HAS_TEXT_HALO_RADIUS'] = 1;
        }
        if (geometry.properties.hasTextDx) {
            defines['HAS_TEXT_DX'] = 1;
        }
        if (geometry.properties.hasTextDy) {
            defines['HAS_TEXT_DY'] = 1;
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

        if (enableCollision) {
            //非line placement时
            geometry.data.aOpacity = {
                usage: 'dynamic',
                data: new Uint8Array(aShape.length / 2)
            };
            geometry.properties.aOpacity = new Uint8Array(aShape.length / 2);
        }


    } else if (enableCollision) {
        const aOpacity = geometry.properties.aOpacity = new Uint8Array(vertexCount);
        for (let i = 0; i < aOpacity.length; i++) {
            aOpacity[i] = 0;
        }
        //非line placement时
        geometry.data.aOpacity = {
            usage: 'dynamic',
            // data: new Uint8Array(aOpacity.length)
            data: new Uint8Array(aOpacity)
        };
    }

    if (isLinePlacement || enableCollision) {
        geometry.properties.elements = geometry.elements;
        geometry.properties.elemCtor = geometry.elements.constructor;
    }
}

function setMeshUniforms(geometry, uniforms, symbol) {
    setUniformFromSymbol(uniforms, 'textOpacity', symbol, 'textOpacity');
    setUniformFromSymbol(uniforms, 'textFill', symbol, 'textFill', createColorSetter());
    setUniformFromSymbol(uniforms, 'textHaloFill', symbol, 'textHaloFill', createColorSetter());
    setUniformFromSymbol(uniforms, 'textHaloBlur', symbol, 'textHaloBlur');
    if (symbol['textHaloRadius'] && !geometry.data['aTextHaloRadius']) {
        setUniformFromSymbol(uniforms, 'textHaloRadius', symbol, 'textHaloRadius');
        uniforms.isHalo = 1;
    } else if (geometry.data['aTextHaloRadius'] && geometry.properties.hasHalo) {
        uniforms.isHalo = 1;
    }
    setUniformFromSymbol(uniforms, 'textHaloOpacity', symbol, 'textHaloOpacity');
    if (symbol['textPerspectiveRatio']) {
        uniforms.textPerspectiveRatio = symbol['textPerspectiveRatio'];
    } else if (symbol['textPlacement'] === 'line') {
        uniforms.textPerspectiveRatio = 1;
    }
    if (symbol['textRotationAlignment'] === 'map') {
        uniforms.rotateWithMap = 1;
    }
    if (symbol['textPitchAlignment'] === 'map') {
        uniforms.pitchWithMap = 1;
    }
    setUniformFromSymbol(uniforms, 'textSize', symbol, 'textSize');
    setUniformFromSymbol(uniforms, 'textDx', symbol, 'textDx');
    setUniformFromSymbol(uniforms, 'textDy', symbol, 'textDy');
    setUniformFromSymbol(uniforms, 'textRotation', symbol, 'textRotation', v => v * Math.PI / 180);
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
            enable: true,
            mask: 0xFF,
            func: {
                //halo的stencil ref更大，允许文字填充在halo上绘制
                cmp: renderer.isEnableWorkAround('win-intel-gpu-crash') ? '<' : '<=',
                ref: (context, props) => {
                    return props.isHalo + 1;
                },
                mask: 0xFF
            },
            opFront: {
                fail: 'keep',
                zfail: 'keep',
                zpass: 'replace'
            },
            opBack: {
                fail: 'keep',
                zfail: 'keep',
                zpass: 'replace'
            }
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
            func: sceneConfig.depthFunc || 'always'
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
    const textDxFn = interpolated(symbolDef['textDx']);
    const textDyFn = interpolated(symbolDef['textDy']);
    const colorCache = {};
    const u8 = new Int16Array(1);
    return [
        {
            //geometry.data 中的属性数据
            attrName: 'aTextFill',
            //symbol中的function-type属性
            symbolName: 'textFill',
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
            evaluate: properties => {
                const radius = textHaloRadiusFn(map.getZoom(), properties);
                u8[0] = radius;
                return u8[0];
            }
        },
        {
            attrName: 'aTextDx',
            symbolName: 'textDx',
            evaluate: properties => {
                const x = textDxFn(map.getZoom(), properties);
                u8[0] = x;
                return u8[0];
            }
        },
        {
            attrName: 'aTextDy',
            symbolName: 'textDy',
            evaluate: properties => {
                const y = textDyFn(map.getZoom(), properties);
                u8[0] = y;
                return u8[0];
            }
        }
    ];
}
