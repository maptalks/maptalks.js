import { Coordinate } from 'maptalks';
import { vec3, mat4, quat, reshader } from '@maptalks/gl';
import { setUniformFromSymbol, createColorSetter, isNumber, extend } from '../Util';
import { getCentiMeterScale, isNil } from '../../../common/Util';
import { isFunctionDefinition, interpolated } from '@maptalks/function-type';
import { getVectorPacker } from '../../../packer/inject';

const pickingVert = reshader.ShaderLib.get('mesh_picking_vert');
const pickingWGSLVert = reshader.WgslShaderLib.get('mesh_picking').vert;

const { PackUtil } = getVectorPacker();

const V3 = [];
const TEMP_V3_0 = [];
const TEMP_V3_1 = [];
const TEMP_V3_2 = [];
const TEMP_SCALE = [];
const TEMP_SCALE_MAT = [];
const Q4 = [];
const DEFAULT_TRANSLATION = [0, 0, 0];
const DEFAULT_ROTATION = [0, 0, 0];
const DEFAULT_SCALE = [1, 1, 1];

const EMPTY_ARRAY = [];
const DEFAULT_MARKER_FILL = [1, 1, 1, 1];
const TEMP_MATRIX = [];

const Y_TO_Z = [1, 0, 0, 0, 0, 0, 1, 0, 0, -1, 0, 0, 0, 0, 0, 1];
// TODO 缺少 updateSymbol 的支持
const GLTFMixin = Base =>

    class extends Base {
        constructor(regl, layer, symbol, sceneConfig, pluginIndex, dataConfig) {
            super(regl, layer, symbol, sceneConfig, pluginIndex, dataConfig);
            this._ready = false;
            // this.scene.sortFunction = this.sortByCommandKey;
            const fetchOptions = sceneConfig.fetchOptions || {};
            fetchOptions.referrer = window && window.location.href;
            this._gltfManager = regl.gltfManager = regl.gltfManager || new reshader.GLTFManager(regl, {
                fetchOptions,
                urlModifier: (url) => {
                    const modifier = layer.getURLModifier();
                    return modifier && modifier(url) || url;
                }
            });
            this._initTRSFuncType();
            this._initGLTF();
        }

        isUniqueStencilRefPerTile() {
            return false;
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

        createMesh(geo, transform, { tileTranslationMatrix, tileExtent, tilePoint }, { timestamp }) {
            if (!this._ready) {
                return null;
            }
            const map = this.getMap();
            const { geometry } = geo;
            const { positionSize, features } = geometry;
            if (!geometry.data.aPosition || geometry.data.aPosition.length === 0) {
                return null;
            }
            if (this.dataConfig.type === 'native-line') {
                this._arrangeAlongLine(0, geometry, tilePoint);
            }
            const { aPosition } = geometry.data;
            let count = aPosition.length / positionSize;
            const instanceData = {
                'instance_vectorA': new Float32Array(count * 4),
                'instance_vectorB': new Float32Array(count * 4),
                'instance_vectorC': new Float32Array(count * 4),
                // 'instance_color': [],
                'aPickingId': []
            };
            const instanceCenter = this._updateInstanceData(instanceData, tileTranslationMatrix, tileExtent, geometry.properties.z, geometry.data, positionSize, features);
            if (geometry.data.aTerrainAltitude) {
                instanceData.aTerrainAltitude = geometry.data.aTerrainAltitude;
            }
            const instanceBuffers = {};
            const instancePickingId = instanceData.aPickingId;
            const pickingIdIndiceMap = generatePickingIndiceIndex(instancePickingId);
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

            // 这里不考虑每个模型所处经纬度对meterScale的影响
            const meterScale = this._getMeterScale();
            const meterToPointMat = mat4.identity([]);
            mat4.scale(meterToPointMat, meterToPointMat, [meterScale, meterScale, meterScale]);

            const meshes = [];
            const symbols = this.getSymbols();
            for (let i = 0; i < symbols.length; i++) {
                const symbol = symbols[i];
                const meshInfos = this._gltfMeshInfos[i];
                if (!meshInfos) {
                    continue;
                }
                const gltfPack = this._gltfPack[i][0];
                const { fixSizeOnZoom } = symbol;
                let trsMatrix = mat4.identity([]);
                // let translationInMeters;
                if (!hasFnType) {
                    trsMatrix = this._getSymbolTRSMatrix(trsMatrix);
                    trsMatrix = mat4.multiply([], meterToPointMat, trsMatrix);
                }

                let zOffset = 0;
                //获取多个mesh中，最大的zOffset，保证所有mesh的zOffset是统一的
                meshInfos.forEach(info => {
                    const { geometry, nodeMatrix } = info;
                    mat4.multiply(TEMP_MATRIX, Y_TO_Z, nodeMatrix);
                    let positionMatrix = mat4.multiply(TEMP_MATRIX, trsMatrix, TEMP_MATRIX);
                    if (hasFnType) {
                        positionMatrix = mat4.multiply(TEMP_MATRIX, meterToPointMat, TEMP_MATRIX);
                    }

                    const gltfBBox = geometry.boundingBox;
                    const meshBox = gltfBBox.copy();
                    meshBox.transform(positionMatrix);

                    const offset = this._calAnchorTranslation(meshBox, symbol);
                    if (Math.abs(offset) > Math.abs(zOffset)) {
                        zOffset = offset;
                    }
                });
                const anchorTranslation = [0, 0, zOffset];
                // if (!hasFnType) {
                //     vec3.add(anchorTranslation, translationInMeters, anchorTranslation);
                // }
                //
                const childMeshes = meshInfos.map((info, meshIndex) => {
                    const { geometry: gltfGeo, materialInfo, morphWeights, extraInfo, nodeIndex } = info;
                    if (symbol.alphaTest) {
                        materialInfo.alphaTest = symbol.alphaTest;
                    }
                    const MatClazz = this.getMaterialClazz(materialInfo);
                    const material = new MatClazz(materialInfo);
                    const defines = {};
                    // material.set('uOutputLinear', 1);
                    const mesh = new reshader.InstancedMesh(instanceBuffers, count, gltfGeo, material, {
                        transparent: false,
                        // castShadow: false,
                        picking: true
                    });
                    if (gltfPack.hasSkinAnimation()) {
                        const skinObj = this._updateAnimation(mesh, i, 0)[nodeIndex];
                        mesh.setUniform('jointTexture', skinObj.jointTexture);
                        mesh.setUniform('jointTextureSize', skinObj.jointTextureSize);
                        mesh.setUniform('numJoints', skinObj.numJoints);
                        mesh.setUniform('skinAnimation', +this._isSkinAnimating(i));
                        mesh.properties.startTime = timestamp;
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
                    const positionMatrix = [];
                    mesh.setPositionMatrix(() => {
                        const nodeMatrix = this._getMeshNodeMatrix(i, meshIndex, nodeIndex);
                        mat4.multiply(positionMatrix, Y_TO_Z, nodeMatrix);
                        // this._getSymbolTRSMatrix(trsMatrix);
                        mat4.multiply(positionMatrix, trsMatrix, positionMatrix);
                        // mat4.multiply(positionMatrix, meterToPointMat, positionMatrix);
                        const matrix = mat4.identity(TEMP_MATRIX)
                        if (zOffset !== 0) {
                            mat4.fromTranslation(matrix, anchorTranslation);
                            mat4.multiply(positionMatrix, matrix, positionMatrix);
                        }
                        if (isNumber(fixSizeOnZoom)) {
                            const scale = map.getGLScale() / map.getGLScale(fixSizeOnZoom);
                            vec3.set(V3, scale, scale, scale);
                            mat4.fromScaling(matrix, V3);
                            return mat4.multiply(matrix, matrix, positionMatrix);
                        } else {
                            return positionMatrix;
                        }
                    });
                    // const localTransform = mat4.translate([], tileTranslationMatrix, instanceCenter);
                    const zScale = this.layer.getRenderer().getZScale();
                    const localTransform = [];
                    const center = [];
                    mesh.setLocalTransform(() => {
                        const altitude = this.layer.options['altitude'] || 0;
                        vec3.copy(center, instanceCenter);
                        center[2] += altitude * 100 * zScale;
                        mat4.translate(localTransform, tileTranslationMatrix, center);
                        return localTransform;
                    });

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
                    defines['HAS_LAYER_OPACITY'] = 1;
                    extend(mesh.properties, geometry.properties);
                    mesh.properties.aPickingId = instancePickingId;
                    mesh.properties.nodeIndex = nodeIndex;
                    mesh.properties.pickingIdIndiceMap = pickingIdIndiceMap;
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


        _arrangeAlongLine(symbolIndex, geometry) {
            const { tileExtent, z: tileZoom } = geometry.properties;
            const { data, positionSize } = geometry;

            let gltfScale = this._calGLTFScale(symbolIndex);
            const meterScale = this._getMeterScale();
            gltfScale = vec3.scale([], gltfScale, meterScale);
            const options = {
                gapLength: this.dataConfig.gapLength || 0,
                direction: this.dataConfig.direction || 0,
                scaleVertex: true
            };
            const gltfPack = this._gltfPack[0][0];

            const { aPosition, aAltitude, aPickingId } = data;
            const coord0 = new Coordinate(0, 0, 0);
            const coord1 = new Coordinate(0, 0, 0);
            const newPosition = [];
            const newAltitude = aAltitude ? [] : newPosition;
            const newPickingId = [];
            const newRotationZ = [];
            const newRotationXY = [];
            const newScaleXYZ = [];
            const vertex0 = [];
            const vertex1 = [];
            const tileSize = this.layer.getTileSize().width;
            const tileScale = tileSize / tileExtent * this.layer.getRenderer().getTileGLScale(tileZoom);
            const zScale = this.layer.getRenderer().getZScale();
            let currentPickingId = aPickingId[0];
            for (let i = 0; i < aPosition.length - positionSize; i += positionSize) {
                const nextPickingId = aPickingId[i / positionSize + 1];
                if (nextPickingId !== currentPickingId) {
                    currentPickingId = nextPickingId;
                    continue;
                }
                if (aAltitude) {
                    vec3.set(vertex0, aPosition[i], aPosition[i + 1], aAltitude[i / positionSize]);
                } else {
                    PackUtil.unpackPosition(vertex0, aPosition[i], aPosition[i + 1], aPosition[i + 2]);
                }
                const [x0, y0, z0] = vertex0;

                let j = i + positionSize;
                if (aAltitude) {
                    vec3.set(vertex1, aPosition[j], aPosition[j + 1], aAltitude[j / positionSize]);
                } else {
                    PackUtil.unpackPosition(vertex1, aPosition[j], aPosition[j + 1], aPosition[j + 2]);
                }
                const [x1, y1, z1] = vertex1;

                const pickingId = aPickingId[i / positionSize];
                // altitude cm => meter
                const from = coord0.set(x0 * tileScale, y0 * tileScale, z0 * zScale);
                const to = coord1.set(x1 * tileScale, y1 * tileScale, z1 * zScale);
                const dist = from.distanceTo(to);

                const items = gltfPack.arrangeAlongLine(from, to, dist, gltfScale, 1, options);
                for (let j = 0; j < items.length; j++) {
                    const item = items[j];
                    // const coord = item.coordinates;
                    // newPosition.push(coord.x, coord.y);
                    coord0.set(x0, y0, z0);
                    coord1.set(x1, y1, z1);
                    const coord = interpolate(coord0, coord1, item.t);
                    newPosition.push(coord.x, coord.y);
                    newAltitude.push(coord.z);
                    newPickingId.push(pickingId);
                    newRotationZ.push(-item.rotationZ * Math.PI / 180);
                    newRotationXY.push(item.rotationXY * Math.PI / 180);
                    newScaleXYZ.push(...item.scale);
                }
            }
            geometry.data = {
                aPosition: new aPosition.constructor(newPosition),
                aPickingId: new aPickingId.constructor(newPickingId),
                aZRotation: newRotationZ,
                aXYRotation: newRotationXY,
                aScaleXYZ: newScaleXYZ
            };
            if (aAltitude) {
                geometry.data.aAltitude = new aAltitude.constructor(newAltitude);
            }
        }

        _calGLTFScale(symbolIndex) {
            const symbol = this.getSymbols()[symbolIndex];
            const scale = [1, 1, 1];
            const modelHeight = symbol.modelHeight;
            if (modelHeight) {
                const gltfPack = this._gltfPack[symbolIndex][0];
                gltfPack.calModelHeightScale(scale, modelHeight);
            }
            vec3.set(TEMP_SCALE, symbol.scaleX || 1, symbol.scaleY || 1, symbol.scaleZ || 1);
            return vec3.multiply(scale, scale, TEMP_SCALE);
        }

        _getMeshNodeMatrix(symbolIndex, meshIndex, nodeIndex) {
            const i = symbolIndex;
            const meshInfos = this._gltfMeshInfos[i];
            const meshInfo = meshInfos[meshIndex];
            if (!this._isSkinAnimating(symbolIndex)) {
                return meshInfo.nodeMatrix;
            }
            return this._nodeMatrixMap && this._nodeMatrixMap[nodeIndex] || meshInfo.nodeMatrix;
        }

        _updateAnimation(mesh, symbolIndex, timestamp) {
            if (!this._gltfPack) {
                return;
            }
            const gltfPack = this._gltfPack[symbolIndex][0];
            if (!this._skinMap) {
                this._skinMap = {};
            }
            this._nodeMatrixMap = {};
            if (!this._skinMap[mesh.uuid]) {
                this._skinMap[mesh.uuid] = {};
            }
            const symbols = this.getSymbols();
            const symbol = symbols[symbolIndex];
            const gltfJSON = this._gltfJSON[symbolIndex];
            const { loop, speed, animationName } = symbol;
            const currentAnimation = animationName || gltfJSON.animations[0].name;
            gltfPack.updateAnimation(timestamp, loop || false, speed || 1, currentAnimation, mesh.properties.startTime || 0, this._nodeMatrixMap, this._skinMap[mesh.uuid]);
            return this._skinMap[mesh.uuid];
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
            const anchorZ = symbol.anchorZ || 'center';
            let zOffset = 0;
            const height = gltfBBox.max[2] - gltfBBox.min[2];
            if (anchorZ === 'bottom') {
                zOffset = height / 2;
            } else if (anchorZ === 'top') {
                zOffset = -height / 2;
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
            // 这里可能是regl的bug: 如果启用下面的代码，aTerrainAltitude不会看作instance属性数据（divisor = 1），导致无法绘制，原因未知
            //
            // const isRenderingTerrainVector = context.isRenderingTerrain;
            // if (isRenderingTerrainVector) {
            //     meshes = meshes.filter(m => m.properties.tile.terrainTileInfos);
            // }
            const timestamp = context.timestamp;
            for (let i = 0; i < meshes.length; i++) {
                if (!meshes[i] || !meshes[i].geometry) {
                    continue;
                }
                if (meshes[i].instancedData.aTerrainAltitude) {
                    this._updateTerrainAltitude(meshes[i], meshes[i].instancedData, meshes[i].properties, 3, context);
                }
                const symbolIndex = meshes[i].properties.symbolIndex.index;
                const isAnimated = this._isSkinAnimating(symbolIndex);
                if (isAnimated) {
                    this._updateAnimation(meshes[i], symbolIndex, timestamp);
                }
                meshes[i].setUniform('skinAnimation', +isAnimated);
                this._highlightMesh(meshes[i]);
            }
            this.scene.addMesh(meshes);
            return this;
        }

        _updateATerrainAltitude(mesh, aTerrainAltitude) {
            if (!mesh) {
                return;
            }
            if (mesh.updateInstancedData) {
                mesh.updateInstancedData('aTerrainAltitude', aTerrainAltitude);
            }
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
                        break;
                    }
                    // let speed = symbol.speed;
                    // const loop = !!symbol.loop;
                    // if (isNil(speed)) {
                    //     speed = 1;
                    // }
                    // this._gltfPack[i].updateAnimation(context.timestamp, loop, speed);
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
            return !!(symbol && symbol.animation && this._gltfPack[index] && this._gltfPack[index][0] && this._gltfPack[index][0].hasSkinAnimation());
        }

        _updateInstanceData(instanceData, tileTranslationMatrix, tileExtent, tileZoom, geometryData, positionSize, features) {
            function setInstanceData(name, idx, matrix, col) {
                instanceData[name][idx * 4] = matrix[col];
                instanceData[name][idx * 4 + 1] = matrix[col + 4];
                instanceData[name][idx * 4 + 2] = matrix[col + 8];
                instanceData[name][idx * 4 + 3] = matrix[col + 12];
            }
            const { aPosition, aPickingId, aXYRotation, aZRotation, aAltitude, aScaleXYZ } = geometryData;
            const count = aPosition.length / positionSize;
            const tileSize = this.layer.getTileSize().width;
            const tileScale = tileSize / tileExtent * this.layer.getRenderer().getTileGLScale(tileZoom);
            const zScale = this.layer.getRenderer().getZScale();
            const altitudeOffset = (this.dataConfig.altitudeOffset || 0) * 100;
            let minx = Infinity, miny = Infinity, minz = Infinity;
            let maxx = -Infinity, maxy = -Infinity, maxz = -Infinity;
            const position = [];
            const vertex = [];
            for (let i = 0; i < count; i++) {
                if (aAltitude) {
                    vec3.set(vertex, aPosition[i * positionSize], aPosition[i * positionSize + 1], aAltitude[i]);
                } else {
                    PackUtil.unpackPosition(vertex, aPosition[i * positionSize], aPosition[i * positionSize + 1], aPosition[i * positionSize + 2]);
                }

                const pos = vec3.set(
                    position,
                    vertex[0] * tileScale,
                    //vt中的y轴方向与opengl(maptalks世界坐标系)相反
                    -vertex[1] * tileScale,
                    (vertex[2] + altitudeOffset) * zScale
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
            const cx = (minx + maxx) / 2;
            const cy = (miny + maxy) / 2;
            const cz = (minz + maxz) / 2;
            const mat = [];

            // 如果没有 fn type，trs会作为positionMatrix设置到mesh上
            const hasFnType = this._hasFuncType();
            const zAxis = [0, 0, 1];
            const rotateOrigin = [0, 0, 0];

            for (let i = 0; i < count; i++) {
                if (aAltitude) {
                    vec3.set(vertex, aPosition[i * positionSize], aPosition[i * positionSize + 1], aAltitude[i]);
                } else {
                    PackUtil.unpackPosition(vertex, aPosition[i * positionSize], aPosition[i * positionSize + 1], aPosition[i * positionSize + 2]);
                }
                const x = vertex[0];
                const y = vertex[1];
                const pos = vec3.set(
                    position,
                    x * tileScale  - cx,
                    //vt中的y轴方向与opengl(maptalks世界坐标系)相反
                    -y * tileScale - cy,
                    (vertex[2] + altitudeOffset) * zScale - cz
                );

                const aScale = vec3.set(TEMP_SCALE, 1, 1, 1);
                if (aScaleXYZ) {
                    vec3.set(aScale, aScaleXYZ[i * 3], aScaleXYZ[i * 3 + 1], aScaleXYZ[i * 3 + 2]);
                    mat4.fromScaling(TEMP_SCALE_MAT, aScale);
                }
                const xyRotation = aXYRotation && aXYRotation[i] || 0;
                const zRotation = aZRotation && aZRotation[i] || 0;
                if (!xyRotation && !zRotation) {
                    mat4.fromTranslation(mat, pos);
                    if (aScaleXYZ) {
                        mat4.multiply(mat, mat, TEMP_SCALE_MAT);
                    }
                } else {
                    // const quaterion = quat.fromEuler([], xRotation * 180 / Math.PI, yRotation * 180 / Math.PI, zRotation * 180 / Math.PI);
                    mat4.fromRotation(mat, zRotation, zAxis);
                    const v = vec3.set(V3, Math.cos(zRotation), Math.sin(zRotation), 0);
                    const axis = vec3.rotateZ(v, v, rotateOrigin, 90 * Math.PI / 180);
                    mat4.rotate(mat, mat, xyRotation, axis);
                    if (aScaleXYZ) {
                        mat4.multiply(mat, mat, TEMP_SCALE_MAT);
                    }
                    const tMat = mat4.fromTranslation(TEMP_MATRIX, pos);
                    mat4.multiply(mat, tMat, mat);
                }

                if (hasFnType) {
                    let trs = this._getSymbolTRSMatrix(TEMP_MATRIX, features, aPickingId, i);
                    const meterScale = this._getMeterScale();
                    const meterToPointMat = mat4.identity([]);
                    mat4.scale(meterToPointMat, meterToPointMat, [meterScale, meterScale, meterScale]);
                    trs = mat4.multiply([], meterToPointMat, trs);
                    mat4.multiply(mat, mat, trs);
                }

                setInstanceData('instance_vectorA', i, mat, 0);
                setInstanceData('instance_vectorB', i, mat, 1);
                setInstanceData('instance_vectorC', i, mat, 2);
                instanceData['aPickingId'][i] = aPickingId[i];
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

            let sx = symbolDef['scaleX'] || 1;
            let sy = symbolDef['scaleY'] || 1;
            let sz = symbolDef['scaleZ'] || 1;

            const idx = aPickingId && aPickingId[i];
            const feature = features && features[idx];

            const zoom = map.getZoom();
            const properties = feature && feature.feature && feature.feature.properties;

            const heightScale = this._getModelHeightScale(zoom, properties);

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
            const scale = vec3.set(TEMP_V3_2, sx * heightScale, sy * heightScale, sz * heightScale);

            return this._getGLTFMatrix(out, translation, rotation, scale);
        }

        _getModelHeightScale(zoom, properties) {
            const symbolDef = this.symbolDef[0];
            let modelHeight = this._modelHeightFn ? this._modelHeightFn(zoom, properties) : symbolDef['modelHeight'];
            if (isNil(modelHeight)) {
                return 1;
            }

            const bbox = this._gltfBBox[0];
            return modelHeight / (Math.abs(bbox.max[1] - bbox.min[1]));//YZ轴做了翻转，所以需要用y方向来算高度比例
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
            if (isFunctionDefinition(symbolDef['modelHeight'])) {
                this._modelHeightFn = interpolated(symbolDef['modelHeight']);
            }
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
            return !!(this._modelHeightFn && !this._modelHeightFn.isFeatureConstant || this._txFn && !this._txFn.isFeatureConstant || this._tyFn && !this._tyFn.isFeatureConstant || this._tzFn && !this._tzFn.isFeatureConstant ||
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
            this._gltfJSON = [];
            this._gltfBBox = [];
            this._gltfMeshInfos = [];
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
                        const { gltfPack: pack, json, bbox } = gltfData;
                        this._gltfPack[i] = [pack];
                        this._gltfMeshInfos[i] = pack.getMeshesInfo();
                        this._gltfJSON[i] = json;
                        this._gltfBBox[i] = bbox;
                        this._loaded++;
                        if (this._loaded >= symbols.length) {
                            this._ready = true;
                        }
                        this.setToRedraw(true);
                    });
                } else {
                    const { gltfPack: pack, json, bbox } = gltfRes;
                    if (pack) {
                        this._gltfPack[i] = [pack];
                        this._gltfMeshInfos[i] = pack.getMeshesInfo();
                        this._gltfJSON[i] = json;
                        this._gltfBBox[i] = bbox;
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

        getPickingWGSLVert() {
            return pickingWGSLVert;
        }

        deleteMesh(meshes) {
            if (!meshes) {
                return;
            }
            this.scene.removeMesh(meshes);
            //geometry应该一直保留，在painter.delete中才删除
            for (let i = 0; i < meshes.length; i++) {
                const skinmap = this._skinMap && this._skinMap[meshes[i].uuid];
                if (skinmap) {
                    for (const p in skinmap) {
                        if (skinmap[p].jointTexture) {
                            skinmap[p].jointTexture.destroy();
                        }
                    }

                    delete this._skinMap[meshes[i].uuid];
                }
                meshes[i].disposeInstancedData();
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
            if (this._skinMap) {
                for (const uuid in this._skinMap) {
                    const skinmap = this._skinMap[uuid];
                    for (const p in skinmap) {
                        if (skinmap[p].jointTexture) {
                            skinmap[p].jointTexture.destroy();
                        }
                    }
                }
                delete this._skinMap;
            }
            delete this._nodeMatrixMap;

        }

        _getGLTFMatrix(out, t, r, s) {
            const translation = vec3.set(V3, ...(t || DEFAULT_TRANSLATION));
            const rotation = r || DEFAULT_ROTATION;
            const scale = s || DEFAULT_SCALE;
            const eluerQuat = quat.fromEuler(Q4, rotation[0], rotation[1], rotation[2]);
            return mat4.fromRotationTranslationScale(out, eluerQuat, translation, scale);
        }

        shouldDrawParentTile() {
            return false;
        }
    };

export default GLTFMixin;

// function getFitExtent(map, fitSize) {
//     return fitSize * map.getGLScale();
// }

function generatePickingIndiceIndex(aPickingId) {
    const pickingIdIndiceMap = new Map();
    for (let i = 0; i < aPickingId.length; i++) {
        const id = aPickingId[i];
        let index = pickingIdIndiceMap.get(id);
        if (!index) {
            // pickingIdIndiceMap[id] = [];
            index = [];
            pickingIdIndiceMap.set(id, index);
        }
        index.push(i);
    }
    return pickingIdIndiceMap;
}

function interpolate(from, to, t) {
    const x = lerp(from.x, to.x, t);
    const y = lerp(from.y, to.y, t);
    const z1 = from.z || 0;
    const z2 = to.z || 0;
    const z = lerp(z1, z2, t);
    return new from.constructor(x, y, z);
}
function lerp(a, b, t) {
    return a + t * (b - a);
}
