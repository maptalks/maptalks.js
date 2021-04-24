import * as maptalks from 'maptalks';
import { loadFunctionTypes } from '@maptalks/function-type';
import CollisionPainter from './CollisionPainter';
import { reshader } from '@maptalks/gl';
import { mat4 } from '@maptalks/gl';
import vert from './glsl/marker.vert';
import frag from './glsl/marker.frag';
import pickingVert from './glsl/marker.vert';
import { getIconBox } from './util/get_icon_box';
import { isNil } from '../Util';
import { createTextMesh, createTextShader, DEFAULT_UNIFORMS, GAMMA_SCALE, getTextFnTypeConfig, isLabelCollides, getLabelEntryKey } from './util/create_text_painter';
import MeshGroup from './MeshGroup';

import textVert from './glsl/text.vert';
import textFrag from './glsl/text.frag';
import textPickingVert from './glsl/text.vert';
import { updateOneGeometryFnTypeAttrib } from './util/fn_type_util';
import { GLYPH_SIZE } from './Constant';
import { createMarkerMesh, getMarkerFnTypeConfig, prepareMarkerGeometry, prepareLabelIndex, updateMarkerFitSize } from './util/create_marker_painter';

const BOX_ELEMENT_COUNT = 6;

const ICON_FILTER = function (mesh) {
    const renderer = this.layer.getRenderer();
    return renderer.isForeground(mesh) && !!mesh.geometry.properties.iconAtlas && !mesh.geometry.properties.isEmpty;
};

const ICON_FILTER_N = function (mesh) {
    const renderer = this.layer.getRenderer();
    return !renderer.isForeground(mesh) && !!mesh.geometry.properties.iconAtlas && !mesh.geometry.properties.isEmpty;
};

const TEXT_FILTER = function (mesh) {
    const renderer = this.layer.getRenderer();
    return renderer.isForeground(mesh) && !!mesh.geometry.properties.glyphAtlas;
};

const TEXT_FILTER_N = function (mesh) {
    const renderer = this.layer.getRenderer();
    return !renderer.isForeground(mesh) && !!mesh.geometry.properties.glyphAtlas;
};

//temparary variables
const PROJ_MATRIX = [];

class IconPainter extends CollisionPainter {
    constructor(regl, layer, symbol, sceneConfig, pluginIndex) {
        super(regl, layer, symbol, sceneConfig, pluginIndex);

        this.propAllowOverlap = 'markerAllowOverlap';
        this.propIgnorePlacement = 'markerIgnorePlacement';
        // this._textFnTypeConfig = getTextFnTypeConfig(this.getMap(), this.symbolDef);
        // this._iconFnTypeConfig = this._getIconFnTypeConfig();
        this._fnTypeConfigs = {};
        this.isLabelCollides = isLabelCollides.bind(this);

        this._iconFilter0 = ICON_FILTER.bind(this);
        this._iconFilter1 = ICON_FILTER_N.bind(this);
        this._textFilter0 = TEXT_FILTER.bind(this);
        this._textFilter1 = TEXT_FILTER_N.bind(this);
    }

    updateSymbol(...args) {
        super.updateSymbol(...args);
        // this._textFnTypeConfig = getTextFnTypeConfig(this.getMap(), this.symbolDef);
        // this._iconFnTypeConfig = this._getIconFnTypeConfig();
    }

    createGeometry(glData, features) {
        if (!glData || !glData.length) {
            return [];
        }
        const map = this.getMap();
        glData = glData.sort(sorting);
        const geometries = [];
        for (let i = 0; i < glData.length; i++) {
            const data = glData[i];
            if (data && data.empty) {
                //空icon，删除不需要的attribute数据
                data.data = {
                    aPosition: new Uint8Array(data.data.aPosition),
                    aPickingId: data.data.aPickingId
                };
            }
            const geometry = super.createGeometry(data, features);
            const symbolDef = geometry.properties.symbolDef;
            const hash = maptalks.Util.getSymbolStamp(symbolDef);
            geometry.properties.symbol = loadFunctionTypes(symbolDef, () => {
                return [map.getZoom()];
            });
            if (isMarkerGeo(geometry)) {
                const fnTypeConfig = this._fnTypeConfigs[hash] || getMarkerFnTypeConfig(map, symbolDef);
                this._fnTypeConfigs[hash] = fnTypeConfig;
                geometry.properties.fnTypeConfig = fnTypeConfig;
                prepareMarkerGeometry(geometry, symbolDef, fnTypeConfig);
            } else if (isTextGeo(geometry)) {
                const fnTypeConfig = getTextFnTypeConfig(map, symbolDef);
                geometry.properties.fnTypeConfig = fnTypeConfig;
                if (symbolDef.isIconText) {
                    const iconGeometry = geometries[i - 1];
                    const markerTextFit = iconGeometry.properties.symbolDef['markerTextFit'];
                    iconGeometry.properties.textGeo = geometry;
                    prepareLabelIndex(map, iconGeometry, geometry, markerTextFit);
                }
            }
            geometries.push(geometry);
        }
        return geometries;
    }

    createMesh(geometries, transform) {
        const meshes = [];
        for (let i = 0; i < geometries.length; i++) {
            const geometry = geometries[i];
            if (!geometry) {
                continue;
            }
            const { fnTypeConfig, symbolDef } = geometry.properties;
            if (isMarkerGeo(geometry)) {
                const mesh = createMarkerMesh(this.regl, geometry, transform, symbolDef, fnTypeConfig, this.isEnableCollision(), this.isEnableUniquePlacement());
                if (mesh) meshes.push(mesh);
            } else if (isTextGeo(geometry)) {
                const mesh = createTextMesh.call(this, this.regl, geometry, transform, symbolDef, fnTypeConfig, this.isEnableCollision(), this.isEnableUniquePlacement());
                if (mesh.length) meshes.push(...mesh);
            }
        }
        return new MeshGroup(meshes);
    }

    addMesh(meshes) {
        if (meshes instanceof MeshGroup) {
            meshes = meshes.meshes;
        }
        for (let i = 0; i < meshes.length; i++) {
            const geometry = meshes[i].geometry;
            if (!geometry) {
                continue;
            }
            if (geometry.properties.symbolDef.isTextIcon) {
                updateMarkerFitSize(this.getMap(), geometry);
            }
        }
        const z = this.getMap().getZoom();
        for (let i = 0; i < meshes.length; i++) {
            const geometry = meshes[i] && meshes[i].geometry;
            if (!geometry) {
                continue;
            }
            const { symbolDef, fnTypeConfig } = geometry.properties;
            updateOneGeometryFnTypeAttrib(this.regl, symbolDef, fnTypeConfig, meshes[i], z);
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
        return super.addMesh(meshes);
    }

    updateCollision(context) {
        super.updateCollision(context);
        const meshes = this.scene.getMeshes();
        if (!meshes || !meshes.length) {
            return;
        }

        this._updateIconCollision(context.timestamp);
    }

    callCurrentTileShader(uniforms, context) {
        this.shader.filter = context.sceneFilter ? [this._iconFilter0, context.sceneFilter] : this._iconFilter0;
        this.renderer.render(this.shader, uniforms, this.scene, this.getRenderFBO(context));

        this._textShader.filter = context.sceneFilter ? [this._textFilter0, context.sceneFilter] : this._textFilter0;
        this.renderer.render(this._textShader, uniforms, this.scene, this.getRenderFBO(context));
    }

    callBackgroundTileShader(uniforms, context) {
        this.shader.filter = context.sceneFilter ? [this._iconFilter1, context.sceneFilter] : this._iconFilter1;
        this.renderer.render(this.shader, uniforms, this.scene, this.getRenderFBO(context));

        this._textShader.filter = context.sceneFilter ? [this._textFilter1, context.sceneFilter] : this._textFilter1;
        this.renderer.render(this._textShader, uniforms, this.scene, this.getRenderFBO(context));
    }

    isMeshIterable(mesh) {
        //halo和正文共享的同一个geometry，无需更新
        return mesh && mesh.geometry && !!mesh.geometry.properties.iconAtlas && !(this.shouldIgnoreBackground() && !this.layer.getRenderer().isForeground(mesh));
    }


    /**
     * 遍历每个icon，判断其是否有碰撞， 如果有，则删除其elements
     * @param {Number} timestamp
     */
    _updateIconCollision(/* timestamp */) {
        if (!this.isEnableCollision()) {
            return;
        }
        let meshes = this.scene.getMeshes();
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
            const visible = this.updateBoxCollisionFading(true, iconMesh, iconElements, (end - start) / BOX_ELEMENT_COUNT, start, end, mvpMatrix, iconIndex);

            if (visible) {
                if (textMesh) {
                    const labelIndex = iconMesh.geometry.properties.labelIndex[iconIndex];
                    if (labelIndex && labelIndex[0] !== -1) {
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
        meshes = meshes.sort(sortByLevel);
        for (let m = 0; m < meshes.length; m++) {
            const iconMesh = meshes[m];
            if (!iconMesh || !iconMesh.geometry || !iconMesh.geometry.properties.isEmpty && !this.isMeshIterable(iconMesh)) {
                continue;
            }
            const textMesh = iconMesh._textMesh;
            const meshKey = iconMesh.properties.meshKey;
            this.startMeshCollision(meshKey);
            let textGeometry, textElements, textVisibleElements;
            if (textMesh) {
                const symbol = textMesh.geometry.properties.symbol;
                textMesh.properties.textSize = !isNil(symbol['textSize']) ? symbol['textSize'] : DEFAULT_UNIFORMS['textSize'];
                textMesh.properties.textHaloRadius = !isNil(symbol['textHaloRadius']) ? symbol['textHaloRadius'] : DEFAULT_UNIFORMS['textHaloRadius'];
                textGeometry = textMesh.geometry;
                textElements = textGeometry.properties.elements;
                textVisibleElements = [];
            }

            const iconGeometry = iconMesh.geometry;
            const iconElements = iconGeometry.properties.elements;
            const iconVisibleElements = [];

            this.forEachBox(iconMesh, iconElements, (mesh, start, end, mvpMatrix, index) => {
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

    setCollisionOpacity(mesh, allElements, value, start, end, boxIndex) {
        super.setCollisionOpacity(mesh, allElements, value, start, end);
        const textMesh = mesh._textMesh;
        if (textMesh && mesh.geometry.properties.labelIndex) {
            //icon and text
            const textElements = textMesh.geometry.properties.elements;
            const labelIndex = mesh.geometry.properties.labelIndex;
            if (!labelIndex || !labelIndex[boxIndex]) {
                return;
            }
            const [textStart, textEnd] = labelIndex[boxIndex];
            if (textStart !== -1) {
                super.setCollisionOpacity(textMesh, textElements, value, textStart, textEnd);
            }
        }
    }

    forEachBox(mesh, elements, fn) {
        const { aPickingId } = mesh.geometry.properties;
        const map = this.getMap();
        const matrix = mat4.multiply(PROJ_MATRIX, map.projViewMatrix, mesh.localTransform);
        let index = 0;

        let idx = elements[0];
        let start = 0, current = aPickingId[idx];
        for (let i = 0; i <= elements.length; i += BOX_ELEMENT_COUNT) {
            idx = elements[i];
            //pickingId发生变化，新的feature出现
            if (aPickingId[idx] !== current || i === elements.length) {
                fn.call(this, mesh, start, i, matrix, index++);
                current = aPickingId[idx];
                start = i;
            }
        }
    }

    isBoxCollides(mesh, elements, boxCount, start, end, matrix, boxIndex) {
        const map = this.getMap();
        const textMesh = mesh._textMesh;
        const iconBoxes = [];
        const labelIndex = mesh.geometry.properties.labelIndex && mesh.geometry.properties.labelIndex[boxIndex];
        // debugger
        //icon and text
        let collides = 0;
        if (!mesh.geometry.properties.isEmpty) {
            let offscreenCount = 0;
            //insert every character's box into collision index
            for (let j = start; j < end; j += BOX_ELEMENT_COUNT) {
                //use int16array to save some memory
                const box = getIconBox([], mesh, elements[j], matrix, map);
                iconBoxes.push(box);
                if (!collides) {
                    const boxCollides = this.isCollides(box);
                    if (boxCollides === 1) {
                        collides = 1;
                    } else if (boxCollides === -1) {
                        //offscreen
                        offscreenCount++;
                    }
                }
            }
            if (offscreenCount === boxCount) {
                //所有box都offscreen时，可认为存在碰撞
                collides = -1;
            }
            if (!textMesh || !labelIndex || labelIndex && labelIndex[0] === -1) {
                return {
                    collides,
                    boxes: iconBoxes
                };
            }
        }

        const [textStart, textEnd] = labelIndex;
        let hasCollides = collides === 1 ? 1 : 0;
        const textElements = textMesh.geometry.properties.elements;
        const charCount = (textEnd - textStart) / BOX_ELEMENT_COUNT;

        const textCollision = this.isLabelCollides(collides, textMesh, textElements, charCount, textStart, textEnd, matrix);
        if (!hasCollides) {
            if (textCollision.collides === -1 && collides === -1) {
                hasCollides = -1;
            } else if (textCollision.collides === 1) {
                hasCollides = 1;
            }
        }

        if (iconBoxes.length) {
            textCollision.boxes.push(...iconBoxes);
        }

        return {
            collides: hasCollides,
            boxes: textCollision.boxes
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

    isBloom(mesh) {
        const isMarker = mesh && mesh.material && !isNil(mesh.material.get('markerOpacity'));
        const symbol = this.getSymbol();
        return !!(isMarker ? symbol['markerBloom'] : symbol['textBloom']);
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
                'flipY',
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
                    func: this.getBlendFunc(),
                    equation: 'add',
                    // color: [0, 0, 0, 0]
                },
                depth: {
                    enable: true,
                    range: this.sceneConfig.depthRange || [0, 1],
                    func: this.sceneConfig.depthFunc || 'always',
                    mask: false
                },
            }
        });

        const { uniforms, extraCommandProps } = createTextShader(this.layer, this.sceneConfig);
        //icon的text在intel gpu下不会引起崩溃，可以关闭模板
        // extraCommandProps.stencil.enable = false;

        this._textShader = new reshader.MeshShader({
            vert: textVert, frag: textFrag,
            uniforms,
            extraCommandProps
        });

        if (this.pickingFBO) {
            this.picking = new reshader.FBORayPicking(
                this.renderer,
                {
                    vert: '#define PICKING_MODE 1\n' + pickingVert,
                    uniforms: [
                        'flipY',
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
                    ],
                    extraCommandProps: {
                        viewport: this.pickingViewport
                    }
                },
                this.pickingFBO
            );
            this.picking.filter = mesh => {
                return !!mesh.geometry.properties.iconAtlas;
            };

            this._textPicking = new reshader.FBORayPicking(
                this.renderer,
                {
                    vert: '#define PICKING_MODE 1\n' + textPickingVert,
                    uniforms,
                    extraCommandProps: {
                        viewport: this.pickingViewport
                    }
                },
                this.pickingFBO
            );
            this._textPicking.filter = mesh => {
                return !!mesh.geometry.properties.glyphAtlas;
            };
        }
    }

    pick(x, y, tolerance) {
        let result = super.pick(x, y, tolerance);
        if (result) {
            return result;
        }
        const iconPicking = this.picking;
        this.picking = this._textPicking;
        result = super.pick(x, y, tolerance);
        this.picking = iconPicking;
        return result;
    }

    getUniformValues(map) {
        const projViewMatrix = map.projViewMatrix;
        const cameraToCenterDistance = map.cameraToCenterDistance;
        const canvasSize = [map.width, map.height];
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

            blendSrcIsOne: +(!!(this.sceneConfig.blendSrc === 'one'))
        };
    }

    getUniqueEntryKey(mesh, idx, boxIndex) {
        if (!mesh._textMesh) {
            return null;
        }
        const { labelIndex } = mesh.geometry.properties;
        if (!labelIndex) {
            return null;
        }
        const textIndexes = labelIndex[boxIndex];
        if (!textIndexes) {
            return null;
        }
        const [textStart] = textIndexes;
        if (textStart === -1) {
            return null;
        }
        const { elements } = mesh._textMesh.geometry.properties;
        return getLabelEntryKey(mesh._textMesh, elements[textStart]);
    }
}

function sorting(a) {
    //empty只会当symbol只有text没有icon时出现
    if (a && (a.iconAtlas || a.empty)) {
        return -1;
    }
    return 1;
}

function sortByLevel(m0, m1) {
    const r = m0.uniforms['level'] - m1.uniforms['level'];
    if (r === 0) {
        return m0.properties.meshKey.localeCompare(m1.properties.meshKey);
    } else {
        return r;
    }
}

export default IconPainter;

function isMarkerGeo(geo) {
    return geo && (geo.properties.iconAtlas || geo.properties.isEmpty);
}

function isTextGeo(geo) {
    return geo && geo.properties.glyphAtlas;
}
