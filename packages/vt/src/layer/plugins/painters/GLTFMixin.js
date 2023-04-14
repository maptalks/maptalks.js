import { vec3, mat4, quat, reshader } from '@maptalks/gl';
import { setUniformFromSymbol, createColorSetter, isNil, isNumber, extend } from '../Util';
import { getCentiMeterScale } from '../../../common/Util';
import { isFunctionDefinition, interpolated } from '@maptalks/function-type';

const V3 = [];
const TEMP_V3_0 = [];
const TEMP_V3_1 = [];
const TEMP_V3_2 = [];
const Q4 = [];
const DEFAULT_TRANSLATION = [0, 0, 0];
const DEFAULT_ROTATION = [0, 0, 0];
const DEFAULT_SCALE = [1, 1, 1];

const EMPTY_ARRAY = [];
const DEFAULT_MARKER_FILL = [1, 1, 1, 1];
const TEMP_MATRIX = [];

const Y_TO_Z = [1, 0, 0, 0, 0, 0, 1, 0, 0, -1, 0, 0, 0, 0, 0, 1];

const pickingVert = `
    attribute vec3 aPosition;
    uniform mat4 projViewModelMatrix;
    uniform mat4 modelMatrix;
    uniform mat4 positionMatrix;
    //引入fbo picking的vert相关函数
    #include <fbo_picking_vert>
    #include <get_output>
    void main()
    {
        mat4 localPositionMatrix = getPositionMatrix();
        vec4 localPosition = getPosition(aPosition);

        gl_Position = projViewModelMatrix * localPositionMatrix * localPosition;
        //传入gl_Position的depth值
        fbo_picking_setData(gl_Position.w, true);
    }`;
// TODO 缺少 updateSymbol 的支持
const GLTFMixin = Base =>

    class extends Base {
        constructor(regl, layer, symbol, sceneConfig, pluginIndex, dataConfig) {
            super(regl, layer, symbol, sceneConfig, pluginIndex, dataConfig);
            this._ready = false;
            this.scene.sortFunction = this.sortByCommandKey;
            this._gltfMeshInfos = [];
            this._gltfManager = new reshader.GLTFManager(regl);
            this._initTRSFuncType();
            this._initGLTF();
        }

        isAnimating() {
            const symbols = this.getSymbols();
            for (let i = 0; i < symbols.length; i++) {
                const symbol = symbols[i];
                if (!symbol || !this._gltfPack[i]) {
                    continue;
                }
                if (this._isSkinAnimating(i)) {
                    return true;
                }
            }
            return false;
        }

        createGeometry(glData, features) {
            // 无论多少个symbol，gltf插件的数据只会来源于glData中的第一条数据
            const { data, positionSize } = glData;
            const geometry = {
                geometry: {
                    properties: extend({}, glData.properties),
                    data,
                    positionSize,
                    features
                },
                symbolIndex: glData.symbolIndex
            };
            return geometry;
        }

        getFnTypeConfig() {
            return EMPTY_ARRAY;
        }

        createMesh(geo, transform, { tileTranslationMatrix, tileExtent }) {
            if (!this._ready) {
                return null;
            }
            const map = this.getMap();
            const { geometry } = geo;
            const { positionSize, features } = geometry;
            const { aPosition, aPickingId, aXYRotation, aZRotation } = geometry.data;
            const count = aPosition.length / positionSize;
            if (count === 0) {
                return null;
            }
            const instanceData = {
                'instance_vectorA': new Float32Array(count * 4),
                'instance_vectorB': new Float32Array(count * 4),
                'instance_vectorC': new Float32Array(count * 4),
                // 'instance_color': [],
                'aPickingId': []
            };
            const instanceCenter = this._updateInstanceData(instanceData, tileTranslationMatrix, tileExtent, geometry.properties.z, aPosition, aXYRotation, aZRotation, positionSize, aPickingId, features);
            if (geometry.data.aTerrainAltitude) {
                instanceData.aTerrainAltitude = geometry.data.aTerrainAltitude;
            }
            const instanceBuffers = {};
            //所有mesh共享一个 instance buffer，以节省内存
            for (const p in instanceData) {
                instanceBuffers[p] = {
                    buffer: this.regl.buffer({
                        dimension: instanceData[p].length / count,
                        data: instanceData[p]
                    }),
                    divisor: 1
                };
            }

            const hasFnType = this._hasFuncType();

            const meshes = [];
            const symbols = this.getSymbols();
            for (let i = 0; i < symbols.length; i++) {
                const symbol = symbols[i];
                const meshInfos = this._gltfMeshInfos[i];
                if (!meshInfos) {
                    continue;
                }
                const { fixSizeOnZoom } = symbol;
                let trsMatrix = mat4.identity([]);
                // let translationInMeters;
                if (!hasFnType) {
                    trsMatrix = this._getSymbolTRSMatrix(trsMatrix);
                }

                let zOffset = 0;
                //获取多个mesh中，最大的zOffset，保证所有mesh的zOffset是统一的
                meshInfos.forEach(info => {
                    const { geometry, nodeMatrix } = info;
                    const positionMatrix = mat4.multiply(TEMP_MATRIX, trsMatrix, nodeMatrix);
                    const gltfBBox = geometry.boundingBox;
                    const meshBox = gltfBBox.copy();
                    meshBox.transform(positionMatrix);

                    const offset = this._calAnchorTranslation(meshBox, symbol);
                    if (offset > zOffset) {
                        zOffset = offset;
                    }
                });
                const anchorTranslation = [0, 0, zOffset];
                // if (!hasFnType) {
                //     vec3.add(anchorTranslation, translationInMeters, anchorTranslation);
                // }
                //
                const childMeshes = meshInfos.map(info => {
                    const { geometry: gltfGeo, nodeMatrix, materialInfo, skin, morphWeights, extraInfo } = info;
                    const MatClazz = this.getMaterialClazz(materialInfo);
                    const material = new MatClazz(materialInfo);
                    const defines = {};
                    // material.set('uOutputLinear', 1);
                    const mesh = new reshader.InstancedMesh(instanceBuffers, count, gltfGeo, material, {
                        transparent: false,
                        // castShadow: false,
                        picking: true
                    });
                    if (skin) {
                        mesh.setUniform('jointTexture', skin.jointTexture);
                        mesh.setUniform('jointTextureSize', skin.jointTextureSize);
                        mesh.setUniform('numJoints', skin.numJoints);
                        mesh.setUniform('skinAnimation', 0);
                        defines['HAS_SKIN'] = 1;
                    }
                    if (morphWeights) {
                        mesh.setUniform('morphWeights', morphWeights);
                        defines['HAS_MORPH'] = 1;
                        //TODO 什么时候设置 HAS_MORPHNORMALS
                    }
                    // StandardPainter 需要hasAlpha决定是否开启stencil和blend
                    mesh.setUniform('hasAlpha', extraInfo.alphaMode && extraInfo.alphaMode.toUpperCase() === 'BLEND');
                    setUniformFromSymbol(mesh.uniforms, 'polygonFill', symbol, 'markerFill', DEFAULT_MARKER_FILL, createColorSetter(this.colorCache));
                    setUniformFromSymbol(mesh.uniforms, 'polygonOpacity', symbol, 'markerOpacity', 1);
                    // mesh.setPositionMatrix(mat4.multiply([], trsMatrix, nodeMatrix));
                    const positionMatrix = mat4.multiply([], Y_TO_Z, nodeMatrix);
                    mat4.multiply(positionMatrix, trsMatrix, positionMatrix);
                    const matrix = [];
                    mat4.fromTranslation(matrix, anchorTranslation);
                    mat4.multiply(positionMatrix, matrix, positionMatrix);

                    mesh.setPositionMatrix(() => {
                        if (isNumber(fixSizeOnZoom)) {
                            const scale = map.getGLScale() / map.getGLScale(fixSizeOnZoom);
                            vec3.set(V3, scale, scale, scale);
                            mat4.fromScaling(matrix, V3);
                            return mat4.multiply(matrix, matrix, positionMatrix);
                        } else {
                            return positionMatrix;
                        }
                    });
                    const localTransform = mat4.translate([], tileTranslationMatrix, instanceCenter);
                    mesh.setLocalTransform(localTransform);

                    gltfGeo.generateBuffers(this.regl, { excludeElementsInVAO: true });
                    //上面已经生成了buffer，无需再生成
                    // mesh.generateInstancedBuffers(this.regl);
                    if (instanceData['instance_color']) {
                        defines['HAS_INSTANCE_COLOR'] = 1;
                    }
                    if (instanceData['aTerrainAltitude']) {
                        defines['HAS_INSTANCE_TERRAIN_ALTITUDE'] = 1;
                        mesh.setUniform('terrainAltitudeScale', this.layer.getRenderer().getZScale() * 100);
                    }
                    extend(mesh.properties, geometry.properties);
                    mesh.setDefines(defines);
                    mesh.properties.symbolIndex = {
                        index: i
                    };
                    return mesh;
                });
                meshes.push(...childMeshes);
            }

            meshes.insContext = {
                instanceData,
                tileTranslationMatrix,
                tileExtent,
                aPosition,
                positionSize
            };

            return meshes;
        }

        // _calFitScale(gltfBBox) {
        //     const maxLength = Math.max(gltfBBox.max[0] - gltfBBox.min[0], gltfBBox.max[1] - gltfBBox.min[1], gltfBBox.max[2] - gltfBBox.min[2]);
        //     const fitExtent = getFitExtent(this.getMap(), this.layer.options['gltfFitSize']);
        //     if (fitExtent > maxLength) {
        //         return 1;
        //     }
        //     const ratio = fitExtent / maxLength;
        //     return ratio;
        // }

        _calAnchorTranslation(gltfBBox, symbol) {
            const anchorZ = symbol.anchorZ || 'bottom';
            let zOffset = 0;
            if (anchorZ === 'bottom') {
                zOffset = -gltfBBox.min[2];
            } else if (anchorZ === 'top') {
                zOffset = -gltfBBox.max[2];
            } else if (anchorZ === 'center') {
                zOffset = -(gltfBBox.min[2] + gltfBBox.max[2]) / 2;
            }
            return zOffset;
        }

        addMesh(meshes, progress, context) {
            if (!meshes) {
                return null;
            }
            const level = meshes[0].properties.level;
            if (level > 2) {
                return null;
            }
            for (let i = 0; i < meshes.length; i++) {
                if (!meshes[i] || !meshes[i].geometry) {
                    continue;
                }
                if (meshes[i].instancedData.aTerrainAltitude) {
                    this._updateTerrainAltitude(meshes[i], meshes[i].instancedData, meshes[i].properties, 3, context);
                }
                const isAnimated = this._isSkinAnimating(meshes[i].properties.symbolIndex.index);
                meshes[i].setUniform('skinAnimation', +isAnimated);
            }
            this.scene.addMesh(meshes);
            return this;
        }

        _updateATerrainAltitude(mesh, aTerrainAltitude) {
            if (!mesh) {
                return;
            }
            mesh.updateInstancedData('aTerrainAltitude', aTerrainAltitude);
        }

        prepareRender(context) {
            const symbols = this.getSymbols();
            let isAnimated = false;
            for (let i = 0; i < symbols.length; i++) {
                const symbol = symbols[i];
                if (!symbol || !this._gltfPack[i]) {
                    continue;
                }
                const hasAnim = this._isSkinAnimating(i);
                if (hasAnim && this._gltfPack[i]) {
                    if (!isAnimated) {
                        isAnimated = true;
                    }
                    let speed = symbol.speed;
                    const loop = !!symbol.loop;
                    if (isNil(speed)) {
                        speed = 1;
                    }
                    this._gltfPack[i].updateAnimation(context.timestamp, loop, speed);
                }
            }

            if (isAnimated) {
                //TODO retire shadow frame，可能会造成性能问题
                this.setToRedraw(true);
            }
            super.prepareRender(context);
        }

        getShadowMeshes() {
            if (!this.isVisible()) {
                return EMPTY_ARRAY;
            }
            this.shadowCount = this.scene.getMeshes().length;
            const meshes = this.scene.getMeshes().filter(m => m.properties.level === 0);
            return meshes;
        }

        _isSkinAnimating(index) {
            const symbols = this.getSymbols();
            const symbol = symbols[index];
            return symbol && symbol.animation && this._gltfPack[index] && this._gltfPack[index].hasSkinAnimation();
        }

        _updateInstanceData(instanceData, tileTranslationMatrix, tileExtent, tileZoom, aPosition, aXYRotation, aZRotation, positionSize, aPickingId, features) {
            function setInstanceData(name, idx, matrix, col) {
                instanceData[name][idx * 4] = matrix[col];
                instanceData[name][idx * 4 + 1] = matrix[col + 4];
                instanceData[name][idx * 4 + 2] = matrix[col + 8];
                instanceData[name][idx * 4 + 3] = matrix[col + 12];
            }

            const count = aPosition.length / positionSize;
            const tileSize = this.layer.options.tileSize;
            const tileScale = tileSize / tileExtent * this.layer.getRenderer().getTileGLScale(tileZoom);
            const zScale = this.layer.getRenderer().getZScale();
            const altitudeOffset = (this.dataConfig.altitudeOffset || 0) * 100;
            let minx = Infinity, miny = Infinity, minz = Infinity;
            let maxx = -Infinity, maxy = -Infinity, maxz = -Infinity;
            const position = [];
            for (let i = 0; i < count; i++) {
                const pos = vec3.set(
                    position,
                    aPosition[i * positionSize] * tileScale,
                    //vt中的y轴方向与opengl(maptalks世界坐标系)相反
                    -aPosition[i * positionSize + 1] * tileScale,
                    positionSize === 2 ? 0 : (aPosition[i * positionSize + 2] + altitudeOffset) * zScale
                );
                if (pos[0] < minx) {
                    minx = pos[0];
                }
                if (pos[0] > maxx) {
                    maxx = pos[0];
                }
                if (pos[1] < miny) {
                    miny = pos[1];
                }
                if (pos[1] > maxy) {
                    maxy = pos[1];
                }
                if (pos[2] < minz) {
                    minz = pos[2];
                }
                if (pos[2] > maxz) {
                    maxz = pos[2];
                }
            }
            const cx = minx + maxx / 2;
            const cy = miny + maxy / 2;
            const cz = minz + maxz / 2;
            const mat = [];

            // 如果没有 fn type，trs会作为positionMatrix设置到mesh上
            const hasFnType = this._hasFuncType();
            const zAxis = [0, 0, 1];

            for (let i = 0; i < count; i++) {
                const x = aPosition[i * positionSize];
                const y = aPosition[i * positionSize + 1];
                const pos = vec3.set(
                    position,
                    x * tileScale  - cx,
                    //vt中的y轴方向与opengl(maptalks世界坐标系)相反
                    -y * tileScale - cy,
                    positionSize === 2 ? 0 : (aPosition[i * positionSize + 2] + altitudeOffset) * zScale - cz
                );

                const xyRotation = aXYRotation && aXYRotation[i] || 0;
                const zRotation = aZRotation && aZRotation[i] || 0;
                if (!xyRotation && !zRotation) {
                    mat4.fromTranslation(mat, pos);
                } else {
                    // const quaterion = quat.fromEuler([], xRotation * 180 / Math.PI, yRotation * 180 / Math.PI, zRotation * 180 / Math.PI);
                    mat4.fromRotation(mat, zRotation, zAxis);

                    const v = vec3.set(V3, x, y, 0);
                    const axis = vec3.normalize(v, vec3.cross(v, v, zAxis));
                    mat4.rotate(mat, mat, xyRotation, axis);

                    // mat4.fromRotation(mat, 0, axis);
                    const tMat = mat4.fromTranslation(TEMP_MATRIX, pos);
                    mat4.multiply(mat, tMat, mat);
                }

                if (hasFnType) {
                    const trs = this._getSymbolTRSMatrix(TEMP_MATRIX, features, aPickingId, i);
                    mat4.multiply(mat, mat, trs);
                }

                setInstanceData('instance_vectorA', i, mat, 0);
                setInstanceData('instance_vectorB', i, mat, 1);
                setInstanceData('instance_vectorC', i, mat, 2);
                instanceData['aPickingId'][i] = i;
            }
            vec3.set(position, cx, cy, cz);
            return position;
        }

        _getMeterScale() {
            if (!this._meterScale) {
                const map = this.getMap();
                this._meterScale = getCentiMeterScale(map.getGLRes(), map) * 100;
            }
            return this._meterScale;
        }

        // features, aPickingId, i 允许为空
        _getSymbolTRSMatrix(out, features, aPickingId, i) {
            const map = this.getMap();
            const symbolDef = this.symbolDef[0];

            const meterScale = this._getMeterScale();
            let tx = symbolDef['translationX'] || 0;
            let ty = symbolDef['translationY'] || 0;
            let tz = symbolDef['translationZ'] || 0;

            let rx = symbolDef['rotationX'] || 0;
            let ry = symbolDef['rotationY'] || 0;
            let rz = symbolDef['rotationZ'] || 0;

            let sx = symbolDef['scaleX'] || 0;
            let sy = symbolDef['scaleY'] || 0;
            let sz = symbolDef['scaleZ'] || 0;

            const idx = aPickingId && aPickingId[i];
            const feature = features && features[idx];

            const zoom = map.getZoom();
            const properties = feature && feature.feature && feature.feature.properties;

            if (this._txFn) {
                tx = this._txFn(zoom, properties);
            }
            if (this._tyFn) {
                ty = this._tyFn(zoom, properties);
            }
            if (this._tzFn) {
                tz = this._tzFn(zoom, properties);
            }
            const translation = vec3.set(TEMP_V3_0, tx * meterScale, ty * meterScale, tz * meterScale);

            if (this._rxFn) {
                rx = this._rxFn(zoom, properties);
            }
            if (this._ryFn) {
                ry = this._ryFn(zoom, properties);
            }
            if (this._rzFn) {
                rz = this._rzFn(zoom, properties);
            }
            const rotation = vec3.set(TEMP_V3_1, rx, ry, rz);

            if (this._sxFn) {
                sx = this._sxFn(zoom, properties);
            }
            if (this._syFn) {
                sy = this._syFn(zoom, properties);
            }
            if (this._szFn) {
                sz = this._szFn(zoom, properties);
            }
            const scale = vec3.set(TEMP_V3_2, sx, sy, sz);

            return this._getGLTFMatrix(out, translation, rotation, scale);
        }

        getShaderConfig() {
            const config = super.getShaderConfig();
            config.positionAttribute = 'POSITION';
            config.normalAttribute = 'NORMAL';
            return config;
        }

        init(context) {
            super.init(context);
            this._initGLTF();
        }

        _initTRSFuncType() {
            const symbolDef = this.symbolDef[0];
            if (isFunctionDefinition(symbolDef['translationX'])) {
                this._txFn = interpolated(symbolDef['translationX']);
            }
            if (isFunctionDefinition(symbolDef['translationY'])) {
                this._tyFn = interpolated(symbolDef['translationY'])
            }
            if (isFunctionDefinition(symbolDef['translationZ'])) {
                this._tzFn = interpolated(symbolDef['translationZ'])
            }

            if (isFunctionDefinition(symbolDef['rotationX'])) {
                this._rxFn = interpolated(symbolDef['rotationX']);
            }
            if (isFunctionDefinition(symbolDef['rotationY'])) {
                this._ryFn = interpolated(symbolDef['rotationY'])
            }
            if (isFunctionDefinition(symbolDef['rotationZ'])) {
                this._rzFn = interpolated(symbolDef['rotationZ'])
            }

            if (isFunctionDefinition(symbolDef['scaleX'])) {
                this._sxFn = interpolated(symbolDef['scaleX']);
            }
            if (isFunctionDefinition(symbolDef['scaleY'])) {
                this._syFn = interpolated(symbolDef['scaleY'])
            }
            if (isFunctionDefinition(symbolDef['scaleZ'])) {
                this._szFn = interpolated(symbolDef['scaleZ'])
            }
        }

        _hasFuncType() {
            return !!(this._txFn && !this._txFn.isFeatureConstant || this._tyFn && !this._tyFn.isFeatureConstant || this._tzFn && !this._tzFn.isFeatureConstant ||
                this._rxFn && !this._rxFn.isFeatureConstant || this._ryFn && !this._ryFn.isFeatureConstant || this._rzFn && !this._rzFn.isFeatureConstant ||
                this._sxFn && !this._sxFn.isFeatureConstant || this._syFn && !this._syFn.isFeatureConstant || this._szFn && !this._szFn.isFeatureConstant);
        }

        //TODO 缺乏GLTF模型的更新逻辑
        //TODO 缺乏多个symbols的支持
        _initGLTF() {
            if (this._gltfPack) {
                return;
            }
            this._gltfPack = [];
            const symbols = this.getSymbols();
            this._loaded = 0;
            for (let i = 0; i < symbols.length; i++) {
                const url = symbols[i].url || 'pyramid';
                this._gltfManager.loginGLTF(url);
                const gltfRes = this._gltfManager.getGLTF(url);
                if (gltfRes.then) {
                    gltfRes.then(gltfData => {
                        if (!gltfData.gltfPack) {
                            this._loaded++;
                            if (this._loaded >= symbols.length) {
                                this._ready = true;
                                this.setToRedraw(true);
                            }
                            return;
                        }
                        const { gltfPack: pack } = gltfData;
                        this._gltfPack[i] = [pack];
                        this._gltfMeshInfos[i] = pack.getMeshesInfo();
                        this._loaded++;
                        if (this._loaded >= symbols.length) {
                            this._ready = true;
                        }
                        this.setToRedraw(true);
                    });
                } else {
                    const { gltfPack: pack } = gltfRes;
                    if (pack) {
                        this._gltfPack[i] = [pack];
                        this._gltfMeshInfos[i] = pack.getMeshesInfo();
                        this._loaded++;
                    }
                }
            }
            if (this._loaded >= symbols.length) {
                this._ready = true;
            }
        }

        getPickingVert() {
            return pickingVert;
        }

        deleteMesh(meshes) {
            if (!meshes) {
                return;
            }
            this.scene.removeMesh(meshes);
            //geometry应该一直保留，在painter.delete中才删除
            for (let i = 0; i < meshes.length; i++) {
                meshes[i].disposeInstanceData();
                meshes[i].dispose();
            }
        }

        delete(/* context */) {
            super.delete();
            const symbols = this.getSymbols();
            for (let i = 0; i < symbols.length; i++) {
                const url = symbols[i].url || 'pyramid';
                this._gltfManager.logoutGLTF(url);
            }

        }

        _getGLTFMatrix(out, t, r, s) {
            const translation = vec3.set(V3, ...(t || DEFAULT_TRANSLATION));
            const rotation = r || DEFAULT_ROTATION;
            const scale = s || DEFAULT_SCALE;
            const eluerQuat = quat.fromEuler(Q4, rotation[0], rotation[1], rotation[2]);
            return mat4.fromRotationTranslationScale(out, eluerQuat, translation, scale);
        }
    };

export default GLTFMixin;

// function getFitExtent(map, fitSize) {
//     return fitSize * map.getGLScale();
// }
