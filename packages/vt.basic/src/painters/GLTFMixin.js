import { vec3, mat4, quat, reshader } from '@maptalks/gl';
import { setUniformFromSymbol, createColorSetter, isNil, isNumber } from '../Util';

const V3 = [];
const Q4 = [];
const DEFAULT_TRANSLATION = [0, 0, 0];
const DEFAULT_ROTATION = [0, 0, 0];
const DEFAULT_SCALE = [1, 1, 1];

const EMPTY_ARRAY = [];
const DEFAULT_POLYGON_FILL = [1, 1, 1, 1];

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

const GLTFMixin = Base =>

    class extends Base {
        constructor(regl, layer, symbol, sceneConfig, pluginIndex) {
            super(regl, layer, symbol, sceneConfig, pluginIndex);
            this._ready = false;
            this.scene.sortFunction = this.sortByCommandKey;
        }

        createGeometry(glData, features) {
            if (!glData) {
                return null;
            }
            this._initGLTF();
            if (!this._ready) {
                return null;
            }
            const { data, positionSize } = glData;
            return {
                properties: {},
                data,
                positionSize,
                features
            };
        }

        getFnTypeConfig() {
            return EMPTY_ARRAY;
        }

        createMesh(geometry, transform, { tileTranslationMatrix, tileExtent }) {
            const map = this.getMap();
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
                'instance_vectorD': new Float32Array(count * 4),
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

            const { translation, rotation, scale } = this.getSymbol();
            const gltfMatrix = this._getGLTFMatrix([], translation, rotation, scale);
            const meshInfos = this._gltfMeshInfos;
            const symbol = this.getSymbol();
            const meshes = meshInfos.map(info => {
                const { geometry, nodeMatrix, materialInfo, skin, morphWeights } = info;
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
                setUniformFromSymbol(mesh.uniforms, 'polygonFill', symbol, 'polygonFill', DEFAULT_POLYGON_FILL, createColorSetter(this._colorCache));
                setUniformFromSymbol(mesh.uniforms, 'polygonOpacity', symbol, 'polygonOpacity', 1);
                // mesh.setPositionMatrix(mat4.multiply([], gltfMatrix, nodeMatrix));
                const positionMatrix = mat4.multiply([], gltfMatrix, nodeMatrix);

                const matrix = [];
                mesh.setPositionMatrix(() => {
                    const fixZoom = this.getSymbol().fixSizeOnZoom;
                    if (isNumber(fixZoom)) {
                        const scale = map.getGLScale() / map.getGLScale(fixZoom);
                        vec3.set(V3, scale, scale, scale);
                        // vec3.set(V3, scale, scale, scale);
                        mat4.fromScaling(matrix, V3);
                        return mat4.multiply(matrix, matrix, positionMatrix);
                    } else {
                        return positionMatrix;
                    }
                });
                mesh.setLocalTransform(tileTranslationMatrix);

                geometry.generateBuffers(this.regl);
                //上面已经生成了buffer，无需再生成
                // mesh.generateInstancedBuffers(this.regl);
                if (instanceData['instance_color']) {
                    defines['HAS_INSTANCE_COLOR'] = 1;
                }
                mesh.properties.features = features;
                mesh.setDefines(defines);
                return mesh;
            });
            meshes.insContext = {
                instanceData,
                tileTranslationMatrix,
                tileExtent,
                aPosition,
                positionSize
            };

            return meshes;
        }

        addMesh(meshes) {
            if (!meshes) {
                return null;
            }
            const level = meshes[0].properties.level;
            if (level > 2) {
                return null;
            }
            const isAnimated = this._isSkinAnimating();
            for (let i = 0; i < meshes.length; i++) {
                meshes[i].setUniform('skinAnimation', +isAnimated);
            }
            this.scene.addMesh(meshes);
            return this;
        }

        preparePaint(context) {
            const isAnimated = this._isSkinAnimating();
            if (isAnimated && this._gltfPack) {
                let speed = this.sceneConfig.gltfAnimation.speed;
                if (isNil(speed)) {
                    speed = 1;
                }
                this._gltfPack.updateAnimation(context.timestamp, true, speed);
            }
            if (isAnimated) {
                //TODO retire shadow frame，可能会造成性能问题
                this.setToRedraw(true);
            }
            super.preparePaint(context);
        }

        getShadowMeshes() {
            if (!this.isVisible()) {
                return EMPTY_ARRAY;
            }
            this.shadowCount = this.scene.getMeshes().length;
            const meshes = this.scene.getMeshes().filter(m => m.getUniform('level') === 0);
            return meshes;
        }

        _isSkinAnimating() {
            return !!(this.sceneConfig.gltfAnimation && this.sceneConfig.gltfAnimation.enable) && this._gltfPack && this._gltfPack.hasSkinAnimation();
        }

        _updateInstanceData(instanceData, tileTranslationMatrix, tileExtent, tileZoom, aPosition, positionSize) {
            function setInstanceData(name, idx, start, stride, matrix) {
                instanceData[name][idx * 4] = matrix[start * stride];
                instanceData[name][idx * 4 + 1] = matrix[start * stride + 1];
                instanceData[name][idx * 4 + 2] = matrix[start * stride + 2];
                instanceData[name][idx * 4 + 3] = matrix[start * stride + 3];
            }


            const count = aPosition.length / positionSize;
            const tileSize = this.layer.getTileSize();
            const tileScale = tileSize.width / tileExtent * this.layer.getMap().getGLScale(tileZoom);
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
                setInstanceData('instance_vectorA', i, 0, 4, mat);
                setInstanceData('instance_vectorB', i, 1, 4, mat);
                setInstanceData('instance_vectorC', i, 2, 4, mat);
                setInstanceData('instance_vectorD', i, 3, 4, mat);
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

        _initGLTF() {
            if (this._gltfPack) {
                return;
            }
            const url = this.getSymbol().url;
            const renderer = this.layer.getRenderer();
            if (renderer.isCachePlaced(url)) {
                return;
            }
            const cacheItem = renderer.fetchCache(url);
            if (cacheItem) {
                this._gltfPack = cacheItem;
                this._gltfMeshInfos = cacheItem.getMeshesInfo();
                this._ready = true;
                renderer.addToCache(url);
            } else {
                renderer.placeCache(url);
                reshader.GLTFHelper.load(url).then(gltfData => {
                    const pack = reshader.GLTFHelper.exportGLTFPack(gltfData, this.regl);
                    this._gltfPack = pack;
                    this._gltfMeshInfos = pack.getMeshesInfo();
                    renderer.addToCache(url, pack, pack => {
                        pack.dispose();
                    });
                    this._ready = true;
                    this.setToRedraw(true);
                });
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
            const url = this.getSymbol().url;
            const renderer = this.layer.getRenderer();
            renderer.removeCache(url);
            if (this._gltfMeshInfos) {
                this._gltfMeshInfos.forEach(info => {
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
                });
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
