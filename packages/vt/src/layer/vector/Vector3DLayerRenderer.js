import * as maptalks from 'maptalks';
import { createREGL, reshader, mat4, vec3 } from '@maptalks/gl';
import { convertToFeature, ID_PROP } from './util/convert_to_feature';
import { SYMBOLS_NEED_REBUILD_IN_VECTOR, IconRequestor, GlyphRequestor, PointPack, LinePack, StyledPoint, VectorPack, StyledVector } from '../../packer';
import { extend, hasOwn, getCentiMeterScale, isNil } from '../../common/Util';
import { MARKER_SYMBOL, TEXT_SYMBOL, LINE_SYMBOL, SYMBOL_PREFIX, LINE_GRADIENT_PROP_KEY } from './util/symbols';
import { KEY_IDX } from '../../common/Constant';
import Vector3DLayer from './Vector3DLayer';
import { isFunctionDefinition, loadFunctionTypes } from '@maptalks/function-type';
import convertToPainterFeatures from '../renderer/utils/convert_to_painter_features';
import { ICON_PAINTER_SCENECONFIG } from '../core/Constant';

// const SYMBOL_SIMPLE_PROPS = {
//     textFill: 1,
//     textSize: 1,
//     textOpacity: 1,
//     // textHaloRadius: 1,
//     textHaloFill: 1,
//     textHaloOpacity: 1,
//     textPitchAlignment: 1,
//     textRotationAlignment: 1,
//     textDx: 1, //TODO
//     textDy: 1, //TODO

//     // markerWidth: 1,
//     // markerHeight: 1,
//     markerOpacity: 1,
//     markerPitchAlignment: 1,
//     markerRotationAlignment: 1,
//     markerDx: 1, //TODO
//     markerDy: 1, //TODO

//     lineColor: 1,
//     lineWidth: 1,
//     lineOpacity: 1,
//     lineDx: 1, //TODO
//     lineDy: 1, //TODO
//     lineGapWidth: 1, //TODO
//     lineDasharray: null,

//     polygonFill: 1,
//     polygonOpacity: 1
// };

let warned = false;

let meshUID = 1;
const prefix = (SYMBOL_PREFIX + '').trim();
const KEY_IDX_NAME = (KEY_IDX + '').trim();
let EMPTY_POSITION = new Float32Array(1);
const EMPTY_ARRAY = [];

class Vector3DLayerRenderer extends maptalks.renderer.CanvasRenderer {
    constructor(...args) {
        super(...args);
        this.features = {};
        this._geometries = {};
        this._counter = 0;
        this._allFeatures = {};
        this._featureMapping = {};
        this._markerFeatures = {};
        this._textFeatures = {};
        this._lineFeatures = {};
        this._dirtyAll = true;
        this._kidGen = { id: 0, pickingId: 0 };
        this._dirtyTargetsInCurrentFrame = {};
    }


    setURLModifier(urlModifier) {
        this._urlModifier = urlModifier;
    }

    getURLModifier() {
        return this._urlModifier;
    }

    //always redraw when map is interacting
    needToRedraw() {
        const redraw = super.needToRedraw();
        if (!redraw) {
            return this.painter && this.painter.needToRedraw() ||
                this._markerPainter && this._markerPainter.needToRedraw() ||
                this._linePainter && this._linePainter.needToRedraw();
        }
        return redraw;
    }

    getAnalysisMeshes() {
        return this.painter && this.painter.getAnalysisMeshes() || EMPTY_ARRAY;
    }

    getRayCastData() {
        return null;
    }

    draw(timestamp, parentContext) {
        this._frameTime = timestamp;
        const layer = this.layer;
        this.prepareCanvas();
        this._zScale = this._getCentiMeterScale(this.getMap().getGLRes()); // scale to convert meter to gl point
        this._parentContext = parentContext || {};
        const renderMode = this._parentContext.renderMode;
        const context = this._preparePaintContext();
        this._startFrame(context, renderMode);
        if (this._dirtyAll) {
            this.buildMesh();
            this._buildMarkerMesh();
            this._buildLineMesh();
            this._dirtyTargetsInCurrentFrame = {};
            this._dirtyGeo = false;
            this._dirtyAll = false;
            this._dirtyLine = false;
        } else if (this._dirtyGeo) {
            const atlas = this.atlas;
            const markerAtlas = this._markerAtlas;
            const lineAtlas = this._lineAtlas;
            delete this.atlas;
            delete this._markerAtlas;
            delete this._lineAtlas;
            this.buildMesh(atlas);
            this._buildMarkerMesh(markerAtlas);
            this._buildLineMesh(lineAtlas);
            this._dirtyGeo = false;
            this._dirtyLine = false;
        } else if (this._dirtyLine) {
            const lineAtlas = this._lineAtlas;
            delete this._lineAtlas;
            this._buildLineMesh(lineAtlas);
            this._dirtyLine = false;
        }
        if (!this.meshes && !this._markerMeshes && !this._lineMeshes) {
            this.completeRender();
            return;
        }

        if (this._showHideUpdated) {
            this._updateMeshVisible();
            this._showHideUpdated = false;
        }

        this._updateDirtyTargets();

        const isDefaultRender = !renderMode || renderMode === 'default';
        let polygonOffset = 0;
        if (this.layer.options['meshRenderOrder'] === 0) {
            this._renderMeshes(context, polygonOffset, renderMode);
        }

        let lineCount = 0;
        if (this._lineMeshes && (isDefaultRender || this._linePainter.supportRenderMode(renderMode))) {
            this._linePainter.startFrame(context);
            this._linePainter.addMesh(this._lineMeshes, null, { bloom: this._parentContext.bloom });
            this._linePainter.prepareRender(context);
            const currentPolygonOffset = context.polygonOffsetIndex || 0;
            polygonOffset = this.meshes && this.meshes.length ? polygonOffset - 1 : polygonOffset;
            context.polygonOffsetIndex = (context.polygonOffsetIndex || 0) + polygonOffset;
            lineCount = this._linePainter.render(context).drawCount;
            context.polygonOffsetIndex = currentPolygonOffset;
        }

        if (this.layer.options['meshRenderOrder'] === 1) {
            this._renderMeshes(context, lineCount ? polygonOffset - 1 : polygonOffset, renderMode);
        }

        if (this._markerMeshes && (isDefaultRender || this._markerPainter.supportRenderMode(renderMode))) {
            const isFinalRender = !this._parentContext.timestamp || this._parentContext.isFinalRender;
            const needUpdateCollision = !this._collisionTimestamp || this._collisionTimestamp !== timestamp;
            if (layer.options['collision'] && needUpdateCollision) {
                layer.clearCollisionIndex();
            }
            const sceneConfig = this.layer.options.sceneConfig;
            this._markerPainter.sceneConfig.collision = sceneConfig ? isNil(sceneConfig.collision) ? true : sceneConfig.collision : true;
            this._markerPainter.startFrame(context);
            this._markerPainter.addMesh(this._markerMeshes, null, { bloom: this._parentContext.bloom });
            this._markerPainter.prepareRender(context);
            if (layer.options.collision && needUpdateCollision) {
                this._markerPainter.updateCollision(context);
                if (isFinalRender) {
                    this._collisionTimestamp = timestamp;
                }
            }

            this._markerPainter.render(context);
        }

        if (isDefaultRender || parentContext && parentContext.isFinalRender) {
            this.completeRender();
            this.layer.fire('canvasisdirty');
        }
    }

    _startFrame(context, renderMode) {
        const isDefaultRender = !renderMode || renderMode === 'default';
        if (this.painter && (isDefaultRender || this.painter.supportRenderMode(renderMode))) {
            // 因为 StandardPainter 需要在createMesh前初始化，才能正常创建mesh，所以需要先调用startFrame
            this.painter.startFrame(context);
        }
    }

    _renderMeshes(context, polygonOffset, renderMode) {
        const isDefaultRender = !renderMode || renderMode === 'default';
        if (this.painter && this.meshes && (isDefaultRender || this.painter.supportRenderMode(renderMode))) {
            this.painter.addMesh(this.meshes, null, { bloom: context && context.bloom });
            this.painter.prepareRender(context);
            context.polygonOffsetIndex = (context.polygonOffsetIndex || 0) + polygonOffset;
            const status = this.painter.render(context);
            return status;
        }
        return {
            redraw: false,
            drawCount: 0
        };
    }

    supportRenderMode() {
        return true;
    }

    isForeground() {
        return true;
    }

    _preparePaintContext() {
        const context = {
            regl: this.regl,
            layer: this.layer,
            symbol: this._layerSymbol,
            gl: this.gl,
            sceneConfig: this.layer.options.sceneConfig,
            pluginIndex: 0,
            cameraPosition: this.getMap().cameraPosition,
            timestamp: this.getFrameTimestamp()
        };
        if (this._parentContext) {
            extend(context, this._parentContext);
        }
        return context;
    }

    drawOnInteracting(event, timestamp, parentContext) {
        this.draw(timestamp, parentContext);
    }

    getFrameTimestamp() {
        return this._frameTime;
    }

    // updateSymbol() {
    //     this.painter.updateSymbol(this.painterSymbol, this.painterSymbol);
    // }

    // maptalks/issues#75
    // 两个featureMap是为额外的限定条件，只有包含在这两个featureMap中的feature才会加入。
    // 例如LineStringLayer中，某个line是数组类型symbol，但其中一个只定义了marker样式，没有定义lineWidth
    _getFeaturesToRender(featureMap1, featureMap2) {
        featureMap1 = featureMap1 || featureMap2;
        if (featureMap1 === featureMap2) {
            featureMap2 = null;
        }
        const features = [];
        const center = [0, 0, 0, 0];
        //为了解决UglifyJS对 feature[KEY_IDX] 不正确的mangle
        // const KEY_IDX_NAME = (KEY_IDX + '').trim();
        // let count = 0;
        this.layer['_sortGeometries']();
        const geometries = this.layer.getGeometries();
        for (let i = 0; i < geometries.length; i++) {
            const geo = geometries[i];
            const uid = geo[ID_PROP];
            if (!this.features[uid]) {
                continue;
            }
            const feature = this.features[uid];
            if (Array.isArray(feature)) {
                // count = count++;
                for (let i = 0; i < feature.length; i++) {
                    const fea = feature[i];
                    const kid = fea[KEY_IDX_NAME];
                    if (featureMap1 && !featureMap1[kid]) {
                        if (!featureMap2 || featureMap2 && !featureMap2[kid]) {
                            continue;
                        }
                    }
                    if (!fea.visible) {
                        this._showHideUpdated = true;
                    }
                    this._addCoordsToCenter(fea.geometry, center, fea.coordinates);
                    // fea[KEY_IDX_NAME] = count++;
                    features.push(fea);
                }
            } else {
                if (!feature.visible) {
                    this._showHideUpdated = true;
                }
                const kid = feature[KEY_IDX_NAME];
                if (featureMap1 && !featureMap1[kid]) {
                    if (!featureMap2 || featureMap2 && !featureMap2[kid]) {
                        continue;
                    }
                }
                this._addCoordsToCenter(feature.geometry, center, feature.coordinates);
                // feature[KEY_IDX_NAME] = count++;
                features.push(feature);
            }
        }

        if (!features.length) {
            if (this.meshes && this.painter) {
                this.painter.deleteMesh(this.meshes);
                delete this.meshes;
            }
            if (this._markerMeshes) {
                this._markerPainter.deleteMesh(this._markerMeshes);
                delete this._markerMeshes;
            }
            if (this._lineMeshes) {
                this._linePainter.deleteMesh(this._lineMeshes);
                delete this._lineMeshes;
            }
        }
        if (center[3]) {
            center[0] /= center[3];
            center[1] /= center[3];
        }
        if (isNaN(center[0]) || isNaN(center[1])) {
            throw new Error(`invalid geometry coordinates for ${this.layer.getJSONType()}`);
        }
        return {
            features,
            center
        };
    }

    buildMesh(/*atlas*/) {
        // if (!this.painter) {
        //     return;
        // }
        // //TODO 更新symbol的优化
        // //1. 如果只影响texture，则只重新生成texture
        // //2. 如果不影响Geometry，则直接调用painter.updateSymbol
        // //3. Geometry和Texture全都受影响时，则全部重新生成
        // const { features, center } = this._getFeaturesToRender();
        // if (!features.length) {
        //     return;
        // }

        // this.createMesh(this.painter, this.PackClass, features, atlas, center).then(m => {
        //     if (this.meshes) {
        //         this.painter.deleteMesh(this.meshes);
        //     }
        //     const { mesh, atlas } = m;
        //     this.meshes = mesh;
        //     this.atlas = atlas;
        //     this.setToRedraw();
        // });
    }

    createVectorPacks(painter, PackClass, symbol, features, atlas, center) {
        if (!painter || !features || !features.length) {
            return Promise.resolve(null);
        }
        const options = {
            zoom: this.getMap().getZoom(),
            EXTENT: Infinity,
            requestor: this.requestor,
            atlas,
            center,
            positionType: Float32Array
        };

        const pack = new PackClass(features, symbol, options);
        return pack.load();
    }

    createMesh(painter, PackClass, symbol, features, atlas, center) {
        return this.createVectorPacks(painter, PackClass, symbol, features, atlas, center).then(packData => {
            return this._createMesh(packData, painter, PackClass, symbol, features, atlas, center);
        });
    }

    _createMesh(packData, painter, PackClass, symbol, features, atlas, center) {
        const v0 = [], v1 = [];
        if (!packData) {
            return null;
        }
        const geometries = painter.createGeometries([packData.data], convertToPainterFeatures(features, null, 0, symbol, this.layer));
        for (let i = 0; i < geometries.length; i++) {
            if (!geometries[i]) {
                continue;
            }
            this._fillCommonProps(geometries[i].geometry);
        }

        const tileTransform = mat4.identity([]);
        mat4.translate(tileTransform, tileTransform, vec3.set(v1, center[0], center[1], 0));
        mat4.scale(tileTransform, tileTransform, vec3.set(v0, 1, 1, this._zScale));
        // mat4.scale(posMatrix, posMatrix, vec3.set(v0, glScale, glScale, this._zScale));
        // const transform = mat4.translate([], mat4.identity([]), center);

        // mat4.translate(posMatrix, posMatrix, vec3.set(v0, tilePos.x * glScale, tilePos.y * glScale, 0));
        const meshes = painter.createMeshes(geometries, tileTransform, { tilePoint: [center[0], center[1]] });
        for (let i = 0; i < meshes.length; i++) {
            const mesh = meshes[i];
            mesh.properties.level = 0;
            mesh.properties.tileTransform = tileTransform;
            const defines = mesh.defines;
            //不开启ENABLE_TILE_STENCIL的话，frag中会用tileExtent剪切图形，会造成图形绘制不出
            defines['ENABLE_TILE_STENCIL'] = 1;
            mesh.setDefines(defines);
            mesh.properties.meshKey = this.layer.getId();
        }

        return {
            meshes,
            atlas: {
                iconAtlas: packData.data.iconAtlas
            }
        };
    }

    _addCoordsToCenter(geometry, center, coordinates) {
        for (let i = 0; i < geometry.length; i++) {
            if (!Array.isArray(geometry[i][0])) {
                if (!isNaN(+geometry[i][0]) && !isNaN(+geometry[i][1])) {
                    this._addCoord(center, geometry[i][0], geometry[i][1], geometry[i][2], 1, coordinates[i]);
                }
            } else {
                for (let ii = 0; ii < geometry[i].length; ii++) {
                    if (!Array.isArray(geometry[i][ii][0])) {
                        if (!isNaN(+geometry[i][ii][0]) && !isNaN(+geometry[i][ii][1])) {
                            this._addCoord(center, geometry[i][ii][0], geometry[i][ii][1], geometry[i][ii][2], 1, coordinates[i][ii]);
                        }
                    } else {
                        for (let iii = 0; iii < geometry[i][ii].length; iii++) {
                            if (!isNaN(+geometry[i][ii][iii][0]) && !isNaN(+geometry[i][ii][iii][1])) {
                                this._addCoord(center, geometry[i][ii][iii][0], geometry[i][ii][iii][1], geometry[i][ii][iii][2], 1, coordinates[i][ii][iii]);
                            }
                        }
                    }
                }
            }
        }
    }


    _addCoord(center, x, y, z, count, coordinates) {
        const needWarning = this.getMap().getProjection().isSphere();
        let invalid = false;
        if (coordinates[0] > 180 || coordinates[0] < -180) {
            invalid = true;
            if (needWarning && !warned) {
                warned = true;
                console.warn(`Layer(${this.layer.getId()}) has invalid longitude value: ${coordinates[0]}`);
            }
        }
        if (coordinates[1] > 90 || coordinates[1] < -90) {
            invalid = true;
            if (needWarning && !warned) {
                warned = true;
                console.warn(`Layer(${this.layer.getId()}) has invalid latitude value: ${coordinates[1]}`);
            }
        }
        if (invalid) {
            return;
        }
        center[0] += x;
        center[1] += y;
        center[2] += (z || 0);
        center[3] += count;
    }


    _fillCommonProps(geometry) {
        const glRes = this.getMap().getGLRes();
        const props = geometry.properties;
        props.tileResolution = glRes;
        props.tileRatio = 1;
        props.z = 1;
        props.tileExtent = 1;
        props.elements = geometry.elements;
        props.aPickingId = geometry.data.aPickingId;
    }

    _isEnableWorkAround(key) {
        if (key === 'win-intel-gpu-crash') {
            return this.layer.options['workarounds']['win-intel-gpu-crash'] && isWinIntelGPU(this.gl);
        }
        return false;
    }

    prepareRequestors() {
        if (this._iconRequestor) {
            return;
        }
        const layer = this.layer;
        this._iconRequestor = new IconRequestor({
            iconErrorUrl: layer.options['iconErrorUrl'],
            urlModifier: (url) => {
                const modifier = layer.getURLModifier();
                return modifier && modifier(url) || url;
            }
        });
        const useCharBackBuffer = !this._isEnableWorkAround('win-intel-gpu-crash');
        this._glyphRequestor = new GlyphRequestor(fn => {
            layer.getMap().getRenderer().callInNextFrame(fn);
        }, layer.options['glyphSdfLimitPerFrame'], useCharBackBuffer);
        this.requestor = this._fetchPattern.bind(this);
        this._markerRequestor = this._fetchIconGlyphs.bind(this);
    }

    _fetchPattern(icons, glyphs, cb) {
        const dataBuffers = [];
        this._iconRequestor.getIcons(icons, (err, data) => {
            if (err) {
                throw err;
            }
            if (data.buffers) {
                dataBuffers.push(...data.buffers);
            }
            cb(null, { icons: data.icons }, dataBuffers);
        });
    }

    _fetchIconGlyphs(icons, glyphs, cb) {
        //error, data, buffers
        this._glyphRequestor.getGlyphs(glyphs, (err, glyphData) => {
            if (err) {
                throw err;
            }
            const dataBuffers = glyphData.buffers || [];
            this._iconRequestor.getIcons(icons, (err, data) => {
                if (err) {
                    throw err;
                }
                if (data.buffers && data.buffers.length) {
                    dataBuffers.push(...data.buffers);
                }
                cb(null, { icons: data.icons, glyphs: glyphData.glyphs }, dataBuffers);
            });
        });
        //error, data, buffers

    }

    _buildMarkerMesh(atlas) {
        const markerUIDs = Object.keys(this._markerFeatures);
        const textUIDs = Object.keys(this._textFeatures);
        if (!markerUIDs.length && !textUIDs.length) {
            if (this._markerMeshes) {
                this._markerPainter.deleteMesh(this._markerMeshes);
                delete this._markerMeshes;
            }
            return;
        }

        const { features, center } = this._getFeaturesToRender(this._markerFeatures, this._textFeatures);

        const markerFeatures = [];
        const textFeatures = [];
        for (let i = 0; i < features.length; i++) {
            const kid = features[i][KEY_IDX_NAME];
            if (this._markerFeatures[kid]) {
                markerFeatures.push(features[i]);
            }
            if (this._textFeatures[kid]) {
                textFeatures.push(features[i]);
            }
        }
        if (!markerFeatures.length && !textFeatures.length) {
            if (this._markerMeshes) {
                this._markerPainter.deleteMesh(this._markerMeshes);
                delete this._markerMeshes;
            }
            return;
        }
        const showHideUpdated = this._showHideUpdated;
        this._markerCenter = center;
        const pointPacks = this._createPointPacks(markerFeatures, textFeatures, atlas, center);
        this._markerAtlas = {};
        const v0 = [], v1 = [];
        this._isCreatingMarkerMesh = true;
        Promise.all(pointPacks).then(packData => {
            if (this._markerMeshes) {
                this._markerPainter.deleteMesh(this._markerMeshes);
                delete this._markerMeshes;
            }
            if (!packData || !packData.length) {
                this.setToRedraw();
                return;
            }
            const geometries = this._markerPainter.createGeometries(packData.map(d => {
                if (d && d.data) {
                    // 让数据采用 featureIds 作为 collidedId
                    d.data.isIdUnique = true;
                }
                return d && d.data;
            }), this._allFeatures);

            for (let i = 0; i < geometries.length; i++) {
                this._fillCommonProps(geometries[i].geometry, packData[i] && packData[i].data);
            }
            const iconAtlas = packData[0] && packData[0].data.iconAtlas;
            const glyphAtlas = packData[0] && packData[0].data.glyphAtlas || packData[1] && packData[1].data.glyphAtlas;

            if (iconAtlas) {
                this._markerAtlas.iconAtlas = iconAtlas;
            }
            if (glyphAtlas) {
                this._markerAtlas.glyphAtlas = glyphAtlas;
            }

            const posMatrix = mat4.identity([]);
            //TODO 计算zScale时，zoom可能和tileInfo.z不同
            mat4.translate(posMatrix, posMatrix, vec3.set(v1, center[0], center[1], 0));
            mat4.scale(posMatrix, posMatrix, vec3.set(v0, 1, 1, this._zScale));
            // mat4.scale(posMatrix, posMatrix, vec3.set(v0, glScale, glScale, this._zScale))
            const meshes = this._markerPainter.createMeshes(geometries, posMatrix);
            for (let i = 0; i < meshes.length; i++) {
                meshes[i].geometry.properties.originElements = meshes[i].geometry.properties.elements.slice();
                meshes[i].properties.level = 0;
                meshes[i].material.set('flipY', 1);
                meshes[i].properties.meshKey = meshUID++;
            }
            this._markerMeshes = meshes;
            if (showHideUpdated) {
                this._showHideUpdated = true;
            }
            this._isCreatingMarkerMesh = false;
            this.setToRedraw();
            this.layer.fire('buildmarkermesh');
        });
    }

    _updateMeshVisible() {
        if (this._markerMeshes) {
            this._updateVisElements(this._markerMeshes[0], this._markerFeatures);
            this._updateVisElements(this._markerMeshes[1], this._textFeatures);
            if (this._markerMeshes[0]) {
                this._markerPainter.prepareCollideIndex(this._markerMeshes[0].geometry);
            }
            if (this._markerMeshes[1]) {
                this._markerPainter.prepareCollideIndex(this._markerMeshes[1].geometry);
            }

        }
        if (this._lineMeshes) {
            for (let i = 0; i < this._lineMeshes.length; i++) {
                this._updateVisElements(this._lineMeshes[i], this._lineFeatures);
            }
        }
        if (this.meshes) {
            for (let i = 0; i < this.meshes.length; i++) {
                this._updateVisElements(this.meshes[i], this._allFeatures);
            }
        }
    }

    _updateVisElements(mesh, features) {
        if (!mesh) {
            return;
        }
        const { aPickingId, originElements } = mesh.geometry.properties;
        const newElements = [];
        for (let j = 0; j < originElements.length; j++) {
            const kid = aPickingId[originElements[j]];
            if (features[kid] && features[kid].feature.visible) {
                newElements.push(originElements[j]);
            }
        }
        //这里需要替换elements，是因为iconPainter和textPainter中可能会计算collision，需要读取elements
        const arr = mesh.geometry.properties.elements = new originElements.constructor(newElements);
        mesh.geometry.setElements(arr);
    }

    _createPointPacks(markerFeatures, textFeatures, atlas, center) {
        const markerOptions = {
            zoom: this.getMap().getZoom(),
            EXTENT: Infinity,
            requestor: this._markerRequestor,
            atlas,
            center,
            positionType: Float32Array,
            defaultAltitude: 0,
            forceAltitudeAttribute: true,
            markerWidthType: Uint16Array,
            markerHeightType: Uint16Array
        };
        const textOptions = extend({}, markerOptions);
        markerOptions.allowEmptyPack = 1;

        const symbols = PointPack.splitPointSymbol(this._markerSymbol);
        return symbols.map((symbol, idx) => {
            return new PointPack(idx === 0 ? markerFeatures : textFeatures, symbol, idx === 0 ? markerOptions : textOptions).load();
        });
    }

    updateMesh() { }

    _updateMarkerMesh(marker) {
        const symbols = marker['_getInternalSymbol']();
        const options = { zoom: this.getMap().getZoom(), isVector3D: true };
        const uid = this._convertGeo(marker);
        if (!this._markerMeshes) {
            return false;
        }
        let feature = this.features[uid];
        if (!Array.isArray(feature)) {
            feature = [feature];
        }
        const params = [];
        const markerFeatures = [];
        const textFeatures = [];
        const zoom = this.getMap().getZoom();
        let loadedSymbols;
        if (Array.isArray(symbols)) {
            loadedSymbols = symbols.map(symbol => {
                if (!symbol) { return symbol; }
                return loadFunctionTypes(symbol, () => {
                    params[0] = zoom;
                    return params;
                });
            });
        } else {
            loadedSymbols = loadFunctionTypes(symbols, () => {
                params[0] = zoom;
                return params;
            });
        }

        let symbolFnTypes;
        if (Array.isArray(symbols)) {
            symbolFnTypes = symbols.map(symbol => {
                if (!symbol) { return symbol; }
                return VectorPack.genFnTypes(symbol);
            });
        } else {
            symbolFnTypes = VectorPack.genFnTypes(symbols);
        }
        // 检查是否atlas需要重新创建，如果需要，则重新创建整个mesh
        for (let i = 0; i < feature.length; i++) {
            const fea = feature[i];
            if (!fea) {
                continue;
            }
            const symbolDef = Array.isArray(symbols) ? symbols[i] : symbols;
            const symbol = Array.isArray(loadedSymbols) ? loadedSymbols[i] : loadedSymbols;
            const fnTypes = Array.isArray(symbolFnTypes) ? symbolFnTypes[i] : symbolFnTypes;
            const styledPoint = new StyledPoint(feature, symbolDef, symbol, fnTypes, options);
            const iconGlyph = styledPoint.getIconAndGlyph();
            if (!this._markerAtlas || !PointPack.isAtlasLoaded(iconGlyph, this._markerAtlas)) {
                this._markRebuild();
                this.setToRedraw();
                return false;
            }
        }


        for (let i = 0; i < feature.length; i++) {
            const kid = feature[i][KEY_IDX_NAME];
            if (this._markerFeatures[kid]) {
                markerFeatures.push(feature[i]);
            }
            if (this._textFeatures[kid]) {
                textFeatures.push(feature[i]);
            }
        }

        const feaId = feature[0].id;
        const pointPacks = this._createPointPacks(markerFeatures, textFeatures, this._markerAtlas, this._markerCenter);
        const markerMeshes = this._markerMeshes;
        Promise.all(pointPacks).then(packData => {
            for (let i = 0; i < packData.length; i++) {
                if (!packData[i]) {
                    continue;
                }
                if (packData[i].data) {
                    packData[i].data.isIdUnique = true;
                }
                const mesh = markerMeshes[i];
                const aFeaIds = mesh.geometry.properties.aFeaIds;
                const startIndex = aFeaIds.indexOf(feaId);
                if (startIndex < 0) {
                    continue;
                }
                const count = packData[i].data.featureIds.length;
                const dynamicAttrs = packData[i].data.dynamicAttributes;
                for (const p in packData[i].data.data) {
                    if (p === 'aPickingId') {
                        continue;
                    }
                    if (dynamicAttrs[p]) {
                        continue;
                    }
                    const data = packData[i].data.data[p];
                    if (data) {
                        mesh.geometry.updateSubData(p, data, startIndex * data.length / count);
                    }
                }
            }
            this.setToRedraw();

        });
        return true;
    }

    _updateLineMesh(target) {
        return this._updateMesh(target, this._lineMeshes, this._lineAtlas, this._lineCenter, this._linePainter, LinePack, LINE_SYMBOL, this._groupLineFeas);
    }

    _updateMesh(target, meshes, atlas, center, painter, PackClass, globalSymbol, groupFeaturesFn) {
        if (!meshes) {
            return false;
        }
        if (!atlas) {
            this._markRebuild();
            this.setToRedraw();
            return false;
        }
        const symbols = target['_getInternalSymbol']();
        const options = { zoom: this.getMap().getZoom() };
        const uid = target[ID_PROP];
        let feature = this.features[uid];
        if (!Array.isArray(feature)) {
            feature = [feature];
        }
        const features = [];
        // 检查是否atlas需要重新创建，如果需要，则重新创建整个mesh
        for (let i = 0; i < feature.length; i++) {
            const fea = feature[i];
            if (!fea) {
                continue;
            }
            const symbol = Array.isArray(symbols) ? symbols[i] : symbols;
            const fnTypes = VectorPack.genFnTypes(symbol);
            const styledVector = new StyledVector(feature, symbol, fnTypes, options);
            const res = PackClass === LinePack ? styledVector.getLineResource() : styledVector.getPolygonResource();
            if (!VectorPack.isAtlasLoaded(res, atlas[i])) {
                this._markRebuild();
                this.setToRedraw();
                return false;
            }
            features.push(fea);
        }

        const feaId = feature[0].id
        const featureGroups = groupFeaturesFn.call(this, features);
        // 判断 feature 所属的featureGroup是否发生变化，如果发生变化，则需要重新生成mesh, fuzhenn/maptalks-studio#2413
        for (let i = 0; i < featureGroups.length; i++) {
            if (featureGroups[i].length) {
                const mesh = meshes.filter(m => m.feaGroupIndex === i);
                if (!mesh.length) {
                    this._markRebuild();
                    this.setToRedraw();
                    return false;
                } else {
                    const aFeaIds = mesh[0].geometry.properties.aFeaIds;
                    const startIndex = aFeaIds.indexOf(feaId);
                    if (startIndex < 0) {
                        this._markRebuild();
                        this.setToRedraw();
                        return false;
                    }
                }
            }
        }

        const symbol = extend({}, globalSymbol);
        const packs = featureGroups.map(feas =>
            this.createVectorPacks(painter, PackClass, symbol, feas, atlas[0], center)
        );


        Promise.all(packs).then(packData => {
            for (let i = 0; i < packData.length; i++) {
                let mesh;
                if (Array.isArray(meshes)) {
                    for (let j = 0; j < meshes.length; j++) {
                        if (meshes[j].feaGroupIndex === i) {
                            mesh = meshes[j];
                            break;
                        }
                    }
                } else {
                    mesh = meshes;
                }
                if (!mesh) {
                    continue;
                }
                this._updateMeshData(mesh, feaId, packData[i]);
            }
        });
        return true;
    }

    _updateMeshData(mesh, feaId, packData) {
        const aFeaIds = mesh.geometry.properties.aFeaIds;
        const startIndex = aFeaIds.indexOf(feaId);
        if (startIndex < 0) {
            return;
        }
        if (!packData) {
            let walker = startIndex + 1;
            while (aFeaIds[walker] === feaId) {
                walker++;
            }
            const length = walker - startIndex;
            const positionSize = mesh.geometry.desc.positionSize;
            if (EMPTY_POSITION.length !== length * 3) {
                EMPTY_POSITION = new Float32Array(length * positionSize);
                EMPTY_POSITION.fill(-Infinity, 0);
            }
            mesh.geometry.updateSubData(mesh.geometry.desc.positionAttribute, EMPTY_POSITION, startIndex * positionSize);
        } else {
            const dynamicAttrs = packData.data.dynamicAttributes;
            const count = packData.data.featureIds.length;
            const datas = packData.data.data;
            for (const p in datas) {
                if (dynamicAttrs[p]) {
                    // 如果该属性是dynamic（值里包含了function-type），在之前的检查中会rebuild，所以这里不可能出现dynamic attribute
                    continue;
                }
                if (hasOwn(datas, p) && datas[p]) {
                    const data = datas[p];
                    mesh.geometry.updateSubData(p, data, startIndex * data.length / count);
                }
            }
        }
        this.layer.fire('updatemesh');
        this.setToRedraw();
    }

    _buildLineMesh(atlas) {
        const lineUIDs = Object.keys(this._lineFeatures);
        if (!lineUIDs.length) {
            if (this._lineMeshes) {
                this._linePainter.deleteMesh(this._lineMeshes);
                delete this._lineMeshes;
            }
            return;
        }
        const { features, center } = this._getFeaturesToRender(this._lineFeatures);
        if (!features.length) {
            return;
        }
        const showHideUpdated = this._showHideUpdated;
        this._lineCenter = center;

        const featureGroups = this._groupLineFeas(features);

        const symbol = extend({}, LINE_SYMBOL);
        const promises = featureGroups.map((feas, i) =>
            this.createMesh(this._linePainter, LinePack, symbol, feas, atlas && atlas[i], center)
        );

        this._isCreatingLineMesh = true;
        Promise.all(promises).then(mm => {
            if (this._lineMeshes) {
                this._linePainter.deleteMesh(this._lineMeshes);
            }
            const meshes = [];
            const atlas = [];
            for (let i = 0; i < mm.length; i++) {
                const childMeshes = mm[i] && mm[i].meshes;
                if (childMeshes) {
                    for (let j = 0; j < childMeshes.length; j++) {
                        const mesh = childMeshes[j];
                        mesh.feaGroupIndex = i;
                        meshes.push(mesh);
                        mesh.geometry.properties.originElements = mesh.geometry.properties.elements.slice();
                    }
                    atlas[i] = mm[i].atlas;
                }
            }
            this._lineMeshes = meshes;
            this._lineAtlas = atlas;
            if (showHideUpdated) {
                this._showHideUpdated = showHideUpdated;
            }
            this._isCreatingLineMesh = false;
            this.setToRedraw();
            this.layer.fire('buildlinemesh');
        });
    }

    _groupLineFeas(features) {
        //因为有虚线和没有虚线的line绘制逻辑不同，需要分开创建mesh
        const dashKeyName = (prefix + 'lineDasharray').trim();
        const patternKeyName = (prefix + 'linePatternFile').trim();
        const feas = [];
        const patternFeas = [];
        const dashFeas = [];
        for (let i = 0; i < features.length; i++) {
            const f = features[i];
            const dash = f.properties && f.properties[dashKeyName];
            if (dash && dashLength(dash)) {
                dashFeas.push(f);
            } else if (f.properties && f.properties[patternKeyName]) {
                patternFeas.push(f);
            } else {
                feas.push(f);
            }
        }
        return [feas, patternFeas, dashFeas];
    }

    _markRebuildGeometry() {
        this._dirtyGeo = true;
        this.setToRedraw();
    }

    _markRebuild() {
        this._dirtyAll = true;
        this.setToRedraw();
    }


    _convertGeometries(geometries) {
        const layerId = this.layer.getId();
        for (let i = 0; i < geometries.length; i++) {
            const geo = geometries[i];
            let hit = false;
            for (let ii = 0; ii < this.GeometryTypes.length; ii++) {
                if (geo instanceof this.GeometryTypes[ii]) {
                    hit = true;
                    break;
                }
            }
            if (!hit) {
                throw new Error(`${geo.getJSONType()} can't be added to ${this.layer.getJSONType()}(id:${layerId}).`);
            }

            this._convertGeo(geo);
        }
    }

    _convertGeo(geo) {
        if (geo[ID_PROP] === undefined) {
            geo[ID_PROP] = this._counter++;
        }
        const uid = geo[ID_PROP];
        if (this.features[uid]) {
            this._removeFeatures(uid);
        }
        this.features[uid] = convertToFeature(geo, this._kidGen, this.features[uid]);
        const feas = this.features[uid];
        this._refreshFeatures(feas, uid);
        this._geometries[uid] = geo;
        return uid;
    }

    _refreshFeatures(feas, uid) {
        if (!feas) {
            return;
        }
        const feaId = Array.isArray(feas) ? feas[0].id : feas.id;
        this._featureMapping[feaId] = feas;
        if (Array.isArray(feas)) {
            // 但geometry多symbol时，markerFeatures中只会保存最后一个feature的属性
            for (let j = 0; j < feas.length; j++) {
                // kid 是painter内部用来
                const kid = feas[j][KEY_IDX_NAME];
                feas[j][ID_PROP] = uid;
                this._allFeatures[kid] = { feature: feas[j] };
                this._allFeatures[kid][ID_PROP] = uid;
                // 采用 { feature } 结构，是为了和VT图层中 { feature, symbol } 统一
                if (!this.needCheckPointLineSymbols()) {
                    continue;
                }
                const feaObj = { feature: feas[j] };
                // maptalks/issues#532
                // marker没有marker样式时也应该绘制，否则text会因为缺少对应的marker，在创建collision时出现错误
                if (hasMarkerSymbol(feas[j]) || hasTextSymbol(feas[j])) {
                    this._markerFeatures[kid] = feaObj;
                    // this._markerFeatures[kid].push(feaObj);
                }
                if (hasTextSymbol(feas[j])) {
                    this._textFeatures[kid] = feaObj;
                    // this._textFeatures[kid].push(feaObj);
                }
                if (hasLineSymbol(feas[j])) {
                    this._lineFeatures[kid] = feaObj;
                    // this._lineFeatures[uid].push(feaObj);
                }
            }
        } else {
            feas[ID_PROP] = uid;
            const feaObj = { feature: feas };
            const kid = feas[KEY_IDX_NAME];
            this._allFeatures[kid] = feaObj;
            if (!this.needCheckPointLineSymbols()) {
                return;
            }
            if (hasMarkerSymbol(feas) || hasTextSymbol(feas)) {
                this._markerFeatures[kid] = feaObj;
            }
            if (hasTextSymbol(feas)) {
                this._textFeatures[kid] = feaObj;
            }
            if (hasLineSymbol(feas)) {
                this._lineFeatures[kid] = feaObj;
            }
        }
    }

    needCheckPointLineSymbols() {
        return true;
    }

    _removeFeatures(uid) {
        const features = this.features[uid];
        if (!features) {
            return;
        }
        if (Array.isArray(features)) {
            for (let i = 0; i < features.length; i++) {
                const id = features[i][KEY_IDX_NAME];
                const feaId = features[i].id;
                delete this._featureMapping[feaId];
                delete this._allFeatures[id];
                delete this._markerFeatures[id];
                delete this._textFeatures[id];
                delete this._lineFeatures[id];
            }
        } else {
            const id = features[KEY_IDX_NAME];
            const feaId = features.id;
            delete this._featureMapping[feaId];
            delete this._allFeatures[id];
            delete this._markerFeatures[id];
            delete this._textFeatures[id];
            delete this._lineFeatures[id];
        }
    }

    pick(x, y, options) {
        const hits = [];
        if (!this.layer.isVisible()) {
            return hits;
        }
        const painters = [this.painter, this._markerPainter, this._linePainter];
        painters.forEach(painter => {
            if (!painter) {
                return;
            }
            const picked = painter.pick(x, y, options.tolerance);
            if (picked && picked.data && picked.data.feature) {
                const feature = picked.data.feature;
                const geometry = this._geometries[feature[ID_PROP]];
                if (options && options.includeInternals) {
                    // from Map.GeometryEvents
                    hits.push(geometry);
                } else {
                    picked.geometry = geometry;
                    delete picked.plugin;
                    delete picked.data;
                    delete picked.point;
                    hits.push(picked);
                }
            }
        });
        return hits;
    }

    _getFeaKeyId(geo) {
        const uid = geo[ID_PROP];
        const features = this.features[uid];
        return Array.isArray(features) ? features[0][KEY_IDX_NAME] : features[KEY_IDX_NAME];
    }

    _updateDirtyTargets() {
        let updated = false;
        for (const p in this._dirtyTargetsInCurrentFrame) {
            const target = this._dirtyTargetsInCurrentFrame[p];
            const kid = this._getFeaKeyId(target);
            if (!this._isCreatingMarkerMesh && (this._markerFeatures[kid] || this._textFeatures[kid])) {
                const partial = this._updateMarkerMesh(target);
                updated = updated || partial;
            }
            if (!this._isCreatingLineMesh && this._lineFeatures[kid]) {
                const partial = this._updateLineMesh(target);
                updated = updated || partial;
            }
            if (!this._isCreatingMesh) {
                const partial = this.updateMesh(target);
                updated = updated || partial;
            }
        }
        this._dirtyTargetsInCurrentFrame = {};
        if (updated) {
            redraw(this);
            this.layer.fire('partialupdate');
        }
    }

    _convertAndRebuild(geo) {
        this._convertGeo(geo);
        this._markRebuild();
        redraw(this);
    }

    onGeometryAdd(geometries) {
        this.setToRedraw();
        if (!this.canvas) {
            // 说明createContext还没有调用，createContext中同样也会调用该方法，避免重复调用。
            return;
        }
        if (!geometries || !geometries.length) {
            return;
        }
        this._convertGeometries(geometries);
        this._markRebuild();
        redraw(this);
    }

    onGeometryRemove(geometries) {
        if (!geometries || !geometries.length) {
            return;
        }
        for (let i = 0; i < geometries.length; i++) {
            const geo = geometries[i];
            const uid = geo[ID_PROP];
            if (uid !== undefined) {
                delete this._geometries[uid];
                this._removeFeatures(uid);
                delete this.features[uid];
            }
        }
        this._markRebuild();
        redraw(this);
    }

    onGeometrySymbolChange(e) {
        // const { properties } = e;
        //TODO 判断properties中哪些只需要调用painter.updateSymbol
        // 如果有，则更新 this.painterSymbol 上的相应属性，以触发painter中的属性更新
        const geo = e.target['_getParent']() || e.target;
        const id = geo[ID_PROP];
        if (id === undefined) {
            return;
        }
        let props = e.properties;
        if (Array.isArray(props)) {
            const allChangedProps = {};
            for (let i = 0; i < props.length; i++) {
                if (props[i]) {
                    extend(allChangedProps, props[i]);
                }
            }
            props = allChangedProps;
        } else if (props && props[0] !== undefined) {
            // a bug in maptalks, 数组类型的symbol会被转成对象形式返回
            const allChangedProps = {};
            for (const p in props) {
                if (props[p]) {
                    extend(allChangedProps, props[p]);
                }
            }
            props = allChangedProps;
        }
        for (const p in props) {
            if (hasOwn(props, p)) {
                if (SYMBOLS_NEED_REBUILD_IN_VECTOR[p]) {
                    this._convertAndRebuild(geo);
                    return;
                }
            }
        }

        const symbol = geo['_getInternalSymbol']();
        const feas = this.features[id];
        this._convertGeo(geo);
        if (feas) {
            if (!compareSymbolCount(symbol, feas)) {
                this._convertAndRebuild(geo);
                return;
            }
            if (Array.isArray(symbol)) {
                for (let i = 0; i < symbol.length; i++) {
                    const s = symbol[i];
                    if (!compareSymbolProp(s, feas[i])) {
                        this._convertAndRebuild(geo);
                        return;
                    }
                }
            } else if (!compareSymbolProp(symbol, feas)) {
                this._convertAndRebuild(geo);
                return;
            }
        } else {
            this._convertAndRebuild(geo);
            return;
        }
        this.onGeometryPositionChange(e);
    }

    onGeometryShapeChange(e) {
        const target = e.target['_getParent']() || e.target;
        const uid = target[ID_PROP];
        if (uid === undefined) {
            return;
        }
        // const geojson = convertToFeature(target, { id: 0 });
        // const coordJSON = geojson.geometry;
        // const features = this.features[uid];
        // const currentFea =  Array.isArray(features) ? features[0] : features;
        // if (compareCoordSize(coordJSON, currentFea.geometry)) {
        //     // 当数据的端点数量不变时，可以进行局部更新
        //     // 但不适用lineMesh，因lineMesh因为会因为lineJoin角度变化，生成的实际端点数量会变化，无法局部更新
        //     if (this._lineMeshes) {
        //         this._dirtyLine = true;
        //     }
        //     this.onGeometryPositionChange(e);
        //     return;
        // }
        this._convertGeometries([target]);
        this._markRebuildGeometry();
        redraw(this);
    }

    onGeometryPositionChange(e) {
        const target = e.target['_getParent']() || e.target;
        const uid = target[ID_PROP];
        if (uid === undefined) {
            return;
        }
        this._convertGeometries([target]);
        // 为应对同一个数据的频繁修改，发生变化的数据留到下一帧再统一修改
        this._dirtyTargetsInCurrentFrame[uid] = target;
        redraw(this);
    }

    onGeometryZIndexChange(e) {
        const target = e.target['_getParent']() || e.target;
        const uid = target[ID_PROP];
        if (uid === undefined) {
            return;
        }
        this._markRebuild();
    }

    onGeometryShow(e) {
        const target = e.target['_getParent']() || e.target;
        const uid = target[ID_PROP];
        if (uid === undefined) {
            return;
        }
        this._onShowHide(e);
    }

    onGeometryHide(e) {
        const target = e.target['_getParent']() || e.target;
        const uid = target[ID_PROP];
        if (uid === undefined) {
            return;
        }
        this._onShowHide(e);
    }

    _onShowHide(e) {
        const geo =  e.target['_getParent']() || e.target;
        const uid = geo[ID_PROP];
        const features = this.features[uid];
        if (features) {
            const visible = geo.isVisible();
            if (Array.isArray(features)) {
                if (visible === features[0].visible) {
                    return;
                }
                for (let i = 0; i < features.length; i++) {
                    features[i].visible = visible;
                }
            } else {
                if (visible === features.visible) {
                    return;
                }
                features.visible = visible;
            }
            this._markShowHide();
            redraw(this);
        }
    }

    _markShowHide() {
        this._showHideUpdated = true;
    }

    onGeometryPropertiesChange(e) {
        //TODO 可能会更新textName
        // this._markRebuildGeometry();
        const geo = e.target['_getParent']() || e.target;
        const uid = geo[ID_PROP];
        if (uid === undefined) {
            return;
        }
        this.features[uid] = convertToFeature(geo, this._kidGen);
        this._refreshFeatures(this.features[uid], uid);
        this._markRebuild();
        redraw(this);
    }

    createContext() {
        const inGroup = this.canvas.gl && this.canvas.gl.wrap;
        if (inGroup) {
            this.gl = this.canvas.gl.wrap();
            this.regl = this.canvas.gl.regl;
        } else {
            this._createREGLContext();
        }
        if (inGroup) {
            this.canvas.pickingFBO = this.canvas.pickingFBO || this.regl.framebuffer(this.canvas.width, this.canvas.height);
        }
        this.prepareRequestors();
        this.pickingFBO = this.canvas.pickingFBO || this.regl.framebuffer(this.canvas.width, this.canvas.height);
        this.painter = this.createPainter();
        const IconPainter = Vector3DLayer.get3DPainterClass('icon');
        let bloomSymbols = IconPainter.getBloomSymbol();
        const markerSymbol = extend({}, MARKER_SYMBOL, TEXT_SYMBOL);
        markerSymbol.markerPerspectiveRatio = this.layer.options['markerPerspectiveRatio'] || 0;
        this._defineSymbolBloom(markerSymbol, bloomSymbols);
        this._markerSymbol = markerSymbol;
        const sceneConfig = extend({}, ICON_PAINTER_SCENECONFIG, this.layer.options.sceneConfig || {});
        this._markerPainter = new IconPainter(this.regl, this.layer, markerSymbol, sceneConfig, 0);
        this._markerPainter.setTextShaderDefines({
            'REVERSE_MAP_ROTATION_ON_PITCH': 1
        });

        const LinePainter = Vector3DLayer.get3DPainterClass('line');
        const lineSymbol = extend({}, LINE_SYMBOL);
        bloomSymbols = LinePainter.getBloomSymbol();
        this._defineSymbolBloom(lineSymbol, bloomSymbols);
        this._lineSymbol = lineSymbol;
        const lineSceneConfig = extend({}, this.layer.options.sceneConfig || {});
        if (lineSceneConfig.depthMask === undefined) {
            lineSceneConfig.depthMask = true;
        }
        this._linePainter = new LinePainter(this.regl, this.layer, lineSymbol, lineSceneConfig, 0);

        if (this.layer.getGeometries()) {
            this.onGeometryAdd(this.layer.getGeometries());
        }
    }

    _isInGroupGLLayer() {
        const inGroup = this.canvas && this.canvas.gl && this.canvas.gl.wrap;
        return !!inGroup;
    }

    _defineSymbolBloom(symbol, keys) {
        for (let i = 0; i < keys.length; i++) {
            symbol[keys[i]] = this.layer.options['enableBloom'];
        }
    }

    updateBloom(enableBloom) {
        if (this._markerPainter) {
            this._updatePainterBloom(this._markerPainter, this._markerSymbol, enableBloom);
        }
        if (this._linePainter) {
            this._updatePainterBloom(this._linePainter, this._lineSymbol, enableBloom);
        }
        if (this.painter) {
            this._updatePainterBloom(this.painter, this.painterSymbol, enableBloom);
        }
    }

    _updatePainterBloom(painter, targetSymbol, enableBloom) {
        const bloomSymbols = painter.constructor.getBloomSymbol();
        const symbol = bloomSymbols.reduce((v, currentValue) => {
            v[currentValue] = enableBloom;
            targetSymbol[currentValue] = enableBloom;
            return v;
        }, {});
        painter.updateSymbol(symbol, targetSymbol);
    }

    createPainter() {

    }

    _createREGLContext() {
        const layer = this.layer;

        const attributes = layer.options.glOptions || {
            alpha: true,
            depth: true,
            stencil: true,
            antialias: false
            // premultipliedAlpha : false
        };
        attributes.preserveDrawingBuffer = true;
        attributes.stencil = true;
        this.glOptions = attributes;
        this.gl = this.gl || this._createGLContext(this.canvas, attributes);
        this.regl = createREGL({
            gl: this.gl,
            attributes,
            extensions: reshader.Constants['WEBGL_EXTENSIONS'],
            optionalExtensions: reshader.Constants['WEBGL_OPTIONAL_EXTENSIONS']
        });
    }

    _createGLContext(canvas, options) {
        const names = ['webgl', 'experimental-webgl'];
        let context = null;
        /* eslint-disable no-empty */
        for (let i = 0; i < names.length; ++i) {
            try {
                context = canvas.getContext(names[i], options);
            } catch (e) { }
            if (context) {
                break;
            }
        }
        return context;
        /* eslint-enable no-empty */
    }

    clearCanvas() {
        super.clearCanvas();
        if (!this.regl) {
            return;
        }
        //这里必须通过regl来clear，如果直接调用webgl context的clear，则brdf的texture会被设为0
        this.regl.clear({
            color: [0, 0, 0, 0],
            depth: 1,
            stencil: 0xFF
        });
    }

    resizeCanvas(canvasSize) {
        super.resizeCanvas(canvasSize);
        const canvas = this.canvas;
        if (!canvas) {
            return;
        }
        if (this.pickingFBO && (this.pickingFBO.width !== canvas.width || this.pickingFBO.height !== canvas.height)) {
            this.pickingFBO.resize(canvas.width, canvas.height);
        }
        if (this.painter) {
            this.painter.resize(canvas.width, canvas.height);
        }
    }

    onRemove() {
        super.onRemove();
        if (this.painter) {
            this.painter.delete();
            delete this.painter;
        }
        if (this._markerPainter) {
            this._markerPainter.delete();
            delete this._markerPainter;
        }
        if (this._linePainter) {
            this._linePainter.delete();
            delete this._linePainter;
        }
    }

    drawOutline(fbo) {
        if (this._outlineAll) {
            if (this.painter) {
                this.painter.outlineAll(fbo);
            }
            this._markerPainter.outlineAll(fbo);
            this._linePainter.outlineAll(fbo);
        }
        if (this._outlineFeatures) {
            for (let i = 0; i < this._outlineFeatures.length; i++) {
                if (this.painter) {
                    this.painter.outline(fbo, this._outlineFeatures[i]);
                }
                this._markerPainter.outline(fbo, this._outlineFeatures[i]);
                this._linePainter.outline(fbo, this._outlineFeatures[i]);

            }
        }
    }

    outlineAll() {
        this._outlineAll = true;
        this.setToRedraw();
    }

    outline(geoIds) {
        if (!this._outlineFeatures) {
            this._outlineFeatures = [];
        }

        const featureIds = [];
        for (let i = 0; i < geoIds.length; i++) {
            const geo = this.layer.getGeometryById(geoIds[i]);
            if (geo) {
                const features = this.features[geo[ID_PROP]];
                if (Array.isArray(features)) {
                    for (let j = 0; j < features.length; j++) {
                        featureIds.push(features[j].id);
                    }
                } else {
                    featureIds.push(features.id);
                }
            }
        }
        this._outlineFeatures.push(featureIds);
        this.setToRedraw();
    }

    cancelOutline() {
        delete this._outlineAll;
        delete this._outlineFeatures;
        this.setToRedraw();
    }

    isEnableWorkAround(key) {
        if (key === 'win-intel-gpu-crash') {
            return this.layer.options['workarounds']['win-intel-gpu-crash'] && isWinIntelGPU(this.gl);
        }
        return false;
    }

    // _getCentiMeterScale(z) {
    //     const map = this.getMap();
    //     const p = map.distanceToPoint(1000, 0, z).x;
    //     return p / 1000 / 10;
    // }
    _getCentiMeterScale(res) {
        const map = this.getMap();
        return getCentiMeterScale(res, map);
    }

    _onSpatialReferenceChange() {
        const geometries = this.layer.getGeometries();
        if (geometries) {
            this._convertGeometries(geometries);
        }
        this._markRebuild();
    }

    _getLayerOpacity() {
        const layerOpacity = this.layer.options['opacity'];
        // 不在GroupGLLayer中时，MapCanvasRenderer会读取opacity并按照透明度绘制，所以layerOpacity设成1
        return this._isInGroupGLLayer() ? (isNil(layerOpacity) ? 1 : layerOpacity) : 1;
    }
}

function redraw(renderer) {
    renderer.setToRedraw();
}

function isWinIntelGPU(gl) {
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (debugInfo && typeof navigator !== 'undefined') {
        //e.g. ANGLE (Intel(R) HD Graphics 620
        const gpu = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
        const win = navigator.platform === 'Win32' || navigator.platform === 'Win64';
        if (gpu && gpu.toLowerCase().indexOf('intel') >= 0 && win) {
            return true;
        }
    }
    return false;
}

export default Vector3DLayerRenderer;

function hasMarkerSymbol({ properties }) {
    const markerFileName = (prefix + 'markerFile').trim();
    const markerTypeName = (prefix + 'markerType').trim();
    return properties[markerFileName] || properties[markerTypeName];
}

function hasTextSymbol({ properties }) {
    const keyName = (prefix + 'textName').trim();
    return properties[keyName];
}

const lineWidthName = (prefix + 'lineWidth').trim();
const lineGradientPropertyName = (LINE_GRADIENT_PROP_KEY + '').trim();

function hasLineSymbol(fea) {
    return fea.type === 2 && !fea.properties[lineGradientPropertyName] || (fea.type === 3 && (fea.properties[lineWidthName] !== undefined));
}

function dashLength(dash) {
    if (!Array.isArray(dash)) {
        return 0;
    }
    let len = 0;
    for (let i = 0; i < dash.length; i++) {
        len += dash[i];
    }
    return len;
}

// function compareCoordSize(coords0, coords1) {
//     if (coords0.length !== coords1.length) {
//         return false;
//     }
//     if (Array.isArray(coords0[0]) && Array.isArray(coords1[0])) {
//         for (let i = 0; i < coords0.length; i++) {
//             if (!compareCoordSize(coords0[0], coords1[0])) {
//                 return false;
//             }
//         }
//     } else if (Array.isArray(coords0[0]) || Array.isArray(coords1[0])) {
//         return false;
//     }
//     return true;
// }

function compareSymbolCount(symbol, feas) {
    if (Array.isArray(symbol)) {
        if (!Array.isArray(feas)) {
            return false;
        } else {
            return symbol.length === feas.length;
        }
    } else {
        return !Array.isArray(feas);
    }
}

function compareSymbolProp(symbol, feature) {
    const props = Object.keys(symbol).sort().join();
    const feaProps = Object.keys(feature.properties || {}).filter(p => p.indexOf(prefix) === 0).map(p => p.substring(prefix.length)).sort().join();
    if (props !== feaProps) {
        return false;
    }
    for (const p in symbol) {
        if (hasOwn(symbol, p)) {
            const keyName = (prefix + p).trim();
            // 如果有fn-type的属性被更新，则重新rebuild all
            if (isFunctionDefinition(symbol[p]) !== isFunctionDefinition(feature.properties[keyName])) {
                return false;
            }
        }
    }
    return true;
}
