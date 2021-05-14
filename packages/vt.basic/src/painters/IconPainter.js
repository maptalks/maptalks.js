import CollisionPainter from './CollisionPainter';
import { reshader } from '@maptalks/gl';
import { mat4 } from '@maptalks/gl';
import vert from './glsl/marker.vert';
import frag from './glsl/marker.frag';
import pickingVert from './glsl/marker.vert';
import { getIconBox } from './util/get_icon_box';
import { isNil, isIconText } from '../Util';
import { createTextMesh, createTextShader, GAMMA_SCALE, isLabelCollides, getLabelEntryKey, getTextFnTypeConfig } from './util/create_text_painter';
import CollisionGroup from './CollisionGroup';

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
        this._meshesToCheck = [];
    }

    createFnTypeConfig(map, symbolDef) {
        const icon = getMarkerFnTypeConfig(map, symbolDef);
        const text = getTextFnTypeConfig(map, symbolDef);
        return {
            icon,
            text
        };
    }

    startFrame(...args) {
        this._meshesToCheck.length = 0;
        return super.startFrame(...args);
    }

    createGeometry(glData, features) {
        if (!glData || !glData.length) {
            return [];
        }
        const map = this.getMap();
        // glData = glData.sort(sorting);
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
            const geo = super.createGeometry(data, features);
            if (!geo || !geo.geometry) {
                continue;
            }
            const { geometry, symbolIndex } = geo;
            const symbolDef = this.getSymbolDef(symbolIndex);
            const fnTypeConfig = this.getFnTypeConfig(symbolIndex);
            geometry.properties.symbolIndex = symbolIndex;

            if (this._isMarkerGeo(geometry)) {
                if (!geometry.properties.iconAtlas) {
                    geometry.properties.isEmpty = true;
                }
                prepareMarkerGeometry(geometry, symbolDef, fnTypeConfig.icon);
            } else if (this._isTextGeo(geometry)) {
                if (isIconText(symbolDef)) {
                    const iconGeometry = geometries[i - 1].geometry;
                    const markerTextFit = symbolDef['markerTextFit'];
                    iconGeometry.properties.textGeo = geometry;
                    prepareLabelIndex.call(this, map, iconGeometry, geometry, markerTextFit);
                }
            }
            geometries.push(geo);
        }
        return geometries;
    }

    _prepareCollideIndex(geo) {
        if (!this.isEnableCollision()) {
            return;
        }
        const { aPickingId, elements } = geo.properties;
        const collideBoxIndex = {};
        if (!elements) {
            // an empty icon
            geo.properties.collideBoxIndex = collideBoxIndex;
            return;
        }

        let index = 0;
        let idx = elements[0];
        let start = 0, current = aPickingId[idx];
        for (let ii = 0; ii <= elements.length; ii += BOX_ELEMENT_COUNT) {
            idx = elements[ii];
            //pickingId发生变化，新的feature出现
            if (aPickingId[idx] !== current || ii === elements.length) {
                collideBoxIndex[current] = [
                    start,
                    ii,
                    index++
                ];
                current = aPickingId[idx];
                start = ii;
            }
        }
        geo.properties.collideBoxIndex = collideBoxIndex;
    }

    createMesh(geometries, transform) {
        const meshes = [];
        for (let i = 0; i < geometries.length; i++) {
            const geo = geometries[i];
            if (!geo || !geo.geometry) {
                continue;
            }
            const { geometry, symbolIndex } = geo;
            geometry.properties.symbolIndex = symbolIndex;
            const symbolDef = this.getSymbolDef(symbolIndex);
            const symbol = this.getSymbol(symbolIndex);
            const fnTypeConfig = this.getFnTypeConfig(symbolIndex);
            if (this._isMarkerGeo(geometry)) {
                const mesh = createMarkerMesh(this.regl, geometry, transform, symbolDef, fnTypeConfig.icon, this.isEnableCollision(), this.isEnableUniquePlacement());
                if (mesh) meshes.push(mesh);
            } else if (this._isTextGeo(geometry)) {
                const mesh = createTextMesh.call(this, this.regl, geometry, transform, symbolDef, symbol, fnTypeConfig.text, this.isEnableCollision(), this.isEnableUniquePlacement());
                if (mesh.length) meshes.push(...mesh);
            }
            this._prepareCollideIndex(geometry);
        }
        return meshes.length === 1 ? meshes[0] : meshes;
    }

    addMesh(meshes) {
        if (Array.isArray(meshes)) {
            const l = meshes.length;
            if (l) {
                const group = new CollisionGroup(meshes);
                group.properties.uniquePickingIds = meshes[0].geometry.properties.uniquePickingIds;
                group.properties.meshKey = meshes[0].properties.meshKey;
                group.properties.level = meshes[0].geometry.properties.level;
                this._meshesToCheck.push(group);
            }
        } else {
            this._meshesToCheck.push(meshes);
        }
        const meshModel = meshes;
        if (!Array.isArray(meshes)) {
            meshes = [meshes];
        }
        for (let i = 0; i < meshes.length; i++) {
            const geometry = meshes[i].geometry;
            if (!geometry) {
                continue;
            }
            const { symbolIndex } = geometry.properties;
            const symbolDef = this.getSymbolDef(symbolIndex);
            if (isIconText(symbolDef)) {
                updateMarkerFitSize.call(this, this.getMap(), geometry);
            }
        }
        const z = this.getMap().getZoom();
        for (let i = 0; i < meshes.length; i++) {
            const geometry = meshes[i] && meshes[i].geometry;
            if (!geometry) {
                continue;
            }
            const { symbolIndex } = geometry.properties;
            const symbolDef = this.getSymbolDef(symbolIndex);
            const fnTypeConfig = this.getFnTypeConfig(symbolIndex);

            updateOneGeometryFnTypeAttrib(this.regl, symbolDef, symbolIndex.type === 0 ? fnTypeConfig.icon : fnTypeConfig.text, meshes[i], z);
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
        return super.addMesh(meshModel);
    }

    updateCollision(context) {
        super.updateCollision(context);
        const meshes = this.scene.getMeshes();
        if (!meshes || !meshes.length) {
            return;
        }

        this._updateIconCollision(context.timestamp);
        this._meshesToCheck = [];
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
        let meshes = this._meshesToCheck;
        if (!meshes || !meshes.length) {
            return;
        }

        this._updateIconAndText(meshes);
    }

    _updateBox(mesh, start, end, mvpMatrix, globalBoxIndex) {
        const boxCount = (end - start) / BOX_ELEMENT_COUNT;
        const { elements } = mesh.geometry.properties;
        const collision = this.updateBoxCollisionFading(true, mesh, elements, boxCount, start, end, mvpMatrix, globalBoxIndex);
        if (collision.updateIndex) {
            this._savedBoxes.push(...collision.boxes);
        }
        // if (groupCount || boxCount > 1) {
        //     if (boxIndex === 0 && (groupCount === 0 || groupIndex === 0)) {
        //         // 如果groupCount不为0，则在groupIndex === 0 时创建
        //         // 如果groupCount为0，则在boxIndex === 0 时创建
        //         this._savedBoxes = [];
        //     }
        //     if (!collision.visible) {
        //         return false;
        //     }
        //     if (collision.updateIndex) {
        //         this._savedBoxes.push(...collision.boxes);
        //     }
        //     if ((groupCount === 0 || groupIndex === groupCount - 1) && boxIndex === boxCount - 1) {
        //         //TODO fill collision index
        //         this._fillCollisionIndex(this._savedBoxes);
        //     }
        //     return true;
        // } else {
        //     if (collision.updateIndex) {
        //         this._fillCollisionIndex(collision.boxes);
        //     }
        //     return collision.visible;
        // }
        return collision.visible;
    }

    isEnableUniquePlacement() {
        return this.isEnableCollision() && this.sceneConfig['uniquePlacement'] === true;
    }

    _updateIconAndText(meshes) {
        const layer = this.layer;
        const renderer = layer.getRenderer();
        meshes = meshes.sort(sortByLevel);
        for (let m = 0; m < meshes.length; m++) {
            const mesh = meshes[m];
            if (!mesh) {
                continue;
            }
            if (mesh instanceof CollisionGroup) {
                if (!mesh.meshes.length) {
                    continue;
                }
            } else if (!mesh.geometry || !mesh.geometry.properties.isEmpty && !this.isMeshIterable(mesh)) {
                continue;
            }
            const isForeground = renderer.isForeground(mesh instanceof CollisionGroup ? mesh.meshes[0] : mesh);
            if (this.shouldIgnoreBackground() && !isForeground) {
                continue;
            }
            const meshKey = mesh.properties.meshKey;
            this.startMeshCollision(mesh);
            this._startCheckMesh(mesh);
            this.forEachBox(mesh, this._updateBox);
            this._endCheckMesh(mesh);
            this.endMeshCollision(meshKey);

            if (mesh instanceof CollisionGroup) {
                for (let i = 0; i < mesh.meshes.length; i++) {
                    this._updateOpacity(mesh.meshes[i]);
                }
            } else {
                this._updateOpacity(mesh);
            }
        }
    }

    _updateOpacity(mesh) {
        const aOpacity = mesh && mesh.geometry && mesh.geometry.properties.aOpacity;
        if (aOpacity && aOpacity.dirty) {
            mesh.geometry.updateData('aOpacity', aOpacity);
            aOpacity.dirty = false;
        }
    }

    forEachBox(mesh, fn) {
        const enableCollision = this.isEnableCollision();
        const isGroup = mesh instanceof CollisionGroup;
        let meshes, l;
        if (isGroup) {
            meshes = mesh.meshes;
            l = meshes.length;
        }
        const uniquePickingIds = isGroup ? mesh.properties.uniquePickingIds : mesh.geometry.properties.uniquePickingIds;
        const context = { boxIndex: 0 };
        let visible;
        const count = uniquePickingIds.length;
        for (let i = 0; i < count; i++) {
            if (enableCollision) {
                this._savedBoxes = [];
            }
            // const visible = fn.call(this, mesh, uniquePickingIds[i]);
            if (isGroup) {
                for (let j = 0; j < l; j++) {
                    if (!meshes[j] || !meshes[j].geometry || meshes[j].geometry.properties.isEmpty || meshes[j].properties.isHalo) {
                        continue;
                    }
                    visible = this._iterateMeshBox(meshes[j], uniquePickingIds[i], fn, context);
                    if (!visible) {
                        break;
                    }
                }
            } else {
                visible = this._iterateMeshBox(mesh, uniquePickingIds[i], fn, context);
            }
            if (enableCollision && visible) {
                this._markerVisible(mesh, uniquePickingIds[i]);
                this._fillCollisionIndex(this._savedBoxes);
            }
        }
    }

    _iterateMeshBox(mesh, pickingIndex, fn, contextIndex) {
        const map = this.getMap();
        const { elements, collideBoxIndex, aCount } = mesh.geometry.properties;
        const boxInfo = collideBoxIndex[pickingIndex];
        if (!boxInfo) {
            return false;
        }
        const [start, end] = boxInfo;
        const matrix = mat4.multiply(PROJ_MATRIX, map.projViewMatrix, mesh.localTransform);
        if (aCount) {
            // a text
            const charCount = aCount[elements[start]];
            for (let ii = start; ii < end; ii += charCount * BOX_ELEMENT_COUNT) {
                const visible = fn.call(this, mesh, ii, ii + charCount * BOX_ELEMENT_COUNT, matrix, contextIndex.boxIndex++);
                if (!visible) {
                    return false;
                }
            }
        } else {
            for (let ii = start; ii < end; ii += BOX_ELEMENT_COUNT) {
                const visible = fn.call(this, mesh, ii, ii + BOX_ELEMENT_COUNT, matrix, contextIndex.boxIndex++);
                if (!visible) {
                    return false;
                }
            }
        }
        return true;
    }

    _startCheckMesh(mesh) {
        if (mesh instanceof CollisionGroup) {
            const meshes = mesh.meshes;
            for (let i = 0; i < meshes.length; i++) {
                const mesh = meshes[i];
                this._startCheckMesh(mesh);
            }
        } else {
            const geometry = mesh && mesh.geometry;
            if (!geometry) {
                return;
            }
            const { elements, visElemts } = geometry.properties;
            if (!visElemts) {
                geometry.properties.visElemts = new elements.constructor(elements.length);
            }
            geometry.properties.visElemts.count = 0;
        }
    }

    _markerVisible(mesh, pickingId) {
        if (mesh instanceof CollisionGroup) {
            const meshes = mesh.meshes;
            for (let i = 0; i < meshes.length; i++) {
                const mesh = meshes[i];
                this._markerVisible(mesh, pickingId);
            }
        } else {
            if (mesh.properties.isHalo) {
                return;
            }
            const geometry = mesh && mesh.geometry;
            if (!geometry || geometry.properties.isEmpty) {
                return;
            }
            const { collideBoxIndex, elements, visElemts } = geometry.properties;
            const boxInfo = collideBoxIndex[pickingId];
            if (!boxInfo) {
                return;
            }
            const [start, end] = boxInfo;
            let count = visElemts.count;
            for (let i = start; i < end; i++) {
                visElemts[count++] = elements[i];
            }
            visElemts.count = count;
        }
    }

    _endCheckMesh(mesh) {
        if (mesh instanceof CollisionGroup) {
            const meshes = mesh.meshes;
            for (let i = 0; i < meshes.length; i++) {
                const mesh = meshes[i];
                this._endCheckMesh(mesh);
            }
        } else {
            const geometry = mesh && mesh.geometry;
            if (!geometry) {
                return;
            }
            const { visElemts } = geometry.properties;
            geometry.setElements(visElemts, visElemts.count);
        }
    }

    isBoxCollides(mesh, elements, boxCount, start, end, matrix) {
        if (this._isTextGeo(mesh.geometry)) {
            return isLabelCollides.call(this, 0, mesh, elements, boxCount, start, end, matrix);
        }
        if (mesh.geometry.properties.isEmpty) {
            return {
                colliides: -1
            };
        }

        const map = this.getMap();
        const iconBoxes = [];
        let collides = 0;

        let offscreenCount = 0;
        //insert every character's box into collision index
        for (let j = start; j < end; j += BOX_ELEMENT_COUNT) {
            //use int16array to save some memory
            const box = getIconBox.call(this, [], mesh, elements[j], matrix, map);
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
        return {
            collides,
            boxes: iconBoxes
        };
    }

    deleteMesh(meshes, keepGeometry) {
        if (!meshes) {
            return;
        }
        if (meshes instanceof CollisionGroup) {
            meshes = meshes.meshes;
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
        const symbol = this.getSymbol(mesh.properties.symbolIndex);
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
                polygonOffset: {
                    enable: true,
                    offset: this.getPolygonOffset()
                }
            }
        });

        const { uniforms, extraCommandProps } = createTextShader.call(this, this.layer, this.sceneConfig);
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

    getUniqueEntryKey(mesh, idx) {
        if (!this._isTextGeo(mesh.geometry)) {
            return null;
        }
        const { elements } = mesh.geometry.properties;
        return getLabelEntryKey(mesh, elements[idx]);
    }

    _isMarkerGeo(geo) {
        const { symbolIndex } = geo.properties;
        return symbolIndex.type === 0;
    }

    _isTextGeo(geo) {
        const { symbolIndex } = geo.properties;
        return symbolIndex.type === 1;
    }
}

// function sorting(a) {
//     //empty只会当symbol只有text没有icon时出现
//     if (a && (a.iconAtlas || a.empty)) {
//         return -1;
//     }
//     return 1;
// }

function sortByLevel(m0, m1) {
    return m0.properties.level - m1.properties.level || m0.properties.meshKey - m1.properties.meshKey;
}

export default IconPainter;
