import { vec2, vec3, vec4, mat2, mat4, reshader, quat } from '@maptalks/gl';
import { interpolated, isFunctionDefinition } from '@maptalks/function-type';
import CollisionPainter from './CollisionPainter';
import { extend, isNil } from '../Util';
import { getCharOffset } from './util/get_char_offset';
import { projectLine } from './util/projection';
import { getLabelNormal } from './util/get_label_normal';
import vert from './glsl/text.vert';
import vertAlongLine from './glsl/text.line.vert';
import frag from './glsl/text.frag';
import pickingVert from './glsl/text.vert';
import linePickingVert from './glsl/text.line.vert';
import { projectPoint } from './util/projection';
import { getShapeMatrix } from './util/box_util';
import { createTextMesh, DEFAULT_UNIFORMS, createTextShader, GAMMA_SCALE, getTextFnTypeConfig, isLabelCollides, getLabelEntryKey } from './util/create_text_painter';
import { GLYPH_SIZE } from './Constant';
import { getCentiMeterScale } from '../../../common/Util';
import { INVALID_PROJECTED_ANCHOR, INVALID_ALTITUDE } from '../../../common/Constant';
import { getVectorPacker } from '../../../packer/inject';

const { TextUtil, PackUtil, FilterUtil, TEXT_MAX_ANGLE } = getVectorPacker();

const shaderFilter0 = function (mesh) {
    const renderer = this.layer.getRenderer();
    return !this._isHalo0(mesh) && renderer.isTileNearCamera(mesh) && mesh.geometry.properties.textPlacement !== 'line';
};

const shaderFilterN = function (mesh) {
    const renderer = this.layer.getRenderer();
    return !this._isHalo0(mesh) && !renderer.isForeground(mesh) && mesh.geometry.properties.textPlacement !== 'line';
};

const shaderLineFilter0 = function (mesh) {
    const renderer = this.layer.getRenderer();
    return !this._isHalo0(mesh) && renderer.isTileNearCamera(mesh) && mesh.geometry.properties.textPlacement === 'line';
};

const shaderLineFilterN = function (mesh) {
    const renderer = this.layer.getRenderer();
    const z = mesh.properties.tile.z;
    const currentZoom = renderer.getCurrentTileZoom();
    return !this._isHalo0(mesh) && !renderer.isForeground(mesh) && mesh.geometry.properties.textPlacement === 'line' && z < currentZoom;
};

//label box 或 icon box 对应的element数量
const BOX_ELEMENT_COUNT = 6;

// 线有坡度且文字的pitchAlignment为map时，Z轴上的偏移量，以避免文字和线的深度冲突
const Z_AXIS_OFFSET = [0, 0, 3];

// temparary variables used later
const PROJ_MATRIX = [], CHAR_OFFSET = [];

const PLANE_MATRIX = [];

const ANCHOR = [], PROJ_ANCHOR = [];

const MAT2 = [];

const SHAPE = [], OFFSET = [], AXIS_FACTOR = [1, -1];

const INT16 = new Int16Array(3);

const TEMP_QUAT = [];
const TEMP_MAT4 = [];
const TEMP_MAT4_1 = [];
const TEMP_AXIS = [];
const TEMP_CANVAS_SIZE = [];

const FIRST_CHAROFFSET = [], LAST_CHAROFFSET = [];

const params = {};
const feature = {};
const featureState = {};
const availableImages = [];

const ELEVATED_ANCHOR = [];

const IDENTITY_ARR = mat4.identity([]);

const BOX = [];

export default class TextPainter extends CollisionPainter {
    static getBloomSymbol() {
        return ['textBloom'];
    }

    constructor(regl, layer, symbol, sceneConfig, pluginIndex, dataConfig) {
        super(regl, layer, symbol, sceneConfig, pluginIndex, dataConfig);
        this.propAllowOverlap = 'textAllowOverlap';
        this.propIgnorePlacement = 'textIgnorePlacement';
        // this.layer.getRenderer().canvas.addEventListener('webglcontextlost', e => {
        //     console.log(JSON.stringify(layer.getMap().getView()));
        //     const arr = new Int16Array(this._buffer);
        //     const arr2 = [];
        //     for (let i = 0; i < arr.length; i += 2) {
        //         arr2.push('[' + arr[i] + ',' + arr[i + 1] + ']');
        //     }
        //     console.log(arr2.join());
        //     // // const rotations = new Int16Array(arr.length / 4);
        //     // // for (let i = 0; i < rotations.length; i++) {
        //     // //     rotations[i] = arr[i * 4 + 2] / 91;
        //     // // }
        //     // console.log(this._rotations.join());
        //     e.preventDefault();

        // }, false);
        this.colorCache = {};
        this._filter0 = shaderFilter0.bind(this);
        this._filter1 = shaderFilterN.bind(this);
        this._lineFilter0 = shaderLineFilter0.bind(this);
        this._lineFilter1 = shaderLineFilterN.bind(this);
        this.isLabelCollides = isLabelCollides.bind(this);
        this._genTextNames();
    }

    prepareRender(...args) {
        super.prepareRender(...args);
        // maptalks/issues#336
        const meshes = this.scene.getMeshes();
        if (!meshes || !meshes.length) {
            return;
        }
        for (let i = 0; i < meshes.length; i++) {
            if (meshes[i].properties.isHalo) {
                continue;
            }
            const { haloMesh } = meshes[i].properties;
            if (haloMesh.dirtyDefines) {
                meshes[i].setDefines(haloMesh.defines);
            }
        }
    }

    updateSymbol(...args) {
        this._tagTerrainVector = undefined;
        this._tagTerrainSkin = undefined;
        const refresh = super.updateSymbol(...args);
        this._genTextNames();
        return refresh;
    }

    isTerrainVector() {
        if (!super.isTerrainSkin()) {
            return false;
        }
        if (this._tagTerrainVector !== undefined) {
            return this._tagTerrainVector;
        }
        for (let i = 0; i < this.symbolDef.length; i++) {
            const symbolDef = this.symbolDef[i];
            const pitchAlignment = symbolDef['textPitchAlignment'];
            if (pitchAlignment !== 'map') {
                this._tagTerrainVector = true;
                return true;
            }
        }
        this._tagTerrainVector = false;
        return false;
    }

    isTerrainSkin() {
        if (!super.isTerrainSkin()) {
            return false;
        }
        if (this._tagTerrainSkin !== undefined) {
            return this._tagTerrainSkin;
        }
        for (let i = 0; i < this.symbolDef.length; i++) {
            const symbolDef = this.symbolDef[i];
            const pitchAlignment = symbolDef['textPitchAlignment'];
            if (pitchAlignment === 'map' || isFunctionDefinition(pitchAlignment) || FilterUtil.isExpression(pitchAlignment)) {
                this._tagTerrainSkin = true;
                return true;
            }
        }
        this._tagTerrainSkin = false;
        return false;
    }

    _genTextNames() {
        this._textNameFn = [];
        for (let i = 0; i < this.symbolDef.length; i++) {
            const symbolDef = this.symbolDef[i];
            if (FilterUtil.isExpression(symbolDef['textName'])) {
                const expression = FilterUtil.createExpression(symbolDef['textName'], 'string');
                this._textNameFn[i] = (zoom, properties) => {
                    params.zoom = zoom;
                    feature.properties = properties;
                    let v;
                    try {
                        v = expression.evaluateWithoutErrorHandling(params, feature, featureState, null, availableImages);
                    } catch (err) {
                        v = null;
                    }

                    return v;
                };
            } else if (isFunctionDefinition(symbolDef['textName'])) {
                this._textNameFn[i] = interpolated(symbolDef['textName']);
            }
        }
    }

    shouldDeleteMeshOnUpdateSymbol(symbol) {
        if (!Array.isArray(symbol)) {
            return (symbol.textHaloRadius === 0 || this.symbolDef[0].textHaloRadius === 0) && symbol.textHaloRadius !== this.symbolDef[0].textHaloRadius;
        } else {
            for (let i = 0; i < symbol.length; i++) {
                if (!symbol[i]) {
                    continue;
                }
                if ((symbol[i].textHaloRadius === 0 || this.symbolDef[i].textHaloRadius === 0) && symbol[i].textHaloRadius !== this.symbolDef[i].textHaloRadius) {
                    return true;
                }
            }
        }
        return false;
    }

    createFnTypeConfig(map, symbolDef) {
        return getTextFnTypeConfig(map, symbolDef);
    }

    isBloom(mesh) {
        const symbol = this.getSymbol(mesh.properties.symbolIndex);
        const bloomSymbol = TextPainter.getBloomSymbol()[0];
        return !!symbol[bloomSymbol];
    }

    createGeometry(glData, features, index) {
        const pack = glData;
        if (!pack.glyphAtlas) {
            return null;
        }
        const geo = super.createGeometry(pack, features);
        if (!geo || !geo.geometry) {
            return null;
        }
        const { geometry } = geo;
        if (geometry.properties.glyphAtlas) {
            this.drawDebugAtlas(geometry.properties.glyphAtlas);
        }
        if (geometry && pack.lineVertex) {
            geometry.properties.line = pack.lineVertex;
            //原先createGeometry返回的geometry有多个，line.id用来区分是第几个geometry
            //现在geometry只会有一个，所以统一为0
            geometry.properties.line.id = index;
        }
        return geo;
    }

    createMesh(geo, transform, { tileVectorTransform }) {
        const enableCollision = this.isEnableCollision();
        const enableUniquePlacement = this.isEnableUniquePlacement();
        const { geometry, symbolIndex } = geo;
        geometry.properties.symbolIndex = symbolIndex;
        const symbol = this.getSymbol(symbolIndex);
        const symbolDef = this.getSymbolDef(symbolIndex);
        const fnTypeConfig = this.getFnTypeConfig(symbolIndex);
        const mesh = createTextMesh.call(this, this.regl, geometry, transform, symbolDef, symbol, fnTypeConfig, this.layer.options['collision'], !enableCollision, enableUniquePlacement);
        if (mesh.length) {
            const isLinePlacement = geometry.properties.textPlacement === 'line';
            //tags for picking
            if (isLinePlacement) {
                this._hasLineText = true;
            } else {
                this._hasNormalText = true;
            }
        }
        mesh.forEach(m => {
            m.positionMatrix = this.getAltitudeOffsetMatrix();
            m.properties.tileVectorTransform = tileVectorTransform;
        });
        return mesh;
    }

    updateCollision(context) {
        super.updateCollision(context);
        const meshes = this.scene.getMeshes();
        if (!meshes || !meshes.length) {
            this._endCollision();
            return;
        }

        this._projectedLinesCache = {};
        this._updateLabels(context.timestamp);
        this._endCollision();
    }

    callCurrentTileShader(uniforms, context) {
        // let size = 0;
        // const meshes = this.scene.getMeshes();
        // for (let i = 0; i < meshes.length; i++) {
        //     if (meshes[i].geometry.properties.memory) {
        //         size += meshes[i].geometry.properties.memory;
        //     }
        // }
        // console.log('Buffer内存总大小', size);

        //1. render current tile level's meshes
        this.shader.filter = context.sceneFilter ? [this._filter0, context.sceneFilter] : this._filter0;
        this.callRenderer(this.shader, uniforms, context);

        this._shaderAlongLine.filter = context.sceneFilter ? [this._lineFilter0, context.sceneFilter] : this._lineFilter0;
        this.callRenderer(this._shaderAlongLine, uniforms, context);
    }

    callBackgroundTileShader(uniforms, context) {
        this.shader.filter = context.sceneFilter ? [this._filter1, context.sceneFilter] : this._filter1;
        this.callRenderer(this.shader, uniforms, context);

        this._shaderAlongLine.filter = context.sceneFilter ? [this._lineFilter1, context.sceneFilter] : this._lineFilter1;
        this.callRenderer(this._shaderAlongLine, uniforms, context);
    }

    callRenderer(shader, uniforms, context) {
        if (context && context.isRenderingTerrain && isFunctionDefinition(this.symbolDef.textPitchAlignment)) {
            if (context.isRenderingTerrainSkin) {
                // 过滤掉 pitchAlignment 为 viewport 的数据
                uniforms.textPitchFilter = 1;
            } else {
                // 过滤掉 pitchAlignment 为 map 的数据
                uniforms.textPitchFilter = 2;
            }
        }

        super.callRenderer(shader, uniforms, context);
    }

    /**
     * update flip and vertical data for each text
     */
    _updateLabels(/* timestamp */) {
        let meshes = this.scene.getMeshes();
        if (!meshes || !meshes.length) {
            return;
        }

        const map = this.getMap();
        const bearing = -map.getBearing() * Math.PI / 180;
        const planeMatrix = mat2.fromRotation(PLANE_MATRIX, bearing);
        //boxVisible, mesh, meshBoxes, mvpMatrix, boxIndex
        const fn = (visElemts, meshBoxes, mvpMatrix, labelIndex) => {
            // debugger
            const { start, end, mesh, allElements: elements } = meshBoxes[0];
            const visible = this.updateBoxCollisionFading(true, mesh, meshBoxes, mvpMatrix, labelIndex);
            if (visible) {
                let count = visElemts.count;
                for (let i = start; i < end; i++) {
                    // visElemts.push(elements[i]);
                    visElemts[count++] = elements[i];
                }
                visElemts.count = count;
            }
        };
        const enableCollision = this.isEnableCollision();
        const renderer = this.layer.getRenderer();

        // console.log('meshes数量', meshes.length, '字符数量', meshes.reduce((v, mesh) => {
        //     return v + mesh.geometry.count / BOX_ELEMENT_COUNT;
        // }, 0));
        // console.log(meshes.map(m => m.properties.meshKey));
        meshes = meshes.sort(sortByLevel);
        for (let i = 0; i < meshes.length; i++) {
            const mesh = meshes[i];
            if (!this.isMeshIterable(mesh)) {
                continue;
            }
            const isNearCamera = renderer.isTileNearCamera(mesh);
            if (!isNearCamera) {
                const { visElemts } = mesh.geometry.properties;
                if (visElemts) {
                    visElemts.count = 0;
                }
                mesh.geometry.setElements(visElemts, 0);
                continue;
            }
            const geometry = mesh.geometry;
            const symbol = this.getSymbol(mesh.properties.symbolIndex);
            // mesh.properties.textSize = !isNil(symbol['textSize']) ? symbol['textSize'] : DEFAULT_UNIFORMS['textSize'];
            mesh.properties.textHaloRadius = !isNil(symbol['textHaloRadius']) ? symbol['textHaloRadius'] : DEFAULT_UNIFORMS['textHaloRadius'];

            // const idx = geometry.properties.aPickingId[0];
            // console.log(`图层:${geometry.properties.features[idx].feature.layer},数据数量：${geometry.count / BOX_ELEMENT_COUNT}`);
            const meshKey = mesh.properties.meshKey;
            if (geometry.properties.textPlacement === 'line') {
                //line placement
                if (!geometry.properties.line) {
                    continue;
                }
                if (enableCollision) {
                    this.startMeshCollision(mesh);
                }
                this._updateLineLabel(mesh, planeMatrix);
                const { aOffset, aOpacity } = geometry.properties;
                if (aOffset.dirty) {
                    geometry.updateData('aOffset', aOffset);
                    aOffset.dirty = false;
                }
                if (aOpacity && aOpacity.dirty) {
                    geometry.updateData('aOpacity', aOpacity);
                    aOpacity.dirty = false;
                }
                if (enableCollision) {
                    this.endMeshCollision(meshKey);
                }
            } else if (enableCollision) {
                this.startMeshCollision(mesh);
                const { elements, aOpacity, visElemts } = geometry.properties;
                visElemts.count = 0;
                this.forEachBox(mesh, (mesh, meshBoxes, mvpMatrix, labelIndex, label) => {
                    fn(visElemts, meshBoxes, mvpMatrix, labelIndex, label);
                });

                if (aOpacity && aOpacity.dirty) {
                    geometry.updateData('aOpacity', aOpacity);
                }
                const allVisilbe = visElemts.count === elements.length && geometry.count === elements.length;
                const allHided = !visElemts.count && !geometry.count;
                if (!allVisilbe && !allHided) {
                    geometry.setElements(visElemts, visElemts.count);
                }
                this.endMeshCollision(meshKey);
            }
        }
    }

    isMeshIterable(mesh) {
        //halo和正文共享的同一个geometry，无需更新
        return mesh.isValid() && mesh.material && !mesh.material.get('isHalo') && !(this.shouldIgnoreBackground() && !this.layer.getRenderer().isForeground(mesh));
    }

    isMeshUniquePlaced(mesh) {
        if (!this.isMeshIterable(mesh)) {
            return false;
        }
        const symbol = this.getSymbol(mesh.properties.symbolIndex);
        return symbol['textPlacement'] !== 'line';
    }

    getUniqueEntryKey(mesh, idx) {
        return getLabelEntryKey(mesh, idx);
    }

    _updateLineLabel(mesh, planeMatrix) {
        const map = this.getMap(),
            geometry = mesh.geometry,
            geometryProps = geometry.properties;
        //pitch不跟随map时，需要根据屏幕位置实时计算各文字的位置和旋转角度并更新aOffset和aRotation
        //pitch跟随map时，根据line在tile内的坐标计算offset和rotation，只需要计算更新一次
        //aNormal在两种情况都要实时计算更新
        let line = geometryProps.line;
        if (!line) {
            return;
        }
        const pitch = map.getPitch();
        const bearing = map.getBearing();
        const { lineTextPitch: linePitch, lineTextBearing: lineBearing } = mesh.properties;

        // this._counter++;

        const uniforms = mesh.material.uniforms;
        const isPitchWithMap = uniforms['pitchWithMap'] === 1;

        const allElements = geometryProps.elements;

        //pitchWithMap 而且 offset， rotation都更新过了，才能直接用allElements

        if (!isPitchWithMap) {
            const matrix = mat4.multiply(PROJ_MATRIX, map.projViewMatrix, mesh.localTransform);
            //project line to screen coordinates
            //line.id都为0，但不同的tile, matrix是不同的，故可以用matrix作为hash id
            const id = line.id + '-' + matrix.join();
            let out;
            if (this._projectedLinesCache[id]) {
                line = this._projectedLinesCache[id];
            } else {
                out = geometryProps.projectedLine = geometryProps.projectedLine || new Array(line.length);
                line = this._projectLine(out, line, matrix, map.width, map.height);
                this._projectedLinesCache[id] = out;
            }
        }
        const enableCollision = this.isEnableCollision();
        const visElemts = geometry.properties.visElemts = geometry.properties.visElemts || new allElements.constructor(allElements.length);
        const visCache = geometry.properties.visCache = geometry.properties.visCache || [];
        if (enableCollision) {
            visElemts.count = 0;
        }
        const needUpdate = linePitch === undefined || !map.isInteracting() || (Math.abs(pitch - linePitch) > 2 || Math.abs(bearing - lineBearing) > 2);
        if (needUpdate) {
            // label box 刷新后，强制将 this._meshCollisionStale 设为true， 避免在updateBoxCollisionFading方法中仍旧使用缓存的collision对象。
            this._meshCollisionStale = true;
        }
        this.forEachBox(mesh, (mesh, meshBoxes, mvpMatrix, labelIndex) => {
            const { start, end } = meshBoxes[0];
            let visible = visCache[labelIndex];
            if (visible === undefined || needUpdate) {
                visible = this._updateLabelAttributes(mesh, allElements, start, end, line, mvpMatrix, isPitchWithMap ? planeMatrix : null, labelIndex);
            }
            visCache[labelIndex] = visible;
            // const meshKey = mesh.properties.meshKey;
            // let collision = this.getCachedCollision(meshKey, labelIndex);
            // let visible = true;
            // if (!collision || this.isCachedCollisionStale(meshKey)) {
            //     visible = this._updateLabelAttributes(mesh, allElements, start, end, line, mvpMatrix, isPitchWithMap ? planeMatrix : null, labelIndex);
            // }
            if (!enableCollision) {
                //offset 计算 miss，则立即隐藏文字，不进入fading
                return;
            }
            visible = this.updateBoxCollisionFading(visible, mesh, meshBoxes, mvpMatrix, labelIndex);
            if (visible) {
                let count = visElemts.count;
                for (let i = start; i < end; i++) {
                    visElemts[count++] = allElements[i];
                }
                visElemts.count = count;
            }
        });
        if (needUpdate) {
            mesh.properties.lineTextPitch = pitch;
            mesh.properties.lineTextBearing = bearing;
        }
        const aAltitudeArr = mesh.geometry.properties.aAltitude;
        if (aAltitudeArr && aAltitudeArr.dirty) {
            geometry.updateData('aAltitude', aAltitudeArr);
            aAltitudeArr.dirty = false;
        }
        if (enableCollision && (visElemts.count !== allElements.length || geometry.count !== visElemts.count)) {
            geometry.setElements(visElemts, visElemts.count);
            // console.log('绘制', visibleElements.length / 6, '共', allElements.length / 6);
        }
    }

    _projectLine(out, line, matrix, width, height) {
        const prjLine = projectLine(out, line, matrix, width, height);
        return prjLine;
    }

    forEachBox(mesh, fn) {
        const map = this.getMap();
        const matrix = mat4.multiply(PROJ_MATRIX, map.projViewMatrix, mesh.properties.tileVectorTransform);
        const { collideIds, aCount, features, elements } = mesh.geometry.properties;
        const ids = collideIds;
        if (!ids) {
            return;
        }
        const enableUniquePlacement = this.isEnableUniquePlacement();

        const meshBox = this._getMeshBoxes(1);
        meshBox[0].allElements = elements;
        meshBox[0].mesh = mesh;

        let index = 0;

        let idx = elements[0];
        let start = 0, current = ids[idx];
        //每个文字有6个element
        for (let i = 0; i <= elements.length; i += BOX_ELEMENT_COUNT) {
            idx = elements[i];
            //pickingId发生变化，新的feature出现
            if (ids[idx] !== current || i === elements.length) {
                const feature = features[current] && features[current].feature;
                if (enableUniquePlacement && this.isMeshUniquePlaced(mesh) && feature && !feature.label) {
                    const properties = feature.properties || {};
                    // properties['$layer'] = feature.layer;
                    // properties['$type'] = feature.type;
                    const { symbolIndex } = mesh.properties;
                    const textName = symbolIndex && this._textNameFn[symbolIndex.index] ? this._textNameFn[symbolIndex.index](mesh.properties.z, properties) : this.getSymbol(mesh.properties.symbolIndex)['textName'];
                    const label = TextUtil.resolveText(textName, properties);
                    // delete properties['$layer'];
                    // delete properties['$type'];
                    feature.label = label;
                }
                const end = i/*  === elements.length - 6 ? elements.length : i */;
                const charCount = aCount[elements[start]];

                for (let ii = start; ii < end; ii += charCount * BOX_ELEMENT_COUNT) {
                    meshBox[0].start = ii;
                    meshBox[0].end = ii + charCount * BOX_ELEMENT_COUNT;
                    meshBox[0].boxCount = charCount;
                    fn.call(this, mesh, meshBox, matrix, index++);
                }
                current = ids[idx];
                start = i;
            }
        }
    }

    // start and end is the start and end index of a label
    _updateLabelAttributes(mesh, meshElements, start, end, line, mvpMatrix, planeMatrix/*, labelIndex*/) {
        const renderer = this.layer.getRenderer();

        const uniforms = mesh.material.uniforms;
        const isPitchWithMap = uniforms['pitchWithMap'] === 1;
        const terrainHelper = !isPitchWithMap && renderer.getTerrainHelper && renderer.getTerrainHelper();

        const enableCollision = this.isEnableCollision();
        const map = this.getMap();
        const geometry = mesh.geometry;
        const positionSize = geometry.desc.positionSize;

        const { aShape, aOffset, aAnchor, aAltitude, aPitchRotation } = geometry.properties;
        let { aProjectedAnchor } = geometry.properties;
        if (!aProjectedAnchor) {
            aProjectedAnchor = geometry.properties.aProjectedAnchor = new Array(aAnchor.length / positionSize * 3);
        }
        const aTextSize = geometry.properties['aTextSize'];

        // const layer = this.layer;
        // const renderer = layer.getRenderer();
        // const isForeground = renderer.isForeground(mesh);
        //地图缩小时限制绘制的box数量，以及fading时，父级瓦片中的box数量，避免大量的box绘制，提升缩放的性能
        // if (this.shouldLimitBox(isForeground, true) && labelIndex > this.layer.options['boxLimitOnZoomout']) {
        //     if (!enableCollision) {
        //         resetOffset(aOffset, meshElements, start, end);
        //     }
        //     return false;
        // }

        const isProjected = !planeMatrix;
        const index = meshElements[start];
        const idx = index * positionSize;
        // let labelAnchor = vec3.set(ANCHOR, aAnchor[idx], aAnchor[idx + 1], positionSize === 2 ? 0 : aAnchor[idx + 2]);
        let labelAnchor;
        if (geometry.data.aAltitude) {
            labelAnchor = vec3.set(ANCHOR, aAnchor[idx], aAnchor[idx + 1], aAltitude[index]);
        } else {
            labelAnchor = PackUtil.unpackPosition(ANCHOR, aAnchor[idx], aAnchor[idx + 1], aAnchor[idx + 2]);
        }

        const projLabelAnchor = projectPoint(PROJ_ANCHOR, labelAnchor, mvpMatrix, map.width, map.height);

        const aTerrainAltitude = geometry.properties.aTerrainAltitude;
        let elevatedAnchor;
        if (aTerrainAltitude) {
            const altitude = aTerrainAltitude[index];
            if (altitude === INVALID_ALTITUDE) {
                aProjectedAnchor[index * 3] = INVALID_PROJECTED_ANCHOR;
                aProjectedAnchor[index * 3 + 1] = INVALID_PROJECTED_ANCHOR;
                aProjectedAnchor[index * 3 + 2] = INVALID_PROJECTED_ANCHOR;
                return false;
            }
            if (altitude) {
                elevatedAnchor = vec3.set(ELEVATED_ANCHOR, ...labelAnchor);
                elevatedAnchor[2] = altitude * 100;
                elevatedAnchor = projectPoint(elevatedAnchor, elevatedAnchor, mvpMatrix, map.width, map.height);
            } else {
                elevatedAnchor = projLabelAnchor;
            }

        } else {
            elevatedAnchor = projLabelAnchor;
        }
        const dpr = map.getDevicePixelRatio();
        vec4.scale(BOX, elevatedAnchor, 1 / dpr);
        if (map.isOffscreen(BOX)) {
            if (!enableCollision) {
                resetOffset(aOffset, meshElements, start, end);
            }
            aProjectedAnchor[index * 3] = INVALID_PROJECTED_ANCHOR;
            aProjectedAnchor[index * 3 + 1] = INVALID_PROJECTED_ANCHOR;
            aProjectedAnchor[index * 3 + 2] = INVALID_PROJECTED_ANCHOR;

            //如果anchor在屏幕外，则直接不可见，省略掉后续逻辑
            return false;
        }
        if (isProjected) {
            labelAnchor = projLabelAnchor;
        }
        aProjectedAnchor[index * 3] = elevatedAnchor[0];
        aProjectedAnchor[index * 3 + 1] = elevatedAnchor[1];
        aProjectedAnchor[index * 3 + 2] = elevatedAnchor[2];

        const scale = isProjected ? 1 : geometry.properties.tileExtent / this.layer.getTileSize().width;

        let visible = true;

        const glyphSize = 24;

        //updateNormal
        //normal decides whether to flip and vertical
        const firstChrIdx = meshElements[start];
        const lastChrIdx = meshElements[end - 1];
        const textSize = aTextSize ? aTextSize[firstChrIdx] : mesh.properties.textSize;
        const normal = this._updateNormal(mesh, textSize, line, firstChrIdx, lastChrIdx, labelAnchor, ANCHOR, scale, planeMatrix);
        if (normal === null) {
            resetOffset(aOffset, meshElements, start, end);
            //normal返回null说明计算过程中有文字visible是false，直接退出
            return false;
        }
        const onlyOne = lastChrIdx - firstChrIdx <= 3;

        const flip = Math.floor(normal / 2);
        const vertical = normal % 2;

        //以下在js中实现了 text.line.vert 中的原有的shape和offset算法：
        /**
        void main() {
            vec4 pos = projViewModelMatrix * vec4(aPosition, 1.0);
            float distance = pos.w;

            float cameraScale = distance / cameraToCenterDistance;

            float distanceRatio = (1.0 - cameraToCenterDistance / distance) * textPerspectiveRatio;
            //通过distance动态调整大小
            float perspectiveRatio = clamp(
                0.5 + 0.5 * (1.0 - distanceRatio),
                0.0, // Prevents oversized near-field symbols in pitched/overzoomed tiles
                4.0);

            //精度修正：js中用int16存放旋转角，会丢失小数点，乘以64能在int16范围内尽量保留小数点后尽量多的位数
            float rotation = aRotation / 64.0 * RAD + textRotation;
            float flip = float(int(aNormal) / 2);
            float vertical = mod(aNormal, 2.0);
            rotation += mix(0.0, -PI / 2.0, vertical); //-90 degree

            float angleSin = sin(rotation);
            float angleCos = cos(rotation);
            mat2 shapeMatrix = mat2(angleCos, -angleSin, angleSin, angleCos);

            vec2 shape = shapeMatrix * aShape;

            vec2 offset = aOffset / 10.0; //精度修正：js中用int16存的offset,会丢失小数点，乘以十后就能保留小数点后1位
            vec2 texCoord = aTexCoord;

            shape = shape / glyphSize * textSize;

            if (pitchWithMap == 1.0) {
                offset = shape * vec2(1.0, -1.0) + offset;
                //乘以cameraScale可以抵消相机近大远小的透视效果
                gl_Position = projViewModelMatrix * vec4(aPosition + vec3(offset, 0.0) * tileRatio / zoomScale * cameraScale * perspectiveRatio, 1.0);
                vGammaScale = cameraScale + mapPitch / 4.0;
            } else {
                offset = (shape + offset * vec2(1.0, -1.0)) * 2.0 / canvasSize;
                pos.xy += offset * perspectiveRatio * pos.w;
                gl_Position = pos;
                //当textPerspective:
                //值为1.0时: vGammaScale用cameraScale动态计算
                //值为0.0时: vGammaScale固定为1.2
                vGammaScale = mix(1.0, cameraScale, textPerspectiveRatio);
            }

            gl_Position.xy += vec2(textDx, textDy) * 2.0 / canvasSize * distance;
        */
        // const res = map.getResolution();
        // const glScale = map.getGLScale();
        // const glScale = map.getGLScale();
        // centimeter to gl res

        //array to store current text's elements
        for (let j = start; j < end; j += BOX_ELEMENT_COUNT) {
            //every character has 4 vertice, and 6 indexes
            const vertexStart = meshElements[j];
            let offset;
            if (!flip && j === start && !onlyOne && !terrainHelper) {
                // 因为在updateNormal中已经计算过first_offset，这里就不再计算了
                offset = FIRST_CHAROFFSET;
            } else if (!flip && j === end - BOX_ELEMENT_COUNT && !onlyOne && !terrainHelper) {
                // 因为在updateNormal中已经计算过last_offset，这里就不再计算了
                offset = LAST_CHAROFFSET;
            } else {
                offset = getCharOffset.call(this, CHAR_OFFSET, mesh, textSize, line, vertexStart, labelAnchor, ANCHOR, scale, flip, elevatedAnchor, this.layer, mvpMatrix, isPitchWithMap);
            }
            if (!offset) {
                //remove whole text if any char is missed
                visible = false;
                if (!enableCollision) {
                    resetOffset(aOffset, meshElements, start, end);
                }
                break;
            }

            let rotation = offset[2];
            if (vertical) {
                rotation -= Math.PI / 2;
            }

            const shapeMatrix = getShapeMatrix(MAT2, rotation, 0, uniforms['rotateWithMap'], uniforms['pitchWithMap']);

            const is3DPitchText = aOffset.length > aShape.length;
            let rotMatrix;
            if (is3DPitchText) {
                //这里假设一组文字的rotation是一致的，因为每个文字都单独计算高度和旋转度难度太高
                vec3.set(TEMP_AXIS, aPitchRotation[3 * vertexStart], aPitchRotation[3 * vertexStart + 1], 0);
                const axis = vec3.normalize(TEMP_AXIS, TEMP_AXIS);
                const angleR = -aPitchRotation[3 * vertexStart + 2];
                if (angleR) {
                    // angleR为0时，则不用旋转
                    const quaterion = quat.setAxisAngle(TEMP_QUAT, axis, angleR);
                    mat4.fromTranslation(TEMP_MAT4, Z_AXIS_OFFSET);
                    mat4.fromQuat(TEMP_MAT4_1, quaterion);
                    rotMatrix = mat4.multiply(TEMP_MAT4_1, TEMP_MAT4_1, TEMP_MAT4);
                }
            }


            for (let ii = 0; ii < 4; ii++) {
                const idx = 2 * (vertexStart + ii);
                vec2.set(SHAPE, aShape[idx] / 10, aShape[idx + 1] / 10);
                vec2.scale(SHAPE, SHAPE, textSize / glyphSize);
                vec2.transformMat2(SHAPE, SHAPE, shapeMatrix);

                if (isPitchWithMap) {
                    vec2.multiply(SHAPE, SHAPE, AXIS_FACTOR);
                    vec2.add(OFFSET, SHAPE, offset);
                    if (is3DPitchText) {
                        OFFSET[2] = 0;
                        if (rotMatrix) {
                            vec3.transformMat4(OFFSET, OFFSET, rotMatrix);
                        }
                    }
                } else {
                    vec2.multiply(OFFSET, offset, AXIS_FACTOR);
                    // vec2.set(OFFSET, 0, OFFSET[1], 0);
                    vec2.add(OFFSET, SHAPE, OFFSET);
                }

                //乘以十是为了提升shader中offset的精度
                INT16[0] = OFFSET[0] * 10;
                INT16[1] = OFFSET[1] * 10;
                if (is3DPitchText) {
                    INT16[2] = OFFSET[2] * 10;
                }

                //*10 是为了保留小数点做的精度修正
                const offsetIdx = (is3DPitchText ? 3 : 2) * (vertexStart + ii);
                if (aOffset[offsetIdx] !== INT16[0] ||
                    aOffset[offsetIdx + 1] !== INT16[1] ||
                    is3DPitchText && aOffset[offsetIdx + 2] !== INT16[2]) {
                    aOffset.dirty = true;
                    aOffset[offsetIdx] = INT16[0];
                    aOffset[offsetIdx + 1] = INT16[1];
                    if (is3DPitchText) {
                        aOffset[offsetIdx + 2] = INT16[2];
                    }
                }


            }
        }
        return visible;
    }

    _updateNormal(mesh, textSize, line, firstChrIdx, lastChrIdx, projectedAnchor, anchor, scale, planeMatrix) {
        const onlyOne = lastChrIdx - firstChrIdx <= 3;
        const map = this.getMap();
        const symbol = this.getSymbol(mesh.geometry.properties.symbolIndex);
        const normal = onlyOne ? 0 : getLabelNormal.call(this, FIRST_CHAROFFSET, LAST_CHAROFFSET, mesh,
            textSize, line, firstChrIdx, lastChrIdx, projectedAnchor,
            anchor, scale, map.width / map.height, planeMatrix, symbol['textMaxAngle'] || TEXT_MAX_ANGLE);

        return normal;
    }

    isBoxCollides(mesh, elements, boxCount, start, end, matrix/*, boxIndex*/) {
        return this.isLabelCollides(0, mesh, elements, boxCount, start, end, matrix);
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

    delete() {
        super.delete();
        this._shaderAlongLine.dispose();
        delete this._projectedLinesCache;
        if (this._linePicking) {
            this._linePicking.dispose();
        }
    }

    isUniqueStencilRefPerTile() {
        return false;
    }

    isEnableTileStencil() {
        const isIntel = this.layer.getRenderer().isEnableWorkAround('win-intel-gpu-crash');
        return !isIntel;
    }

    init() {
        // const map = this.getMap();
        const regl = this.regl;

        this.renderer = new reshader.Renderer(regl);

        const { uniforms, extraCommandProps } = createTextShader.call(this, this.canvas, this.sceneConfig);

        const canvas = this.canvas;
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

        extraCommandProps.viewport = viewport;

        this.shader = new reshader.MeshShader({
            // vert: vertAlongLine, frag,
            vert, frag,
            uniforms,
            extraCommandProps
        });
        let commandProps = extraCommandProps;
        if (this.layer.getRenderer().isEnableWorkAround('win-intel-gpu-crash')) {
            //为解决intel gpu crash，stencil可能会被启用
            //但只有line-text渲染才需要，普通文字渲染不用打开stencil
            commandProps = extend({}, extraCommandProps);
            commandProps.stencil = extend({}, extraCommandProps.stencil);
            commandProps.stencil.enable = true;
            commandProps.stencil.func.cmp = '<';
            commandProps.stencil.func.ref = (context, props) => {
                //level * 2 以避免相邻level的halo和非halo产生相同的ref
                return props.level * 2 + (props.isHalo || 0) + 1;
            };
        }
        this._shaderAlongLine = new reshader.MeshShader({
            vert: vertAlongLine, frag,
            uniforms,
            extraCommandProps: commandProps
        });

        if (this.pickingFBO) {
            const textPicking = new reshader.FBORayPicking(
                this.renderer,
                {
                    vert: '#define PICKING_MODE 1\n' + pickingVert,
                    uniforms,
                    extraCommandProps: {
                        viewport: this.pickingViewport
                    }
                },
                this.pickingFBO,
                this.getMap()
            );
            textPicking.filter = mesh => {
                const symbolIndex = mesh.properties.symbolIndex;
                const symbol = this.getSymbol(symbolIndex);
                return symbol['textPlacement'] !== 'line';
            };

            const linePicking = new reshader.FBORayPicking(
                this.renderer,
                {
                    vert: '#define PICKING_MODE 1\n' + linePickingVert,
                    uniforms,
                    extraCommandProps: {
                        viewport: this.pickingViewport
                    }
                },
                this.pickingFBO,
                this.getMap()
            );
            linePicking.filter = mesh => {
                return mesh.geometry.properties.textPlacement === 'line';
            };
            this.picking = [textPicking, linePicking];
        }
    }

    getUniformValues(map, context) {
        const isRenderingTerrainSkin = context && context.isRenderingTerrainSkin;
        const tileSize = this.layer.getTileSize().width;
        const projViewMatrix = isRenderingTerrainSkin ? IDENTITY_ARR : map.projViewMatrix;
        const cameraToCenterDistance = map.cameraToCenterDistance;
        // const canvasSize = [map.width, map.height];
        const canvasSize = vec2.set(TEMP_CANVAS_SIZE, map.width, map.height);
        if (isRenderingTerrainSkin) {
            vec2.set(canvasSize, tileSize, tileSize);
        }
        //手动构造map的x与z轴的三维旋转矩阵
        //http://planning.cs.uiuc.edu/node102.html
        // const pitch = map.getPitch(),
        //     bearing = -map.getBearing();
        // const q = quat.fromEuler([], pitch, 0, bearing);
        // const planeMatrix = mat4.fromRotationTranslation([], q, [0, 0, 0]);

        // const pitch = map.getPitch() * Math.PI / 180,
        //     bearing = -map.getBearing() * Math.PI / 180;
        // const angleCos = Math.cos(bearing),
        //     angleSin = Math.sin(bearing),
        //     pitchCos = Math.cos(pitch),
        //     pitchSin = Math.sin(pitch);
        // const planeMatrix = [
        //     angleCos, -1.0 * angleSin * pitchCos, angleSin * pitchSin,
        //     angleSin, angleCos * pitchCos, -1.0 * angleCos * pitchSin,
        //     0.0, pitchSin, pitchCos
        // ];
        const zScale = getCentiMeterScale(map.getResolution(), map);
        return {
            layerScale: this.layer.options['styleScale'] || 1,
            mapPitch: map.getPitch() * Math.PI / 180,
            mapRotation: map.getBearing() * Math.PI / 180,
            projViewMatrix,
            viewMatrix: map.viewMatrix,
            cameraToCenterDistance, canvasSize,
            glyphSize: GLYPH_SIZE,
            // gammaScale : 0.64,
            gammaScale: GAMMA_SCALE * (this.layer.options['textGamma'] || 1),
            resolution: map.getResolution(),
            altitudeScale: zScale,
            viewport: isRenderingTerrainSkin && context && context.viewport,
            // 过滤 pitchAlignment 为特定值的text，0时不过滤; 1时，过滤掉viewport; 2时，过滤掉map
            textPitchFilter: 0,
            isRenderingTerrain: +!!isRenderingTerrainSkin
            // planeMatrix
        };
    }
}

// function bytesAlign(attributes) {
//     let max = 0;
//     let stride = 0;
//     for (const p in attributes) {
//         const type = attributes[p].type;
//         if (TYPE_BYTES[type] > max) {
//             max = TYPE_BYTES[type];
//         }
//         stride += TYPE_BYTES[type] * attributes[p].size || 1;
//     }
//     if (stride % max > 0) {
//         stride += (max - stride % max);
//     }
//     return stride;
// }

function resetOffset(aOffset, meshElements, start, end) {
    for (let j = start; j < end; j += BOX_ELEMENT_COUNT) {
        //every character has 4 vertice, and 6 indexes
        const vertexStart = meshElements[j];
        for (let ii = 0; ii < 4; ii++) {
            const idx = 3 * (vertexStart + ii);
            if (aOffset[idx] ||
                aOffset[idx + 1] ||
                aOffset[idx + 2]) {
                aOffset.dirty = true;
                aOffset[idx] = 0;
                aOffset[idx + 1] = 0;
                aOffset[idx + 2] = 0;
            }
        }
    }
}

function sortByLevel(m0, m1) {
    const r = m0.properties['level'] - m1.properties['level'];
    if (r === 0) {
        return m0.properties.meshKey - m1.properties.meshKey;
    } else {
        return r;
    }
}
