import CollisionPainter from './CollisionPainter';
import { reshader } from '@maptalks/gl';
import { mat4 } from '@maptalks/gl';
import vert from './glsl/marker.vert';
import frag from './glsl/marker.frag';
import pickingVert from './glsl/marker.picking.vert';
import { getIconBox } from './util/get_icon_box';
import { getAnchor, getLabelBox } from './util/get_label_box';
import { projectPoint } from './util/projection';
import { setUniformFromSymbol, isNil, fillArray } from '../Util';
import { createTextMesh, createTextShader, DEFAULT_UNIFORMS, GAMMA_SCALE, getTextFnTypeConfig } from './util/create_text_painter';

import textVert from './glsl/text.vert';
import textFrag from './glsl/text.frag';
import textPickingVert from './glsl/text.picking.vert';
import { prepareFnTypeData, updateGeometryFnTypeAttrib, PREFIX } from './util/fn_type_util';
import { interpolated, isFunctionDefinition } from '@maptalks/function-type';
import { DEFAULT_MARKER_WIDTH, DEFAULT_MARKER_HEIGHT, GLYPH_SIZE } from './Constant';

const BOX_ELEMENT_COUNT = 6;
const BOX_VERTEX_COUNT = 4; //每个box有四个顶点数据

const ICON_FILTER = mesh => {
    return mesh.uniforms['level'] === 0 && !!mesh.geometry.properties.iconAtlas;
};

const ICON_FILTER_N = mesh => {
    return mesh.uniforms['level'] > 0 && !!mesh.geometry.properties.iconAtlas;
};

const TEXT_FILTER = mesh => {
    return mesh.uniforms['level'] === 0 && !!mesh.geometry.properties.glyphAtlas;
};

const TEXT_FILTER_N = mesh => {
    return mesh.uniforms['level'] > 0 && !!mesh.geometry.properties.glyphAtlas;
};

const defaultUniforms = {
    'markerOpacity': 1,
    'pitchWithMap': 0,
    'markerPerspectiveRatio': 0,
    'rotateWithMap': 0,
    'markerWidth': DEFAULT_MARKER_WIDTH,
    'markerHeight': DEFAULT_MARKER_HEIGHT,
    'markerDx': 0,
    'markerDy': 0,
    'markerRotation': 0
};

//temparary variables
const PROJ_MATRIX = [];
const U8 = new Uint16Array(1);
const ANCHOR = [], PROJ_ANCHOR = [];

class IconPainter extends CollisionPainter {
    constructor(regl, layer, sceneConfig, pluginIndex) {
        super(regl, layer, sceneConfig, pluginIndex);

        this.propAllowOverlap = 'markerAllowOverlap';
        this.propIgnorePlacement = 'markerIgnorePlacement';
        this._textFnTypeConfig = getTextFnTypeConfig(this.getMap(), this.symbolDef);
        this._iconFnTypeConfig = this._getIconFnTypeConfig();
    }

    _getIconFnTypeConfig() {
        const map = this.getMap();
        const symbolDef = this.symbolDef;
        const markerWidthFn = interpolated(symbolDef['markerWidth']);
        const markerHeightFn = interpolated(symbolDef['markerHeight']);
        const markerDxFn = interpolated(symbolDef['markerDx']);
        const markerDyFn = interpolated(symbolDef['markerDy']);
        let markerTextFitFn;
        const markerTextFit = symbolDef['markerTextFit'];
        if (isFunctionDefinition(markerTextFit)) {
            markerTextFitFn = interpolated(markerTextFit);
        }
        const u8 = new Int16Array(1);
        return [
            {
                attrName: 'aMarkerWidth',
                symbolName: 'markerWidth',
                evaluate: (properties, value) => {
                    //如果是markerTextFit，aMarkerWidth已经更新过了，直接返回原值
                    const textFit = markerTextFitFn ? markerTextFitFn(map.getZoom(), properties) : markerTextFit;
                    if (textFit === 'both' || textFit === 'width') {
                        return value;
                    }
                    const x = markerWidthFn(map.getZoom(), properties);
                    u8[0] = x;
                    return u8[0];
                }
            },
            {
                attrName: 'aMarkerHeight',
                symbolName: 'markerHeight',
                evaluate: (properties, value) => {
                    const textFit = markerTextFitFn ? markerTextFitFn(map.getZoom(), properties) : markerTextFit;
                    if (textFit === 'both' || textFit === 'height') {
                        return value;
                    }
                    const x = markerHeightFn(map.getZoom(), properties);
                    u8[0] = x;
                    return u8[0];
                }
            },
            {
                attrName: 'aMarkerDx',
                symbolName: 'markerDx',
                evaluate: properties => {
                    const x = markerDxFn(map.getZoom(), properties);
                    u8[0] = x;
                    return u8[0];
                }
            },
            {
                attrName: 'aMarkerDy',
                symbolName: 'markerDy',
                evaluate: properties => {
                    const y = markerDyFn(map.getZoom(), properties);
                    u8[0] = y;
                    return u8[0];
                }
            },
        ];
    }

    createGeometry(glData, features) {
        if (!glData || !glData.length) {
            return [];
        }
        const geometries = glData.sort(sorting).map(data => super.createGeometry(data, features));
        const iconGeometry = geometries[0];
        this._prepareIconGeometry(iconGeometry);
        const textGeometry = geometries[1];
        if (textGeometry) {
            const labelIndex = buildLabelIndex(iconGeometry, textGeometry, this.symbolDef['markerTextFit']);
            if (!iconGeometry.getElements().length) {
                return [];
            }
            iconGeometry.properties.labelIndex = labelIndex;
            if (this.symbolDef['markerTextFit'] && this.symbolDef['markerTextFit'] !== 'none') {
                const labelShape = buildLabelShape(iconGeometry, textGeometry);
                if (labelShape.length) {
                    iconGeometry.properties.labelShape = labelShape;
                    this._prepareTextFit(iconGeometry, textGeometry);
                }
            }
        }
        return geometries;
    }

    _prepareIconGeometry(iconGeometry) {
        prepareFnTypeData(iconGeometry, iconGeometry.properties.features, this.symbolDef, this._iconFnTypeConfig);
        const hasMarkerTextFit = this.symbolDef['markerTextFit'] && this.symbolDef['markerTextFit'] !== 'none';
        if (hasMarkerTextFit) {
            if (iconGeometry.data.aMarkerWidth) {
                iconGeometry.data.aMarkerWidth = new Uint16Array(iconGeometry.data.aMarkerWidth);
            }
            if (iconGeometry.data.aMarkerHeight) {
                iconGeometry.data.aMarkerHeight = new Uint16Array(iconGeometry.data.aMarkerHeight);
            }
        }
        const { aMarkerWidth, aMarkerHeight, aMarkerDx, aMarkerDy } = iconGeometry.data;
        if (aMarkerWidth) {
            //for collision
            iconGeometry.properties.aMarkerWidth = iconGeometry.properties[PREFIX + 'aMarkerWidth'] || new aMarkerWidth.constructor(aMarkerWidth);
        }
        if (aMarkerHeight) {
            //for collision
            iconGeometry.properties.aMarkerHeight = iconGeometry.properties[PREFIX + 'aMarkerHeight'] || new aMarkerHeight.constructor(aMarkerHeight);
        }
        if (aMarkerDx) {
            //for collision
            iconGeometry.properties.aMarkerDx = iconGeometry.properties[PREFIX + 'aMarkerDx'] || new aMarkerDx.constructor(aMarkerDx);
        }
        if (aMarkerDy) {
            //for collision
            iconGeometry.properties.aMarkerDy = iconGeometry.properties[PREFIX + 'aMarkerDy'] || new aMarkerDy.constructor(aMarkerDy);
        }
    }

    createMesh(geometries, transform) {
        const meshes = [];
        let iconMesh, textMesh;
        for (let i = 0; i < geometries.length; i++) {
            const geometry = geometries[i];
            if (geometry.properties.iconAtlas) {
                const mesh = iconMesh = this._createIconMesh(geometries[i], transform);
                if (mesh) meshes.push(mesh);
            } else if (geometry.properties.glyphAtlas) {
                const enableCollision = this.layer.options['collision'] && this.sceneConfig['collision'] !== false;
                const symbol = this.getSymbol();
                this.symbolDef['isIconText'] = symbol['isIconText'] = true;
                const mesh = textMesh = createTextMesh(this.regl, geometry, transform, symbol, this._textFnTypeConfig, enableCollision);
                if (mesh.length) meshes.push(...mesh);
            }
        }
        if (iconMesh && textMesh && textMesh.length) {
            iconMesh._textMesh = textMesh[0];
        }
        return meshes;
    }

    _createIconMesh(geometry, transform) {
        const enableCollision = this.layer.options['collision'] && this.sceneConfig['collision'] !== false;
        if (geometry.isDisposed() || geometry.data.aPosition.length === 0) {
            return null;
        }
        const iconAtlas = geometry.properties.iconAtlas;
        if (!iconAtlas) {
            return null;
        }
        const symbol = this.getSymbol();
        geometry.properties.symbol = symbol;
        const uniforms = {
            tileResolution: geometry.properties.tileResolution,
            tileRatio: geometry.properties.tileRatio
        };

        //!geometry.properties.aAnchor 以避免重复创建collision数据
        if (enableCollision && !geometry.properties.aAnchor) {
            const { aPosition, aShape } = geometry.data;
            const vertexCount = geometry.data.aPosition.length / geometry.desc.positionSize;
            //initialize opacity array
            //aOpacity用于fading透明度的调整
            const aOpacity = new Uint8Array(vertexCount);
            for (let i = 0; i < aOpacity.length; i++) {
                aOpacity[i] = 0;
            }
            geometry.data.aOpacity = {
                usage: 'dynamic',
                data: aOpacity
            };
            geometry.properties.aOpacity = new Uint8Array(vertexCount);

            geometry.properties.aAnchor = aPosition;
            geometry.properties.aShape = aShape;
            //保存elements，隐藏icon时，从elements中删除icon的索引数据
            geometry.properties.elements = geometry.elements;
            geometry.properties.elemCtor = geometry.elements.constructor;
        }

        if (symbol['markerPitchAlignment'] === 'map') {
            uniforms['pitchWithMap'] = 1;
        }

        if (symbol['markerRotationAlignment'] === 'map') {
            uniforms['rotateWithMap'] = 1;
        }

        setUniformFromSymbol(uniforms, 'markerOpacity', symbol, 'markerOpacity');
        setUniformFromSymbol(uniforms, 'markerPerspectiveRatio', symbol, 'markerPerspectiveRatio');
        setUniformFromSymbol(uniforms, 'markerWidth', symbol, 'markerWidth');
        setUniformFromSymbol(uniforms, 'markerHeight', symbol, 'markerHeight');
        setUniformFromSymbol(uniforms, 'markerDx', symbol, 'markerDx');
        setUniformFromSymbol(uniforms, 'markerDy', symbol, 'markerDy');
        setUniformFromSymbol(uniforms, 'markerRotation', symbol, 'markerRotation', v => v * Math.PI / 180);

        uniforms['texture'] = iconAtlas;
        uniforms['texSize'] = [iconAtlas.width, iconAtlas.height];
        geometry.generateBuffers(this.regl);
        const material = new reshader.Material(uniforms, defaultUniforms);
        const mesh = new reshader.Mesh(geometry, material, {
            transparent: true,
            castShadow: false,
            picking: true
        });
        const defines = {};
        if (enableCollision) {
            defines['ENABLE_COLLISION'] = 1;
        }
        if (geometry.desc.positionSize === 2) {
            defines['IS_2D_POSITION'] = 1;
        }
        if (geometry.data.aMarkerWidth) {
            defines['HAS_MARKER_WIDTH'] = 1;
        }
        if (geometry.data.aMarkerHeight) {
            defines['HAS_MARKER_HEIGHT'] = 1;
        }
        if (geometry.properties.hasMarkerDx) {
            defines['HAS_MARKER_DX'] = 1;
        }
        if (geometry.properties.hasMarkerDy) {
            defines['HAS_MARKER_DY'] = 1;
        }
        mesh.setDefines(defines);
        mesh.setLocalTransform(transform);
        return mesh;
    }

    preparePaint(context) {
        super.preparePaint(context);

        const meshes = this.scene.getMeshes();
        if (!meshes || !meshes.length) {
            return;
        }
        for (let i = 0; i < meshes.length; i++) {
            const geometry = meshes[i].geometry;
            const { aMarkerWidth, aMarkerHeight } = geometry.properties;
            if (aMarkerWidth || aMarkerHeight) {
                this._updateMarkerFitSize(geometry);
            }
        }
        updateGeometryFnTypeAttrib(this._textFnTypeConfig, meshes);
        updateGeometryFnTypeAttrib(this._iconFnTypeConfig, meshes);

        for (let i = 0; i < meshes.length; i++) {
            const geometry = meshes[i].geometry;
            const { aMarkerWidth, aMarkerHeight } = geometry.properties;
            if (aMarkerWidth && aMarkerWidth.dirty) {
                geometry.updateData('aMarkerWidth', aMarkerWidth);
                aMarkerWidth.dirty = false;
            }
            if (aMarkerHeight && aMarkerHeight.dirty) {
                geometry.updateData('aMarkerHeight', aMarkerHeight);
                aMarkerHeight.dirty = false;
            }
        }

        this._updateIconCollision(context.timestamp);

    }

    callCurrentTileShader(uniforms) {
        this.shader.filter = ICON_FILTER;
        this.renderer.render(this.shader, uniforms, this.scene);

        this._textShader.filter = TEXT_FILTER;
        this.renderer.render(this._textShader, uniforms, this.scene);
    }

    callBackgroundTileShader(uniforms) {
        this.shader.filter = ICON_FILTER_N;
        this.renderer.render(this.shader, uniforms, this.scene);

        this._textShader.filter = TEXT_FILTER_N;
        this.renderer.render(this._textShader, uniforms, this.scene);
    }


    /**
     * 遍历每个icon，判断其是否有碰撞， 如果有，则删除其elements
     * @param {Number} timestamp
     */
    _updateIconCollision(/* timestamp */) {
        const enableCollision = this.layer.options['collision'] && this.sceneConfig['collision'] !== false;
        if (!enableCollision) {
            return;
        }
        let meshes = this.scene.getMeshes().filter(mesh => !!mesh.geometry.properties.iconAtlas);
        if (!meshes || !meshes.length) {
            return;
        }

        this._updateIconAndText(meshes);
    }

    _updateIconAndText(meshes) {
        const fn = (textElements, iconElements, textVisibleElements, iconVisibleElements, iconMesh, textMesh, start, end, mvpMatrix, iconIndex) => {
            // const labelIndex = iconMesh.geometry.properties.labelIndex[iconIndex];
            // if (labelIndex[0] !== -1) {
            //     const idx = textElements[labelIndex[0]];
            //     const pickingId = textMesh.geometry.properties.aPickingId[idx];
            //     const feature = textMesh.geometry.properties.features[pickingId];
            //     if (feature && feature.feature.properties.name === '中一路隧道') {
            //         debugger
            //     }
            // }
            //icon的element值，是text的element值处于text的char count
            const visible = this.updateBoxCollisionFading(iconMesh, iconElements, 1, start, end, mvpMatrix, iconIndex);

            if (visible) {
                if (textMesh) {
                    const labelIndex = iconMesh.geometry.properties.labelIndex[iconIndex];
                    if (labelIndex[0] !== -1) {
                        const [textStart, textEnd] = labelIndex;
                        for (let i = textStart; i < textEnd; i++) {
                            textVisibleElements.push(textElements[i]);
                        }
                    }
                }
                for (let i = start; i < end; i++) {
                    iconVisibleElements.push(iconElements[i]);
                }
            }
        };
        for (let m = 0; m < meshes.length; m++) {
            const iconMesh = meshes[m];
            if (!iconMesh) {
                continue;
            }
            const textMesh = iconMesh._textMesh;
            const meshKey = iconMesh.properties.meshKey;
            this.startMeshCollision(meshKey);
            let textGeometry, textElements, textVisibleElements;
            if (textMesh) {
                const symbol = textMesh.geometry.properties.symbol;
                textMesh.properties.textSize = !isNil(symbol['textSize']) ? symbol['textSize'] : DEFAULT_UNIFORMS['textSize'];
                textGeometry = textMesh.geometry;
                textElements = textGeometry.properties.elements;
                textVisibleElements = [];
            }

            const iconGeometry = iconMesh.geometry;
            const iconElements = iconGeometry.properties.elements;
            const iconVisibleElements = [];

            this._forEachIcon(iconMesh, iconElements, (mesh, start, end, mvpMatrix, index) => {
                fn(textElements, iconElements, textVisibleElements, iconVisibleElements, iconMesh, textMesh, start, end, mvpMatrix, index);
            });

            iconGeometry.setElements(new iconGeometry.properties.elemCtor(iconVisibleElements));
            const iconOpacity = iconGeometry.properties.aOpacity;
            if (iconOpacity && iconOpacity.dirty) {
                iconGeometry.updateData('aOpacity', iconOpacity);
                iconOpacity.dirty = false;
            }
            if (textGeometry) {
                textGeometry.setElements(new textGeometry.properties.elemCtor(textVisibleElements));
                const textOpacity = textGeometry.properties.aOpacity;
                if (textOpacity && textOpacity.dirty) {
                    textGeometry.updateData('aOpacity', textOpacity);
                    textOpacity.dirty = false;
                }
            }
            this.endMeshCollision(meshKey);
        }
    }

    setCollisionOpacity(mesh, allElements, aOpacity, value, start, end, boxIndex) {
        super.setCollisionOpacity(mesh, allElements, aOpacity, value, start, end, boxIndex);
        const textMesh = mesh._textMesh;
        if (textMesh) {
            //icon and text
            const textElements = textMesh.geometry.properties.elements;
            aOpacity = textMesh.geometry.properties.aOpacity;
            const [textStart, textEnd] = mesh.geometry.properties.labelIndex[boxIndex];
            if (textStart !== -1) {
                super.setCollisionOpacity(textMesh, textElements, aOpacity, value, textStart, textEnd, boxIndex);
            }
        }
    }

    _forEachIcon(mesh, elements, fn) {
        const map = this.getMap();
        const matrix = mat4.multiply(PROJ_MATRIX, map.projViewMatrix, mesh.localTransform);
        let index = 0;
        for (let i = 0; i < elements.length; i += BOX_ELEMENT_COUNT) {
            fn.call(this, mesh, i, i + BOX_ELEMENT_COUNT, matrix, index++);
        }
    }

    isBoxCollides(mesh, elements, boxCount, start, end, matrix, boxIndex) {
        const map = this.getMap();
        const debugCollision = this.layer.options['debugCollision'];
        const textMesh = mesh._textMesh;

        const z = mesh.geometry.properties.z;
        const boxes = [];
        let offscreenCount = 0;

        let hasCollides = false;
        const isFading = this.isBoxFading(mesh.properties.meshKey, boxIndex);

        // debugger
        //icon and text
        const firstBoxIdx = elements[start];
        const iconBox = getIconBox([], mesh, firstBoxIdx, matrix, map);
        boxes.push(iconBox);
        const collides = this.isCollides(iconBox, z);
        if (collides === 1) {
            hasCollides = true;
            if (!isFading && !debugCollision) {
                return {
                    collides: true,
                    boxes
                };
            }
        } else if (collides === -1) {
            //offscreen
            offscreenCount++;
        }
        if (!textMesh) {
            if (offscreenCount === 1) {
                hasCollides = true;
            }
            return {
                collides: hasCollides,
                boxes
            };
        }

        const labelIndex = mesh.geometry.properties.labelIndex[boxIndex];
        const [textStart, textEnd] = labelIndex;
        if (textStart === -1) {
            if (offscreenCount === 1) {
                hasCollides = true;
            }
            return {
                collides: hasCollides,
                boxes
            };
        }
        const textElements = textMesh.geometry.properties.elements;
        const idx = textElements[textStart];
        const charCount = (textEnd - textStart) / BOX_ELEMENT_COUNT;
        const textSize = textMesh.properties.textSize;

        const anchor = getAnchor(ANCHOR, textMesh, idx);
        const projAnchor = projectPoint(PROJ_ANCHOR, anchor, matrix, map.width, map.height);
        //insert every character's box into collision index
        for (let j = textStart; j < textEnd; j += 6) {
            //use int16array to save some memory
            const box = getLabelBox([], anchor, projAnchor, textMesh, textSize, textElements[j], matrix, map);
            boxes.push(box);
            const collides = this.isCollides(box, z);
            if (collides === 1) {
                hasCollides = true;
                if (!isFading && !debugCollision) {
                    return {
                        collides: true,
                        boxes
                    };
                }
            } else if (collides === -1) {
                //offscreen
                offscreenCount++;
            }
        }
        if (offscreenCount === charCount + 1) {
            //所有的文字都offscreen时，可认为存在碰撞
            hasCollides = true;
        }


        return {
            collides: hasCollides,
            boxes
        };
    }

    deleteMesh(meshes, keepGeometry) {
        if (!meshes) {
            return;
        }
        if (keepGeometry) {
            //keepGeometry时，文字纹理应该保留
            if (Array.isArray(meshes)) {
                meshes.forEach(m => {
                    if (m && m.material) {
                        delete m.material.uniforms.texture;
                    }
                });
            } else if (meshes.material) {
                delete meshes.material.uniforms.texture;
            }
        }
        super.deleteMesh(meshes, keepGeometry);
    }

    init() {
        const regl = this.regl;
        const canvas = this.canvas;

        this.renderer = new reshader.Renderer(regl);

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

        this.shader = new reshader.MeshShader({
            vert, frag,
            uniforms: [
                'markerWidth',
                'markerHeight',
                'markerDx',
                'markerDy',
                'markerRotation',
                'cameraToCenterDistance',
                {
                    name: 'projViewModelMatrix',
                    type: 'function',
                    fn: function (context, props) {
                        return mat4.multiply([], props['projViewMatrix'], props['modelMatrix']);
                    }
                },
                'texSize',
                'canvasSize',
                'iconSize',
                'pitchWithMap',
                'mapPitch',
                'markerPerspectiveRatio',
                'texture',
                'rotateWithMap',
                'mapRotation',
                'tileRatio',
                {
                    name: 'zoomScale',
                    type: 'function',
                    fn: function (context, props) {
                        return props['tileResolution'] / props['resolution'];
                    }
                }
            ],
            extraCommandProps: {
                viewport,
                blend: {
                    enable: true,
                    func: {
                        src: 'src alpha',
                        // srcAlpha: 1,
                        dst: 'one minus src alpha',
                        // dstAlpha: 1
                    },
                    equation: 'add',
                    // color: [0, 0, 0, 0]
                },
                depth: {
                    enable: true,
                    range: this.sceneConfig.depthRange || [0, 1],
                    func: this.sceneConfig.depthFunc || 'always'
                },
            }
        });

        const { uniforms, extraCommandProps } = createTextShader(this.layer, this.sceneConfig);
        //icon的text在intel gpu下不会引起崩溃，可以关闭模板
        extraCommandProps.stencil.enable = false;

        this._textShader = new reshader.MeshShader({
            vert: textVert, frag: textFrag,
            uniforms,
            extraCommandProps
        });

        if (this.pickingFBO) {
            this.picking = new reshader.FBORayPicking(
                this.renderer,
                {
                    vert: pickingVert,
                    uniforms: [
                        'markerWidth',
                        'markerHeight',
                        'markerDx',
                        'markerDy',
                        'markerRotation',
                        'cameraToCenterDistance',
                        {
                            name: 'projViewModelMatrix',
                            type: 'function',
                            fn: function (context, props) {
                                return mat4.multiply([], props['projViewMatrix'], props['modelMatrix']);
                            }
                        },
                        'canvasSize',
                        'iconSize',
                        'pitchWithMap',
                        'mapPitch',
                        'markerPerspectiveRatio',
                        'rotateWithMap',
                        'mapRotation',
                        'tileRatio',
                        {
                            name: 'zoomScale',
                            type: 'function',
                            fn: function (context, props) {
                                return props['tileResolution'] / props['resolution'];
                            }
                        }
                    ]
                },
                this.pickingFBO
            );
            this.picking.filter = mesh => {
                return !!mesh.geometry.properties.iconAtlas;
            };

            this._textPicking = new reshader.FBORayPicking(
                this.renderer,
                {
                    vert: textPickingVert,
                    uniforms
                },
                this.pickingFBO
            );
            this._textPicking.filter = mesh => {
                return !!mesh.geometry.properties.glyphAtlas;
            };
            //TODO pick(x,y)方法实现text的identify
        }
    }

    getUniformValues(map) {
        const projViewMatrix = map.projViewMatrix,
            cameraToCenterDistance = map.cameraToCenterDistance,
            canvasSize = [this.canvas.width, this.canvas.height];
        return {
            mapPitch: map.getPitch() * Math.PI / 180,
            mapRotation: map.getBearing() * Math.PI / 180,
            projViewMatrix,
            cameraToCenterDistance,
            canvasSize,
            iconSize: [24, 24],
            resolution: map.getResolution(),

            //text uniforms
            glyphSize: GLYPH_SIZE,
            // gammaScale : 0.64,
            gammaScale: GAMMA_SCALE,
        };
    }

    _prepareTextFit(iconGeometry) {
        //1. markerTextFit 是否是 fn-type，如果是，则遍历features创建 fitIcons, fitWidthIcons, fitHeightIcons
        //2. 检查data中是否存在aMarkerWidth或aMarkerHeight，如果没有则添加
        //3. 如果textSize是zoomConstant，说明 markerWidth和markerHeight是静态的，提前计算，未来无需再更新
        const symbolDef = this.symbolDef;
        const markerTextFit = this.symbolDef['markerTextFit'];
        const props = iconGeometry.properties;
        let hasWidth = markerTextFit === 'both' || markerTextFit === 'width';
        let hasHeight = markerTextFit === 'both' || markerTextFit === 'height';

        if (isFunctionDefinition(symbolDef['markerTextFit'])) {
            const markerTextFitFn = interpolated(symbolDef['markerTextFit']);
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
                const v = markerTextFitFn(null, feature && feature.feature && feature.feature.properties);
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
        if (!aMarkerWidth && hasWidth) {
            props.aMarkerWidth = props[PREFIX + 'aMarkerWidth'] || new Uint16Array(count);
            if (!iconGeometry.data.aMarkerWidth) {
                iconGeometry.data.aMarkerWidth = new Uint16Array(count);
            }
        }
        if (!aMarkerHeight && hasHeight) {
            props.aMarkerHeight = props[PREFIX + 'aMarkerHeight'] || new Uint16Array(count);
            if (!iconGeometry.data.aMarkerHeight) {
                iconGeometry.data.aMarkerHeight = new Uint16Array(count);
            }
        }

        if (!isFunctionDefinition(symbolDef['textSize']) || interpolated(symbolDef['textSize']).isZoomConstant) {
            this._updateMarkerFitSize(iconGeometry);
            props.isFitConstant = true;
            return;
        }
    }

    _updateMarkerFitSize(iconGeometry) {
        const props = iconGeometry.properties;
        if (props.isFitConstant || !props.labelShape || !props.labelShape.length) {
            return;
        }
        const textSizeDef = this.symbolDef['textSize'];
        if (isFunctionDefinition(textSizeDef) && !this._textSizeFn) {
            this._textSizeFn = interpolated(textSizeDef);
        }
        const padding = this.getSymbol()['markerTextFitPadding'] || [0, 0];
        const zoom = this.getMap().getZoom();
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
            const feature = features[pickingId];
            const textSize = (this._textSizeFn ? this._textSizeFn(zoom, feature ? feature.feature ? feature.feature.properties : null : null) : textSizeDef) / GLYPH_SIZE;
            if (aMarkerWidth && hasWidth) {
                //除以10是因为为了增加精度，shader中的aShape乘以了10
                const width = Math.abs((maxx - minx) / 10 * textSize) + (padding[0] || 0) * 2;
                U8[0] = width;
                if (aMarkerWidth[idx] !== U8[0]) {
                    fillArray(aMarkerWidth, U8[0], idx, idx + BOX_VERTEX_COUNT);
                    aMarkerWidth.dirty = true;
                }
            }
            if (aMarkerHeight && hasHeight) {
                const height = Math.abs((maxy - miny) / 10 * textSize) + (padding[1] || 0) * 2;
                U8[0] = height;
                if (aMarkerHeight[idx] !== U8[0]) {
                    fillArray(aMarkerHeight, U8[0], idx, idx + BOX_VERTEX_COUNT);
                    aMarkerHeight.dirty = true;
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
    }
}

function sorting(a) {
    if (a.iconAtlas) {
        return -1;
    }
    return 1;
}

function buildLabelIndex(iconGeometry, textGeometry, markerTextFit) {
    let markerTextFitFn;
    if (isFunctionDefinition(markerTextFit)) {
        markerTextFitFn = interpolated(markerTextFit);
    }
    const labelIndex = [];
    const iconElements = iconGeometry.getElements();
    const textElements = textGeometry.getElements();
    const iconIds = iconGeometry.data.aPickingId;
    const textIds = textGeometry.data.aPickingId;
    const textCounts = textGeometry.data.aCount;
    const features = iconGeometry.properties.features;

    let textId = textElements[0];
    let currentLabel = {
        pickingId: textIds[textId],
        start: 0,
        end: textCounts[textId] * BOX_ELEMENT_COUNT
    };
    let count = 0;
    const unused = [];
    //遍历所有的icon，当icon和aPickingId和text的相同时，则认为是同一个icon + text，并记录它的序号
    for (let i = 0; i < iconElements.length; i += BOX_ELEMENT_COUNT) {
        const idx = iconElements[i];
        const pickingId = iconIds[idx];
        const feature = features[pickingId];
        const textFit = markerTextFitFn ? markerTextFitFn(null, feature.properties) : markerTextFit;
        if (pickingId === currentLabel.pickingId) {
            labelIndex[count++] = [currentLabel.start, currentLabel.end];
            const start = currentLabel.end;
            let textId = textElements[start];
            currentLabel.start = start;
            currentLabel.end = start + textCounts[textId] * BOX_ELEMENT_COUNT;
            currentLabel.pickingId = textIds[textId];
        } else if (textFit && textFit !== 'none') {
            //如果icon设置了markerTextFit，但没有label，则从elements中去掉这个icon
            for (let ii = i; ii < i + BOX_ELEMENT_COUNT; ii++) {
                unused.push(ii);
            }
        } else {
            labelIndex[count++] = [-1, -1];
        }
    }
    if (unused.length) {
        if (unused.length === iconElements.length) {
            iconGeometry.setElements([]);
        } else {
            const elements = [];
            let cur = 0;
            let delIndex = unused[cur];
            for (let i = 0; i < iconElements.length; i++) {
                if (i < delIndex) {
                    elements.push(iconElements[i]);
                } else if (i === delIndex) {
                    cur++;
                    delIndex = unused[cur];
                }
            }
            iconGeometry.setElements(new iconElements.constructor(elements));
        }
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

export default IconPainter;
