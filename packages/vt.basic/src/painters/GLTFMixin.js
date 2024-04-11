import { vec3, mat4, quat, reshader } from '@maptalks/gl';
import { setUniformFromSymbol, createColorSetter, isNil, isNumber, extend } from '../Util';

const V3 = [];
const Q4 = [];
const DEFAULT_TRANSLATION = [0, 0, 0];
const DEFAULT_ROTATION = [0, 0, 0];
const DEFAULT_SCALE = [1, 1, 1];

const EMPTY_ARRAY = [];
const DEFAULT_POLYGON_FILL = [1, 1, 1, 1];
const TEMP_MATRIX = [];

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
        constructor(regl, layer, symbol, sceneConfig, pluginIndex) {
            super(regl, layer, symbol, sceneConfig, pluginIndex);
            this._ready = false;
            this.scene.sortFunction = this.sortByCommandKey;
            this._gltfMeshInfos = [];
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
            this._initGLTF();
            if (!this._ready) {
                return null;
            }
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
            const map = this.getMap();
            const { geometry } = geo;
            const { positionSize, features } = geometry;
            const { aPosition } = geometry.data;
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
            this._updateInstanceData(instanceData, tileTranslationMatrix, tileExtent, geometry.properties.z, aPosition, positionSize);
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

            const meshes = [];
            const symbols = this.getSymbols();
            for (let i = 0; i < symbols.length; i++) {
                const symbol = symbols[i];
                const meshInfos = this._gltfMeshInfos[i];
                if (!meshInfos) {
                    continue;
                }

                const { translation, rotation, scale, fixSizeOnZoom } = symbol;
                const gltfMatrix = this._getGLTFMatrix([], translation, rotation, scale);
                let zOffset = 0;
                //获取多个mesh中，最大的zOffset，保证所有mesh的zOffset是统一的
                meshInfos.forEach(info => {
                    const { geometry, nodeMatrix } = info;
                    const positionMatrix = mat4.multiply(TEMP_MATRIX, gltfMatrix, nodeMatrix);
                    const gltfBBox = geometry.boundingBox;
                    const meshBox = gltfBBox.copy();
                    meshBox.transform(positionMatrix);

                    const offset = this._calAnchorTranslation(meshBox, symbol);
                    if (offset > zOffset) {
                        zOffset = offset;
                    }
                });
                const anchorTranslation = [0, 0, zOffset];
                const childMeshes = meshInfos.map(info => {
                    const { geometry, nodeMatrix, materialInfo, skin, morphWeights, extraInfo } = info;
                    const MatClazz = this.getMaterialClazz(materialInfo);
                    const material = new MatClazz(materialInfo);
                    const defines = {};
                    // material.set('uOutputLinear', 1);
                    const mesh = new reshader.InstancedMesh(instanceBuffers, count, geometry, material, {
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
                    setUniformFromSymbol(mesh.uniforms, 'polygonFill', symbol, 'polygonFill', DEFAULT_POLYGON_FILL, createColorSetter(this.colorCache));
                    setUniformFromSymbol(mesh.uniforms, 'polygonOpacity', symbol, 'polygonOpacity', 1);
                    // mesh.setPositionMatrix(mat4.multiply([], gltfMatrix, nodeMatrix));
                    const positionMatrix = mat4.multiply([], gltfMatrix, nodeMatrix);
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
                    mesh.setLocalTransform(tileTranslationMatrix);

                    geometry.generateBuffers(this.regl, { excludeElementsInVAO: true });
                    //上面已经生成了buffer，无需再生成
                    // mesh.generateInstancedBuffers(this.regl);
                    if (instanceData['instance_color']) {
                        defines['HAS_INSTANCE_COLOR'] = 1;
                    }
                    mesh.properties.features = features;
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

        addMesh(meshes) {
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
                const isAnimated = this._isSkinAnimating(meshes[i].properties.symbolIndex.index);
                meshes[i].setUniform('skinAnimation', +isAnimated);
            }
            this.scene.addMesh(meshes);
            return this;
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
            const meshes = this.scene.getMeshes().filter(m => m.getUniform('level') === 0);
            return meshes;
        }

        _isSkinAnimating(index) {
            const symbols = this.getSymbols();
            const symbol = symbols[index];
            return symbol && symbol.animation && this._gltfPack[index] && this._gltfPack[index].hasSkinAnimation();
        }

        _updateInstanceData(instanceData, tileTranslationMatrix, tileExtent, tileZoom, aPosition, positionSize) {
            function setInstanceData(name, idx, matrix, col) {
                instanceData[name][idx * 4] = matrix[col];
                instanceData[name][idx * 4 + 1] = matrix[col + 4];
                instanceData[name][idx * 4 + 2] = matrix[col + 8];
                instanceData[name][idx * 4 + 3] = matrix[col + 12];
            }


            const count = aPosition.length / positionSize;
            const tileSize = this.layer.getTileSize();
            const tileScale = tileSize.width / tileExtent * this.layer.getRenderer().getTileGLScale(tileZoom);
            const zScale = this.layer.getRenderer().getZScale();
            const position = [];
            const mat = [];
            for (let i = 0; i < count; i++) {
                const pos = vec3.set(
                    position,
                    aPosition[i * positionSize] * tileScale,
                    //vt中的y轴方向与opengl(maptalks世界坐标系)相反
                    -aPosition[i * positionSize + 1] * tileScale,
                    positionSize === 2 ? 0 : aPosition[i * positionSize + 2] * zScale
                );
                mat4.fromTranslation(mat, pos);
                setInstanceData('instance_vectorA', i, mat, 0);
                setInstanceData('instance_vectorB', i, mat, 1);
                setInstanceData('instance_vectorC', i, mat, 2);
                instanceData['aPickingId'][i] = i;
            }
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


        //TODO 缺乏GLTF模型的更新逻辑
        //TODO 缺乏多个symbols的支持
        _initGLTF() {
            if (this._gltfPack) {
                return;
            }
            this._gltfPack = [];
            const renderer = this.layer.getRenderer();
            const symbols = this.getSymbols();
            this._loaded = 0;
            for (let i = 0; i < symbols.length; i++) {
                const symbol = symbols[i];
                const url = symbol.url;
                if (renderer.isCachePlaced(url)) {
                    continue;
                }
                const cacheItem = renderer.fetchCache(url);
                if (cacheItem) {
                    this._gltfPack[i] = [cacheItem];
                    this._gltfMeshInfos[i] = cacheItem.getMeshesInfo();
                    this._loaded++;
                    renderer.addToCache(url);
                } else {
                    renderer.placeCache(url);
                    reshader.GLTFHelper.load(url).then(gltfData => {
                        const pack = reshader.GLTFHelper.exportGLTFPack(gltfData, this.regl);
                        this._gltfPack[i] = [pack];
                        this._gltfMeshInfos[i] = pack.getMeshesInfo();
                        renderer.addToCache(url, pack, pack => {
                            pack.dispose();
                        });
                        this._loaded++;
                        if (this._loaded >= symbols.length) {
                            this._ready = true;
                        }
                        this.setToRedraw(true);
                    });
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
                meshes[i].disposeInstancedData();
                meshes[i].dispose();
            }
        }

        delete(/* context */) {
            super.delete();
            const url = this.getSymbols()[0].url;
            const renderer = this.layer.getRenderer();
            renderer.removeCache(url);
            if (this._gltfMeshInfos) {
                for (let i = 0; i < this._gltfMeshInfos.length; i++) {
                    const meshInfos = this._gltfMeshInfos[i];
                    for (let j = 0; j < meshInfos.length; j++) {
                        const info = meshInfos[i];
                        const { geometry, materialInfo } = info;
                        if (geometry) {
                            geometry.dispose();
                        }
                        if (materialInfo) {
                            for (const p in materialInfo) {
                                if (materialInfo[p] && materialInfo[p].destroy) {
                                    materialInfo[p].destroy();
                                }
                            }
                        }
                    }
                }
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
