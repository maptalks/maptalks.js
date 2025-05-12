import * as maptalks from 'maptalks';
import { isFunctionDefinition } from '@maptalks/function-type';
import CollisionPainter from './CollisionPainter';
import { reshader } from '@maptalks/gl';
import { vec2, mat4 } from '@maptalks/gl';
import vert from './glsl/marker.vert';
import frag from './glsl/marker.frag';
import pickingVert from './glsl/marker.vert';
import { getIconBox } from './util/get_icon_box';
import { isNil, isIconText, getUniqueIds } from '../Util';
import { GAMMA_SCALE, isLabelCollides, getLabelEntryKey, getTextFnTypeConfig } from './util/create_text_painter';
import CollisionGroup from './CollisionGroup';

import { updateOneGeometryFnTypeAttrib } from './util/fn_type_util';
import { GLYPH_SIZE, ICON_SIZE } from './Constant';
import { createMarkerMesh, getMarkerFnTypeConfig, prepareMarkerGeometry, prepareDxDy, prepareLabelIndex, updateMarkerFitSize, BOX_VERTEX_COUNT, BOX_ELEMENT_COUNT } from './util/create_marker_painter';
import { getVectorPacker } from '../../../packer/inject';
import { INVALID_ALTITUDE } from '../../../common/Constant';

const { FilterUtil } = getVectorPacker();

//temparary variables
const PROJ_MATRIX = [];

const EMPTY_COLLISION = {
    collides: -1
};

const ICON_SIZE_ARR = [ICON_SIZE, ICON_SIZE];

const IDENTITY_ARR = mat4.identity([]);
const TEMP_CANVAS_SIZE = [];

class IconPainter extends CollisionPainter {
    static getBloomSymbol() {
        return ['markerBloom', 'textBloom'];
    }

    constructor(regl, layer, symbol, sceneConfig, pluginIndex, dataConfig) {
        super(regl, layer, symbol, sceneConfig, pluginIndex, dataConfig);
        this.propAllowOverlap = 'markerAllowOverlap';
        this.propIgnorePlacement = 'markerIgnorePlacement';
        // this._textFnTypeConfig = getTextFnTypeConfig(this.getMap(), this.symbolDef);
        // this._iconFnTypeConfig = this._getIconFnTypeConfig();
        this._fnTypeConfigs = {};
        this.isLabelCollides = isLabelCollides.bind(this);

        this._meshesToCheck = [];
        this._emptyTexture = regl.texture(2);
    }

    needToRefreshTerrainTileOnZooming() {
        for (let i = 0; i < this.symbolDef.length; i++) {
            const symbolDef = this.symbolDef[i];
            const pitchAlignment = symbolDef['markerPitchAlignment'];
            if (pitchAlignment === 'map' || isFunctionDefinition(pitchAlignment) || FilterUtil.isExpression(pitchAlignment)) {
                return true;
            }
        }
        return false;
    }

    isTerrainVector() {
        return this.layer.options.awareOfTerrain && !this.needToRefreshTerrainTileOnZooming();
    }

    isTerrainSkin() {
        return super.isTerrainSkin() && this.needToRefreshTerrainTileOnZooming();
    }

    setShaderDefines(defines) {
        this._shaderDefines = defines;
    }

    createFnTypeConfig(map, symbolDef) {
        const iconConfigs = getMarkerFnTypeConfig.call(this, map, symbolDef);
        const textConfigs = getTextFnTypeConfig.call(this, map, symbolDef);
        // textDx 和 textDy 的逻辑已经合并在 icon 的 aDxDy 中，需要删除
        // text 的 aPitchAlign, aRotationAlign, aColorOpacity, aOverlap 都和marker保持一致，这里也不做处理
        for (let i = textConfigs.length - 1; i >= 0; i--) {
            const attrName = textConfigs[i].attrName;
            if (attrName === 'aTextDx' ||
                attrName === 'aTextDy' ||
                attrName === 'aPitchAlign' ||
                attrName === 'aRotation' ||
                attrName === 'aRotationAlign' ||
                attrName === 'aColorOpacity' ||
                attrName === 'aOverlap'
            ) {
                textConfigs.splice(i, 1);
            }
        }
        const configs = iconConfigs.concat(textConfigs);
        configs.text = textConfigs;
        configs.icon = iconConfigs;
        return configs;
    }

    startFrame(...args) {
        this._meshesToCheck.length = 0;
        return super.startFrame(...args);
    }

    createGeometry(glData, features) {
        if (glData && glData.empty) {
            //空icon，删除不需要的attribute数据
            glData.data = {
                aPosition: new Uint8Array(glData.data.aPosition),
                aPickingId: glData.data.aPickingId
            };
        }
        return super.createGeometry(glData, features);
    }

    postCreateGeometry(geo) {
        const { geometry, symbolIndex } = geo;
        const symbolDef = this.getSymbolDef(symbolIndex);
        const fnTypeConfig = this.getFnTypeConfig(symbolIndex);
        const { iconAtlas, glyphAtlas } = geometry.properties;
        if (!iconAtlas && !glyphAtlas) {
            geometry.properties.isEmpty = true;
        } else {
            this._prepareRequiredProps(geometry);
            if (iconAtlas) {
                this.drawDebugAtlas(iconAtlas);
                prepareMarkerGeometry(geometry, symbolDef, fnTypeConfig.icon, this.layer);
            }
            if (glyphAtlas) {
                const markerTextFit = symbolDef['markerTextFit'];
                if (markerTextFit) {
                    const map = this.getMap();
                    prepareLabelIndex.call(this, map, geometry, markerTextFit);
                }
            }
        }


    }

    _prepareRequiredProps(geometry) {
        const { aCount, aTexCoord } = geometry.data;
        geometry.properties.aCount = aCount;
        delete geometry.data.aCount;
        // aType = 顶点的类型：0 为 marker， 1 为 text
        const length = aTexCoord.length / 4;
        const aType = new Uint8Array(length);
        for (let i = 0; i < length; i++) {
            aType[i] = aTexCoord[i * 4 + 2];
        }
        geometry.properties.aType = aType;

        const aHalo = new Uint8Array(length);
        for (let i = 0; i < length; i++) {
            aHalo[i] = aTexCoord[i * 4 + 3];
        }
        geometry.properties.aHalo = aHalo;
        prepareDxDy.call(this, geometry);
    }


    prepareCollideIndex(geo) {
        // if (!this.layer.options['collision']) {
        //     return;
        // }
        // collideIds 中存放的是 feature.id 的值
        // aPickingIds 中存放的 KEY_IDX 的值
        // Vector3DLayer 中，feature有多个symbol时，会有多个数据的 feature.id 相同，但KEY_IDX不同的情况存在
        // 但 feature.id 可能不存在（比如mapbox的vt在线服务），aPickingId一定存在，所以遍历用的id数组优先选用 collideIds，没有的话就选用aPickingId
        const { collideIds, elements, aCount, aType } = geo.properties;
        if (!collideIds) {
            return;
        }
        const collideBoxIndex = {};
        if (!elements) {
            // an empty icon
            geo.properties.collideBoxIndex = collideBoxIndex;
            return;
        }

        let index = 0;
        let idx = elements[0];
        let start = 0, current = collideIds[idx];
        let type = aType[0];
        let charCount = 1;
        if (aCount) {
            charCount = aCount[elements[start]];
        }
        // 数据的排列方式
        // * 兼有icon 和 text : icon | halo | text | icon | halo | text
        // * 只有icon: icon | icon | icon
        // * 只有text: halo | text | halo | text | halo | text
        for (let ii = 0; ii <= elements.length; ii += BOX_ELEMENT_COUNT) {
            idx = elements[ii];
            //pickingId发生变化，新的feature出现
            if (collideIds[idx] !== current || type !== aType[idx] || ii === elements.length) {
                if (!collideBoxIndex[current]) {
                    collideBoxIndex[current] = [];
                }
                // 对于icon，除非没有text和halo，end为iconIndex（ii中包含了icon和halo，但halo需要忽略）
                const end = ii;
                let collideStart = start;
                if (type === 1) {
                    // halo永远在text前面，忽略text前面的halo部分
                    collideStart = start + (end - start) / 2;
                }
                collideBoxIndex[current].push([
                    collideStart,
                    end,
                    (end - collideStart) / (charCount * BOX_ELEMENT_COUNT),
                    index++,
                    start
                ]);
                current = collideIds[idx];
                type = aType[idx];
                start = ii;
                if (aCount) {
                    charCount = aCount[elements[start]];
                }
            }
        }
        geo.properties.collideBoxIndex = collideBoxIndex;
    }

    createMesh(geo, transform) {
        const enableCollision = this.isEnableCollision();
        const layer = this.layer;
        const { geometry, symbolIndex } = geo;
        geometry.properties.symbolIndex = symbolIndex;
        const symbolDef = this.getSymbolDef(symbolIndex);
        const symbol = this.getSymbol(symbolIndex);
        const fnTypeConfig = this.getFnTypeConfig(symbolIndex);
        const meshes = [];
        const enableUniquePlacement = this.isEnableUniquePlacement();
        const markerMeshes = createMarkerMesh.call(this, this.regl, geometry, transform, symbolDef, symbol, fnTypeConfig, layer.options['collision'], !enableCollision, enableUniquePlacement);

        if (markerMeshes.length) {
            const positionMatrix = this.getAltitudeOffsetMatrix();
            markerMeshes[0].positionMatrix = positionMatrix;
            if (markerMeshes[1]) {
                markerMeshes[1].positionMatrix = positionMatrix;
            }
            // delete mesh.geometry.properties.glyphAtlas;
            meshes.push(...markerMeshes);
        }
        if (geometry.properties.markerPlacement === 'line') {
            this._rebuildCollideIds(geometry);
            meshes.forEach(m => m.properties.isLinePlacement = true);
        }
        this.prepareCollideIndex(geometry);
        return meshes;
    }

    _rebuildCollideIds(geometry) {
        const isVectorTile = this.layer instanceof maptalks.TileLayer;
        // icon是沿线分布时，因为所有沿线生成的icon的aPickingId都是一样的，每个icon无法独立判断碰撞检测
        // 因此需要为每个icon和相应的text生成独立的collideId
        const { collideIds, glyphAtlas, iconAtlas } = geometry.properties;
        const newCollideIds = new Uint16Array(collideIds.length);
        const hasIcon = !!iconAtlas;
        const hasText = !!glyphAtlas;
        if (hasIcon) {
            const { collideIds, aType } = geometry.properties;
            if (!glyphAtlas) {
                // only icon
                let id = 0;
                for (let i = 0; i < collideIds.length; i += BOX_VERTEX_COUNT) {
                    newCollideIds.fill(id++, i, i + BOX_VERTEX_COUNT);
                }
            } else {
                // icon和text都存在，则每次遇到text后的icon时，填充id值
                let id = 0;
                let preType = aType[0];
                let startIndex = 0;
                for (let i = 1; i < collideIds.length; i++) {
                    if (aType[i] === 0 && preType === 1) {
                        newCollideIds.fill(id++, startIndex, i);
                        startIndex = i;
                    }
                    preType = aType[i];
                }
                if (startIndex < collideIds.length) {
                    newCollideIds.fill(id++, startIndex, collideIds.length);
                }
            }
            geometry.properties.collideIds = newCollideIds;
            geometry.properties.uniqueCollideIds = getUniqueIds(newCollideIds, !isVectorTile);
        } else if (hasText) {
            // only text
            const { collideIds, aCount } = geometry.properties;
            if (!aCount) {
                // text geometry 的 textSize 为0 或者 textOpacity为0
                return;
            }
            let id = 0;
            let currentCount = aCount[0];
            for (let i = 0; i < collideIds.length;) {
                const next =  i + currentCount * BOX_VERTEX_COUNT;
                collideIds.fill(id++, i, next);
                i += currentCount * BOX_VERTEX_COUNT;
                if (next < collideIds.length) {
                    currentCount = aCount[next];
                }
            }
            geometry.properties.uniqueCollideIds = getUniqueIds(collideIds, !isVectorTile);
        }
    }

    addMesh(meshes) {
        const isEnableCollision = this.isEnableCollision();
        if (isEnableCollision && meshes.length > 0) {
            const group = new CollisionGroup(meshes);
            group.properties.uniqueCollideIds = meshes[0].geometry.properties.uniqueCollideIds;
            group.properties.meshKey = meshes[0].properties.meshKey;
            group.properties.level = meshes[0].properties.level;
            this._meshesToCheck.push(group);
        }

        for (let i = 0; i < meshes.length; i++) {
            if (!this.isMeshIterable(meshes[i])) {
                continue;
            }
            const geometry = meshes[i].geometry;
            const { symbolIndex } = geometry.properties;
            const symbolDef = this.getSymbolDef(symbolIndex);
            if (isIconText(symbolDef)) {
                updateMarkerFitSize.call(this, this.getMap(), geometry);
            }
        }
        const z = this.getMap().getZoom();
        for (let i = 0; i < meshes.length; i++) {
            if (!this.isMeshIterable(meshes[i])) {
                continue;
            }
            const geometry = meshes[i].geometry;
            const { symbolIndex } = geometry.properties;
            const symbolDef = this.getSymbolDef(symbolIndex);
            const fnTypeConfig = this.getFnTypeConfig(symbolIndex);
            updateOneGeometryFnTypeAttrib(this.regl, this.layer, symbolDef, fnTypeConfig, meshes[i], z);
            const { aMarkerWidth, aMarkerHeight, aPadOffset } = geometry.properties;
            if (aMarkerWidth && aMarkerWidth.dirty) {
                geometry.updateData('aMarkerWidth', aMarkerWidth);
                aMarkerWidth.dirty = false;
            }
            if (aMarkerHeight && aMarkerHeight.dirty) {
                geometry.updateData('aMarkerHeight', aMarkerHeight);
                aMarkerHeight.dirty = false;
            }
            if (aPadOffset && aPadOffset.dirty) {
                geometry.updateData('aPadOffset', aPadOffset);
                aPadOffset.dirty = false;
            }
        }
        super.addMesh(...arguments);
    }

    updateCollision(context) {
        if (!this.isEnableCollision()) {
            return;
        }
        super.updateCollision(context);
        const meshes = this.scene.getMeshes();
        if (!meshes || !meshes.length) {
            this._endCollision();
            return;
        }

        this._updateIconCollision(context.timestamp);
        this._meshesToCheck = [];
        this._endCollision();
    }

    isMeshIterable(mesh) {
        //halo和正文共享的同一个geometry，无需更新
        return mesh && mesh.geometry && !mesh.geometry.properties.isEmpty &&
            mesh.material && this.isMeshVisible(mesh) &&
            !(this.shouldIgnoreBackground() && !this.layer.getRenderer().isForeground(mesh));
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
    // mesh, meshBoxes, matrix, contextIndex.boxIndex++
    _updateBox(mesh, meshBoxes, mvpMatrix, globalBoxIndex) {
        return this.updateBoxCollisionFading(true, mesh, meshBoxes, mvpMatrix, globalBoxIndex);
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
            if (!mesh || !mesh.meshes.length) {
                continue;
            }
            let isIterable = false;
            if (mesh.meshes.length === 1) {
                isIterable = this.isMeshIterable(mesh.meshes[0]);
            } else {
                for (let i = 0; i < mesh.meshes.length; i++) {
                    if (this.isMeshIterable(mesh.meshes[i])) {
                        isIterable = true;
                        break;
                    }
                }
            }
            if (!isIterable) {
                continue;
            }
            const isForeground = renderer.isForeground(mesh.meshes[0]);
            if (this.shouldIgnoreBackground() && !isForeground) {
                continue;
            }
            const meshKey = mesh.properties.meshKey;
            this.startMeshCollision(mesh);
            this._startCheckMesh(mesh);
            this.forEachBox(mesh, this._updateBox);
            this._endCheckMesh(mesh);
            this.endMeshCollision(meshKey);

            for (let i = 0; i < mesh.meshes.length; i++) {
                this._updateOpacity(mesh.meshes[i]);
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

    forEachBox(meshGroup, fn) {
        const uniqueCollideIds = meshGroup.properties.uniqueCollideIds;
        if (!uniqueCollideIds) {
            return;
        }
        const context = { boxIndex: 0 };
        const count = uniqueCollideIds.length;
        for (let i = 0; i < count; i++) {
            this._iterateMeshBox(meshGroup, uniqueCollideIds[i], fn, context);
        }
    }

    _iterateMeshBox(mesh, collideId, fn, contextIndex) {
        const map = this.getMap();
        // TODO  meshes[0]可能是不合法的数据
        const { collideBoxIndex } = mesh.meshes[0].geometry.properties;
        const boxInfos = collideBoxIndex && collideBoxIndex[collideId];
        if (!boxInfos || !boxInfos.length) {
            return false;
        }
        const matrix = mat4.multiply(PROJ_MATRIX, map.projViewMatrix, mesh.meshes[0].localTransform);
        // IconPainter中，一个数据，只会有一个box，所以不需要循环
        let meshBoxes;
        let updated = false;
        const meshes = mesh.meshes;
        let count = 0;
        for (let j = 0; j < meshes.length; j++) {
            if (!this.isMeshIterable(meshes[j])) {
                continue;
            }
            const { collideBoxIndex } = meshes[j].geometry.properties;
            const boxInfos = collideBoxIndex[collideId];
            if (!boxInfos) {
                continue;
            }
            count += boxInfos.length;
        }
        if (!count) {
            return false;
        }
        meshBoxes = this._getMeshBoxes(count);
        let index = 0;
        for (let i = 0; i < meshes.length; i++) {
            const mesh = meshes[i];
            if (!this.isMeshIterable(mesh)) {
                continue;
            }
            updated = true;
            const geoProps = mesh.geometry.properties;
            const { elements, aCount, collideBoxIndex } = geoProps;
            const boxInfos = collideBoxIndex[collideId];
            if (!boxInfos) {
                continue;
            }
            for (let j = 0; j < boxInfos.length; j++) {
                const [start, end, boxCount] = boxInfos[j];
                let charCount = 1;
                if (aCount) {
                    charCount = aCount[elements[start]];
                }
                const startIndex = start + 0 * charCount * BOX_ELEMENT_COUNT;
                meshBoxes[index].mesh = mesh;
                meshBoxes[index].start = startIndex;
                meshBoxes[index].end = end;//startIndex + charCount * BOX_ELEMENT_COUNT;
                // boxInfos[j][4] 中是box的start，因为text前面有halo，text的开始用来计算collide，而halo的开始用来显示
                meshBoxes[index].boxStart = boxInfos[j][4];
                meshBoxes[index].boxCount = geoProps.glyphAtlas ? charCount : boxCount;
                meshBoxes[index].allElements = elements;
                index++;
            }

        }

        if (!updated) {
            return false;
        }
        const visible = fn.call(this, mesh, meshBoxes, matrix, contextIndex.boxIndex++);

        if (visible) {
            this._markerVisible(mesh, collideId);
        }
        return true;
    }

    _startCheckMesh(mesh) {
        const meshes = mesh.meshes;
        for (let i = 0; i < meshes.length; i++) {
            const mesh = meshes[i];
            const geometry = mesh && mesh.geometry;
            if (!geometry) {
                continue;
            }
            geometry.properties.visElemts.count = 0;
        }
    }

    _markerVisible(mesh, pickingId) {
        const meshes = mesh.meshes;
        for (let i = 0; i < meshes.length; i++) {
            const mesh = meshes[i];
            const geometry = mesh && mesh.geometry;
            if (!geometry || geometry.properties.isEmpty) {
                continue;
            }
            const { collideBoxIndex, elements, visElemts } = geometry.properties;
            const boxInfos = collideBoxIndex[pickingId];
            if (!boxInfos || !boxInfos.length) {
                continue;
            }
            for (let j = 0; j < boxInfos.length; j++) {
                // boxInfos[j][4] 中是box的start，因为text前面有halo，text的开始用来计算collide，而halo的开始用来显示
                const boxStart = boxInfos[j][4];
                const end = boxInfos[j][1];
                let count = visElemts.count;
                for (let i = boxStart; i < end; i++) {
                    visElemts[count++] = elements[i];
                }
                visElemts.count = count;
            }
        }
    }

    _endCheckMesh(mesh) {
        const meshes = mesh.meshes;
        for (let i = 0; i < meshes.length; i++) {
            const mesh = meshes[i];
            const geometry = mesh && mesh.geometry;
            if (!geometry) {
                continue;
            }
            const { visElemts } = geometry.properties;
            geometry.setElements(visElemts, visElemts.count);
        }
    }

    isBoxCollides(mesh, elements, boxCount, start, end, matrix) {
        if (this._isTextGeo(mesh, elements, start)) {
            return isLabelCollides.call(this, 0, mesh, elements, boxCount, start, end, matrix);
        }
        if (mesh.geometry.properties.isEmpty) {
            return EMPTY_COLLISION;
        }

        const { aTerrainAltitude } = mesh.geometry.properties;
        if (aTerrainAltitude) {
            const altitude = aTerrainAltitude[elements[start] * 2];
            if (altitude === INVALID_ALTITUDE) {
                return EMPTY_COLLISION;
            }
        }

        const map = this.getMap();
        const { boxes: iconBoxes, collision } = this._getCollideBoxes(mesh, start);
        let collides = 0;

        let offscreenCount = 0;
        let boxIndex = 0;
        //insert every character's box into collision index
        for (let j = start; j < end; j += BOX_ELEMENT_COUNT) {
            const boxArr = iconBoxes[boxIndex] = iconBoxes[boxIndex] || [];
            boxIndex++;
            //use int16array to save some memory
            const box = getIconBox.call(this, boxArr, mesh, elements[j], matrix, map);
            // iconBoxes.push(box);
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
        collision.collides = collides;
        return collision;
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
                        delete m.material.uniforms.iconTex;
                    }
                });
            } else if (meshes.material) {
                delete meshes.material.uniforms.iconTex;
            }
        }
        super.deleteMesh(meshes, keepGeometry);
    }

    isBloom(mesh) {
        const isMarker = mesh && mesh.material && !isNil(mesh.material.get('markerOpacity'));
        const symbol = this.getSymbol(mesh.properties.symbolIndex);
        return !!(isMarker ? symbol['markerBloom'] : symbol['textBloom']);
    }

    isUniqueStencilRefPerTile() {
        return false;
    }

    init() {
        const regl = this.regl;
        const canvas = this.canvas;

        this.renderer = new reshader.Renderer(regl);

        // 地形瓦片中可能设置viewport
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

        const iconExtraCommandProps = {
            viewport,
            stencil: {
                enable: true,
                func: {
                    cmp: '<=',
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
            blend: {
                enable: true,
                func: this.getBlendFunc(),
                equation: 'add',
                // color: [0, 0, 0, 0]
            },
            depth: {
                enable: true,
                range: () => {
                    return this.sceneConfig.depthRange || [0, 1];
                },
                func: () => {
                    return this.sceneConfig.depthFunc || 'always';
                },
                mask: isNil(this.sceneConfig.depthMask) ? true : this.sceneConfig.depthMask
            },
            polygonOffset: {
                enable: true,
                offset: this.getPolygonOffset()
            }
        };
        const defines = this._shaderDefines || {};
        this.shader = new reshader.MeshShader({
            vert, frag,
            uniforms: [
                {
                    name: 'projViewModelMatrix',
                    type: 'function',
                    fn: function (context, props) {
                        return mat4.multiply([], props['projViewMatrix'], props['modelMatrix']);
                    }
                },
                {
                    name: 'zoomScale',
                    type: 'function',
                    fn: function (context, props) {
                        return props['tileResolution'] / props['resolution'];
                    }
                }
            ],
            extraCommandProps: iconExtraCommandProps,
            defines
        });
        this.shader.version = 300;

        if (this.pickingFBO) {
            const markerPicking = new reshader.FBORayPicking(
                this.renderer,
                {
                    vert: '#define PICKING_MODE 1\n' + pickingVert,
                    uniforms: [
                        {
                            name: 'projViewModelMatrix',
                            type: 'function',
                            fn: function (context, props) {
                                return mat4.multiply([], props['projViewMatrix'], props['modelMatrix']);
                            }
                        },
                        {
                            name: 'zoomScale',
                            type: 'function',
                            fn: function (context, props) {
                                return props['tileResolution'] / props['resolution'];
                            }
                        }
                    ],
                    extraCommandProps: iconExtraCommandProps
                },
                this.pickingFBO,
                this.getMap()
            );
            this.picking = [markerPicking];
        }
    }

    getUniformValues(map, context) {
        const isRenderingTerrainSkin = context && context.isRenderingTerrainSkin;
        const tileSize = this.layer.getTileSize().width;
        const projViewMatrix = isRenderingTerrainSkin ? IDENTITY_ARR : map.projViewMatrix;

        const cameraToCenterDistance = map.cameraToCenterDistance;
        const canvasSize = vec2.set(TEMP_CANVAS_SIZE, map.width, map.height);
        if (isRenderingTerrainSkin) {
            vec2.set(canvasSize, tileSize, tileSize);
        }
        const blendFunc = this.getBlendFunc();
        const blendSrc = maptalks.Util.isFunction(blendFunc.src) ? blendFunc.src() : blendFunc.src;
        return {
            layerScale: this.layer.options['styleScale'] || 1,
            mapPitch: map.getPitch() * Math.PI / 180,
            mapRotation: map.getBearing() * Math.PI / 180,
            projViewMatrix,
            cameraToCenterDistance,
            canvasSize,
            iconSize: ICON_SIZE_ARR,
            resolution: map.getResolution(),

            //text uniforms
            glyphSize: GLYPH_SIZE,
            // gammaScale : 0.64,
            gammaScale: GAMMA_SCALE,

            blendSrcIsOne: +(!!(blendSrc === 'one' || blendSrc === 1)),
            viewport: isRenderingTerrainSkin && context && context.viewport,
            isRenderingTerrain: +!!isRenderingTerrainSkin
        };
    }

    getUniqueEntryKey(mesh, idx) {
        if (!this._isTextGeo(mesh.geometry)) {
            return null;
        }
        const { elements } = mesh.geometry.properties;
        return getLabelEntryKey(mesh, elements[idx]);
    }

    _isTextGeo(mesh, elements, start) {
        const { aType } = mesh.geometry.properties;
        const index = elements[start];
        return aType[index] === 1;
    }

    delete() {
        if (this._emptyTexture) {
            if (!reshader.Util.isTextureDestroyed(this._emptyTexture)) {
                this._emptyTexture.destroy();
            }
            this._emptyTexture = null;
        }
        return super.delete();
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
